import { NextResponse } from 'next/server';

// Semantic Scholar API 获取论文信息
async function getPaperInfoFromSemanticScholar(title: string): Promise<{
  abstract?: string;
  authors?: string;
} | null> {
  try {
    // 清理标题：移除 HTML 标签和多余空白
    const cleanTitle = title
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanTitle || cleanTitle.length < 5) {
      return null;
    }

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
      return null;
    }

    const data = await response.json();

    if (data.data && data.data.length > 0) {
      const paper = data.data[0];
      const authors = paper.authors?.map((a: any) => a.name).join(', ') || '';

      return {
        abstract: paper.abstract || undefined,
        authors: authors || undefined,
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}

export async function POST(request: Request) {
  const { title } = await request.json();

  if (!title) {
    return NextResponse.json(
      { error: '请提供论文标题' },
      { status: 400 }
    );
  }

  try {
    const info = await getPaperInfoFromSemanticScholar(title);

    if (info?.abstract) {
      return NextResponse.json({
        success: true,
        abstract: info.abstract,
        authors: info.authors,
      });
    } else {
      return NextResponse.json(
        { error: '未找到论文摘要' },
        { status: 404 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: '获取摘要失败', details: error?.message },
      { status: 500 }
    );
  }
}
