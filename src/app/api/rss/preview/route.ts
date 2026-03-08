import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Parser from 'rss-parser';

// 从 Elsevier 的 content 中提取发表日期
function extractPublicationDateFromContent(content: string): Date | null {
  if (!content) {
    console.log(`    ⚠️ content 为空，无法提取日期`);
    return null;
  }

  try {
    // 解码 HTML 实体
    let decoded = content
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');

    console.log(`    🔍 尝试从 content 提取日期...`);
    console.log(`    📝 Content 预览: ${decoded.substring(0, 200)}...`);

    // 匹配模式: <p>Publication date: 2 May 2026</p>
    const datePatterns = [
      /<p>\s*Publication date:\s*([^<]+?)\s*<\/p>/i,
      /Publication date:\s*([^<\n]+)/i,
    ];

    for (const pattern of datePatterns) {
      const match = decoded.match(pattern);
      console.log(`    🔎 匹配模式: ${pattern}, 结果:`, match ? `找到: ${match[1]}` : '未匹配');
      if (match && match[1]) {
        const dateStr = match[1].trim();
        console.log(`    📅 日期字符串: "${dateStr}"`);
        // 尝试解析日期
        const parsedDate = new Date(dateStr);
        console.log(`    ✅ 解析结果: ${parsedDate.toISOString()}`);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
    }

    console.log(`    ⚠️ 所有模式都未匹配到日期`);
    return null;
  } catch (error) {
    console.error(`    ❌ 提取日期异常:`, error);
    return null;
  }
}

// 从 Elsevier 的 content 中提取期刊名
function extractJournalFromContent(content: string): string | null {
  if (!content) {
    console.log(`    ⚠️ content 为空，无法提取期刊名`);
    return null;
  }

  try {
    // 解码 HTML 实体
    let decoded = content
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');

    console.log(`    🔍 尝试从 content 提取期刊名...`);

    // 匹配模式: <p><b>Source:</b> Engineering Fracture Mechanics, Volume 337</p>
    const journalPatterns = [
      /<p>\s*<b>\s*Source:\s*<\/b>\s*([^<]+?)\s*<\/p>/i,
      /<p>\s*Source:\s*([^<]+?)\s*<\/p>/i,
      /Source:\s*([^<\n]+)/i,
    ];

    for (const pattern of journalPatterns) {
      const match = decoded.match(pattern);
      console.log(`    🔎 匹配期刊模式: ${pattern}, 结果:`, match ? `找到: ${match[1]}` : '未匹配');
      if (match && match[1]) {
        const journal = match[1].trim();
        // 移除 "Volume XXX" 部分，只保留期刊名
        const journalName = journal.replace(/,\s*Volume\s*\d+.*$/i, '').trim();
        console.log(`    📚 期刊名: "${journalName}"`);
        if (journalName.length > 0 && journalName.length < 200) {
          return journalName;
        }
      }
    }

    console.log(`    ⚠️ 所有模式都未匹配到期刊名`);
    return null;
  } catch (error) {
    console.error(`    ❌ 提取期刊名异常:`, error);
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

            // 提取期刊名和发表日期
            let journalName = source.name;
            let publicationDate = null;

            console.log(`    📊 检查 isElsevier: ${isElsevier}, content 存在: ${!!item.content}`);

            if (isElsevier && item.content) {
              console.log(`    🔧 开始提取期刊和日期信息...`);
              const extractedJournal = extractJournalFromContent(item.content);
              if (extractedJournal) {
                journalName = extractedJournal;
                console.log(`    ✅ 使用提取的期刊名: ${journalName}`);
              }

              const extractedDate = extractPublicationDateFromContent(item.content);
              if (extractedDate) {
                publicationDate = extractedDate;
                console.log(`    ✅ 使用提取的日期: ${publicationDate.toISOString()}`);
              }
            } else if (item.pubDate) {
              // 非 Elsevier 论文使用 RSS 的 pubDate
              publicationDate = new Date(item.pubDate);
              console.log(`    ℹ️ 使用 RSS pubDate: ${publicationDate.toISOString()}`);
            }

            papers.push({
              title: item.title || 'Unknown Title',
              authors: authors,
              abstract: abstract.substring(0, 500), // 限制长度
              hasAbstract: hasAbstract, // 标记是否有摘要
              link: item.link || '',
              pubDate: item.pubDate || null,
              journalName: journalName,
              publicationDate: publicationDate,
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
