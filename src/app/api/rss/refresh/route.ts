import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Parser from 'rss-parser';

// AI摘要生成函数（直接内联调用）
async function generateAISummary(abstract: string): Promise<string | null> {
  try {
    // 这里直接调用 OpenAI SDK，不通过 API 路由
    const OpenAI = require('openai');
    const client = new OpenAI({
      apiKey: process.env.GLM_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
    });

    const response = await client.chat.completions.create({
      model: 'glm-4-flash',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的论文助手，能够用简洁明了的语言总结学术论文的核心内容。',
        },
        {
          role: 'user',
          content: `请用中文总结以下论文摘要，突出核心贡献和要点（2-3句话）：\n\n${abstract}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const summary = response.choices[0]?.message?.content?.trim();
    return summary || null;
  } catch (error) {
    console.error('生成AI摘要失败:', error);
    return null;
  }
}

export async function POST(request: Request) {
  const { sourceIds, keywords } = await request.json();

  try {
    const parser = new Parser();
    let totalAdded = 0;
    let totalSkipped = 0;
    const results: any[] = [];

    // 获取要刷新的RSS源
    const sources = sourceIds && sourceIds.length > 0
      ? await prisma.rssSource.findMany({
          where: { id: { in: sourceIds }, isActive: true },
        })
      : await prisma.rssSource.findMany({
          where: { isActive: true },
        });

    console.log(`🔄 开始刷新 ${sources.length} 个RSS源...`);

    for (const source of sources) {
      try {
        console.log(`  📡 获取: ${source.name}`);
        const feed = await parser.parseURL(source.url);

        let sourceAdded = 0;
        let sourceSkipped = 0;

        // 解析关键词
        const keywordList = keywords
          ? keywords.split(',').map((k: string) => k.trim().toLowerCase()).filter((k: string) => k)
          : [];

        for (const item of feed.items) {
          try {
            // 检查关键词筛选
            if (keywordList.length > 0) {
              const title = (item.title || '').toLowerCase();
              const description = (item.contentSnippet || item.content || '').toLowerCase();
              const matchesKeyword = keywordList.some((keyword: string) =>
                title.includes(keyword) || description.includes(keyword)
              );

              if (!matchesKeyword) {
                sourceSkipped++;
                continue;
              }
            }

            // 提取arXiv ID（如果存在）
            const arxivId = extractArxivId(item.link || '');
            const pdfUrl = item.link || '';

            // 去重检查（根据arxivId或标题）
            const existing = await prisma.paper.findFirst({
              where: {
                OR: [
                  { arxivId: arxivId || undefined },
                  { title: item.title || '' },
                ],
              },
            });

            if (existing) {
              sourceSkipped++;
              continue;
            }

            // 检查是否是 Elsevier RSS
            const isElsevier = source.name.toLowerCase().includes('elsevier') ||
                              source.url.toLowerCase().includes('elsevier');

            // 清理摘要（针对 Elsevier 进行特殊处理）
            const abstract = isElsevier
              ? cleanElsevierAbstract(item.content || item.contentSnippet || item['description'] || '')
              : cleanAbstract(item.contentSnippet || item.content || '');

            // 保存论文
            const paper = await prisma.paper.create({
              data: {
                title: item.title || 'Unknown Title',
                authors: extractAuthors(item),
                abstract: abstract,
                arxivId: arxivId,
                pdfUrl: pdfUrl,
              },
            });

            // 如果是 Elsevier 论文且有摘要，自动生成 AI 摘要
            if (isElsevier && abstract && abstract.length > 50) {
              try {
                const aiSummary = await generateAISummary(abstract);
                if (aiSummary) {
                  await prisma.paper.update({
                    where: { id: paper.id },
                    data: { tldr: aiSummary },
                  });
                  console.log(`    🤖 AI摘要已生成`);
                }
              } catch (error) {
                console.log(`    ⚠️ AI摘要生成失败，继续处理`);
              }
            }

            sourceAdded++;
            totalAdded++;
            console.log(`    ✅ 添加: ${paper.title.substring(0, 50)}...`);
          } catch (error) {
            console.error(`    ❌ 处理论文失败:`, error);
            sourceSkipped++;
          }
        }

        results.push({
          sourceId: source.id,
          sourceName: source.name,
          added: sourceAdded,
          skipped: sourceSkipped,
          total: feed.items.length,
        });

        console.log(`  ✅ ${source.name}: 添加 ${sourceAdded} 篇，跳过 ${sourceSkipped} 篇`);
      } catch (error) {
        console.error(`  ❌ RSS源 ${source.name} 失败:`, error);
        results.push({
          sourceId: source.id,
          sourceName: source.name,
          error: error instanceof Error ? error.message : '未知错误',
        });
      }
    }

    console.log(`🎉 刷新完成！共添加 ${totalAdded} 篇论文，跳过 ${totalSkipped} 篇`);

    return NextResponse.json({
      success: true,
      totalAdded,
      totalSkipped,
      results,
    });
  } catch (error: any) {
    console.error('刷新RSS失败：', error);
    return NextResponse.json(
      { error: '刷新失败', details: error?.message },
      { status: 500 }
    );
  }
}

// 提取arXiv ID
function extractArxivId(url: string): string | null {
  const match = url.match(/arxiv\.org\/abs\/(\d+\.\d+)/);
  return match ? match[1] : null;
}

// 提取作者
function extractAuthors(item: any): string {
  // 尝试从不同的字段提取作者
  if (item.creator) return item.creator;
  if (item['dc:creator']) return item['dc:creator'];
  return 'Unknown';
}

// 清理摘要
function cleanAbstract(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // 移除HTML标签
    .replace(/\s+/g, ' ')     // 合并空白字符
    .trim();
}

// 清理 Elsevier 摘要（处理 HTML 实体和复杂格式）
function cleanElsevierAbstract(text: string): string {
  // 解码 HTML 实体
  let decoded = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&copy;/g, '©')
    .replace(/&reg;/g, '®')
    .replace(/&trade;/g, '™')
    .replace(/&euro;/g, '€')
    .replace(/&pound;/g, '£')
    .replace(/&yen;/g, '¥')
    .replace(/&cent;/g, '¢');

  // 移除 HTML 标签
  decoded = decoded.replace(/<[^>]*>/g, '');

  // 移除常见的 Elsevier 模板文本
  decoded = decoded
    .replace(/Abstract:[\s]*/i, '')
    .replace(/©\s*\d{4}\s*Elsevier[^]*/g, '')
    .replace(/Rights and content[^]*/g, '')
    .replace(/Download full text[^]*/g, '');

  // 合并空白字符
  decoded = decoded.replace(/\s+/g, ' ').trim();

  return decoded;
}
