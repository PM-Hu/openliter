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
      console.log(`    ⚠️ 标题太短，跳过 Semantic Scholar 查询`);
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
        'User-Agent': 'Paper-Management-System/1.0', // 添加 User-Agent
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`    ⚠️ Semantic Scholar API 调用失败: ${response.status} - ${errorText.substring(0, 100)}`);
      return null;
    }

    const data = await response.json();

    if (data.data && data.data.length > 0) {
      const paper = data.data[0];

      // 检查标题匹配度（简单检查）
      const titleSimilarity = calculateTitleSimilarity(cleanTitle, paper.title);
      if (titleSimilarity < 0.7) {
        console.log(`    ⚠️ 标题匹配度过低 (${(titleSimilarity * 100).toFixed(1)}%)，跳过`);
        return null;
      }

      // 提取作者信息
      const authors = paper.authors?.map((a: any) => a.name).join(', ') || '';

      console.log(`    ✅ 从 Semantic Scholar 获取到摘要 (匹配度: ${(titleSimilarity * 100).toFixed(1)}%)`);

      return {
        abstract: paper.abstract || undefined,
        authors: authors || undefined,
      };
    }

    console.log(`    ⚠️ Semantic Scholar 未找到匹配的论文`);
    return null;
  } catch (error) {
    console.error('Semantic Scholar API 调用异常:', error);
    return null;
  }
}

// 计算标题相似度（简单的字符串相似度）
function calculateTitleSimilarity(title1: string, title2: string): number {
  const t1 = title1.toLowerCase().trim();
  const t2 = title2.toLowerCase().trim();

  if (t1 === t2) return 1.0;

  // 简单的包含关系检查
  if (t1.includes(t2) || t2.includes(t1)) {
    return 0.8;
  }

  // 计算单词重叠度
  const words1 = t1.split(/\s+/);
  const words2 = t2.split(/\s+/);
  const intersection = words1.filter((w: string) => words2.includes(w));

  return (2 * intersection.length) / (words1.length + words2.length);
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

            // 检查是否是 Elsevier RSS（通过名称、URL 或 sciencedirect 域名）
            const isElsevier = source.name.toLowerCase().includes('elsevier') ||
                              source.url.toLowerCase().includes('elsevier') ||
                              source.url.toLowerCase().includes('sciencedirect');

            // 提取期刊名和发表日期
            let journalName = source.name;
            let publicationDate = null;

            console.log(`    📊 检查 isElsevier: ${isElsevier}, content 存在: ${!!item.content}`);

            if (isElsevier && item.content) {
              console.log(`    🔧 开始提取期刊和日期信息...`);
              // 从 content 提取期刊名
              const extractedJournal = extractJournalFromContent(item.content);
              if (extractedJournal) {
                journalName = extractedJournal;
                console.log(`    ✅ 使用提取的期刊名: ${journalName}`);
              }

              // 从 content 提取发表日期
              const extractedDate = extractPublicationDateFromContent(item.content);
              if (extractedDate) {
                publicationDate = extractedDate;
                console.log(`    ✅ 使用提取的日期: ${publicationDate.toISOString()}`);
              }
            } else if (item.pubDate) {
              // 非 Elsevier 论文使用 RSS 的 pubDate
              const parsedDate = new Date(item.pubDate);
              if (!isNaN(parsedDate.getTime())) {
                publicationDate = parsedDate;
                console.log(`    ℹ️ 使用 RSS pubDate: ${publicationDate.toISOString()}`);
              }
            }

            // 对于 Elsevier，先尝试从 content 提取作者，如果没有则使用默认方法
            let authors = extractAuthors(item);
            let abstract = '';

            if (isElsevier) {
              // 从 content 中提取作者信息
              const extractedAuthors = extractAuthorsFromContent(item.content || '');
              if (extractedAuthors) {
                authors = extractedAuthors;
              } else {
                console.log(`    ⚠️ 未能从 content 提取作者，使用默认方法`);
              }

              // 尝试通过 Semantic Scholar API 获取摘要（优先级更高）
              console.log(`    🔍 尝试从 Semantic Scholar 获取摘要...`);
              const semanticInfo = await getPaperInfoFromSemanticScholar(item.title || '');

              if (semanticInfo?.abstract) {
                abstract = semanticInfo.abstract;
                if (semanticInfo.authors && !extractedAuthors) {
                  // 如果从 content 没有提取到作者，使用 Semantic Scholar 的作者
                  authors = semanticInfo.authors;
                }
                console.log(`    ✅ 从 Semantic Scholar 获取到摘要`);
              } else {
                // 如果 Semantic Scholar 没有找到，使用 RSS 中的摘要
                console.log(`    ⚠️ Semantic Scholar 未找到，使用 RSS 摘要`);
                abstract = cleanElsevierAbstract(item['description'] || item.content || item.contentSnippet || '');
              }
            } else {
              // 非 Elsevier 论文，使用默认清理方法
              abstract = cleanAbstract(item.contentSnippet || item.content || '');
            }

            // 去重检查：标题 + 作者组合匹配
            const whereConditions: any[] = [
              { title: item.title || 'Unknown Title' }
            ];

            // 如果有作者信息且不是默认值，添加作者匹配条件
            if (authors && authors !== 'Unknown') {
              whereConditions.push({ authors: authors });
            }

            // 优先检查 arXiv ID（如果存在）
            if (arxivId) {
              const existingByArxivId = await prisma.paper.findFirst({
                where: { arxivId: arxivId },
              });

              if (existingByArxivId) {
                console.log(`    ⏭️  跳过重复论文 (arXiv ID): ${item.title?.substring(0, 50)}...`);
                sourceSkipped++;
                continue;
              }
            }

            // 检查标题+作者组合
            const existing = await prisma.paper.findFirst({
              where: {
                AND: whereConditions,
              },
            });

            if (existing) {
              console.log(`    ⏭️  跳过重复论文 (标题+作者): ${item.title?.substring(0, 50)}...`);
              sourceSkipped++;
              continue;
            }

            // 保存论文
            const paper = await prisma.paper.create({
              data: {
                title: item.title || 'Unknown Title',
                authors: authors,
                abstract: abstract,
                arxivId: arxivId,
                pdfUrl: pdfUrl,
                journalName: journalName,
                publicationDate: publicationDate,
              },
            });

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
  if (!content) {
    console.log(`    ⚠️ content 为空`);
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

    // 针对 Elsevier 的特定格式：<p>Author(s): ...</p>
    // 改进：允许多行和更多空白字符
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
          console.log(`    ✅ 从 Elsevier content 提取到作者: ${authors}`);
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
        // 清理和验证
        if (authors.length > 0 && authors.length < 500) {
          console.log(`    ✅ 通过备用方案提取到作者: ${authors}`);
          return authors;
        }
      }
    }

    // 调试：输出前 200 个字符帮助排查
    console.log(`    ⚠️ 未能从 content 提取作者信息`);
    console.log(`    📝 Content 预览: ${decoded.substring(0, 200)}...`);
    return null;
  } catch (error) {
    console.error('提取作者信息失败:', error);
    return null;
  }
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
