import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

export async function POST(request: Request) {
  const { url } = await request.json();

  if (!url) {
    return NextResponse.json(
      { error: '请提供 RSS URL' },
      { status: 400 }
    );
  }

  try {
    const parser = new Parser();
    const feed = await parser.parseURL(url);

    // 返回前3篇论文的完整信息
    const samplePapers = feed.items.slice(0, 3).map((item, index) => ({
      index: index + 1,
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      creator: item.creator,
      'dc:creator': item['dc:creator'],
      contentSnippet: item.contentSnippet?.substring(0, 500) + '...',
      content: item.content?.substring(0, 500) + '...',
      description: item['description']?.substring(0, 500) + '...',
      guid: item.guid,
      categories: item.categories,
      author: item.author,
    }));

    return NextResponse.json({
      success: true,
      feedInfo: {
        title: feed.title,
        description: feed.description,
        link: feed.link,
        language: feed.language,
        lastBuildDate: feed.lastBuildDate,
        totalItems: feed.items.length,
      },
      samplePapers,
    });
  } catch (error: any) {
    console.error('测试RSS失败：', error);
    return NextResponse.json(
      { error: '解析失败', details: error?.message },
      { status: 500 }
    );
  }
}
