import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Parser from 'rss-parser';

// Semantic Scholar API 获取论文信息
async function getPaperInfoFromSemanticScholar(title: string): Promise<{
  abstract?: string;
  authors?: string;
} | null> {
  try {
    // 清理标题：移除 HTML 标签和多余空白
    const cleanTitle = title
      .replace(/<[^>]*>/g, '') // 移除 HTML 标签
      .replace(/\s+/g, ' ')     // 合并空白
      .trim();

    if (!cleanTitle || cleanTitle.length < 5) {
      return null;
    }

    // 构建查询 URL
    const params = new URLSearchParams({
      query: cleanTitle,
      fields: 'paperId,title,abstract,authors',
      limit: '1',
    });

    const url = `https://api.semanticscholar.org/graph/v1/paper/search?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Paper-Management-System/1.0',
      },
    });

    if (!response.ok) {
      console.log(`⚠️ Semantic Scholar API 调用失败: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.data && data.data.length > 0) {
      const paper = data.data[0];

      // 提取作者信息
      const authors = paper.authors?.map((a: any) => a.name).join(', ') || '';

      return {
        abstract: paper.abstract || undefined,
        authors: authors || undefined,
      };
    }

    return null;
  } catch (error) {
    console.error('Semantic Scholar API 调用异常:', error);
    return null;
  }
}

// 从 Elsevier 的 content 中提取作者信息
function extractAuthorsFromContent(content: string): string | null {
  if (!content) return null;

  try {
    // 解码 HTML 实体
    let decoded = content
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');

    // 针对 Elsevier 的特定格式：<p>Author(s): ...</p>
    const elsevierAuthorPatterns = [
      /<p>\s*Author\(s\):\s*([^<]+?)\s*<\/p>/i,
      /<p>Author\(s\):\s*(.*?)<\/p>/i,
      /Author\(s\):\s*([^<\n]+?)(?:\n|<|$)/i,
    ];

    for (const pattern of elsevierAuthorPatterns) {
      const match = decoded.match(pattern);
      if (match && match[1]) {
        const authors = match[1].trim();
        if (authors.length > 0 && authors.length < 500) {
          return authors;
        }
      }
    }

    // 备用方案：移除 HTML 标签后匹配
    const textOnly = decoded.replace(/<[^>]*>/g, ' ');

    // 尝试匹配常见的作者模式：
    const authorPatterns = [
      /Author\(s\):\s*([^\n\.]+?)(?:\.|Keywords|Abstract|$)/i,
      /(?:Author|Authors?)[:\s]+([^\n\.]+?)(?:\.|Keywords|Abstract|$)/i,
      /(?:By|by)\s+([^\n\.]+?)(?:\.|Keywords|Abstract|$)/i,
    ];

    for (const pattern of authorPatterns) {
      const match = textOnly.match(pattern);
      if (match && match[1]) {
        const authors = match[1].trim();
        if (authors.length > 0 && authors.length < 500) {
          return authors;
        }
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

// 清理 Elsevier 摘要
function cleanElsevierAbstract(text: string): string {
  if (!text) return '';

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

export async function POST(request: Request) {
  const { sourceIds, keywords } = await request.json();

  try {
    const parser = new Parser();
    const papers: any[] = [];

    // 获取要预览的RSS源
    const sources = sourceIds && sourceIds.length > 0
      ? await prisma.rssSource.findMany({
          where: { id: { in: sourceIds }, isActive: true },
        })
      : await prisma.rssSource.findMany({
          where: { isActive: true },
        });

    console.log(`🔍 预览 ${sources.length} 个RSS源...`);

    for (const source of sources) {
      try {
        console.log(`  📡 获取: ${source.name}`);
        const feed = await parser.parseURL(source.url);

        // 检查是否是 Elsevier RSS
        const isElsevier = source.name.toLowerCase().includes('elsevier') ||
                          source.url.toLowerCase().includes('elsevier') ||
                          source.url.toLowerCase().includes('sciencedirect');

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
                continue;
              }
            }

            // 去重检查
            const existing = await prisma.paper.findFirst({
              where: {
                OR: [
                  { title: item.title || '' },
                ],
              },
            });

            if (existing) {
              continue; // 跳过已存在的论文
            }

            // 提取作者和摘要（不调用 Semantic Scholar）
            let authors = item.creator || item['dc:creator'] || 'Unknown';
            let abstract = '';
            let hasAbstract = false;

            if (isElsevier) {
              // 从 content 中提取作者信息
              const extractedAuthors = extractAuthorsFromContent(item.content || '');
              if (extractedAuthors) {
                authors = extractedAuthors;
              }

              // 清理 RSS 中的摘要（不调用 Semantic Scholar）
              abstract = cleanElsevierAbstract(item['description'] || item.content || item.contentSnippet || '');
              hasAbstract = abstract.length > 50;
            } else {
              // 非 Elsevier 论文，使用默认清理方法
              abstract = (item.contentSnippet || item.content || '').replace(/<[^>]*>/g, '').trim();
              hasAbstract = abstract.length > 50;
            }

            papers.push({
              title: item.title || 'Unknown Title',
              authors: authors,
              abstract: abstract.substring(0, 500), // 限制长度
              hasAbstract: hasAbstract, // 标记是否有摘要
              link: item.link || '',
              pubDate: item.pubDate || null,
              sourceName: source.name,
              sourceId: source.id,
            });
          } catch (error) {
            console.error(`    ❌ 处理论文失败:`, error);
          }
        }

        console.log(`  ✅ ${source.name}: 找到 ${papers.filter(p => p.sourceId === source.id).length} 篇新论文`);
      } catch (error) {
        console.error(`  ❌ RSS源 ${source.name} 失败:`, error);
      }
    }

    console.log(`🎉 预览完成！共找到 ${papers.length} 篇新论文`);

    return NextResponse.json({
      success: true,
      papers,
      total: papers.length,
    });
  } catch (error: any) {
    console.error('预览RSS失败：', error);
    return NextResponse.json(
      { error: '预览失败', details: error?.message },
      { status: 500 }
    );
  }
}
