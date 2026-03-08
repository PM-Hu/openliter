import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // 预设的RSS源
    const defaultSources = [
      {
        name: 'arXiv AI (cs.AI)',
        url: 'https://export.arxiv.org/rss/cs.AI',
      },
      {
        name: 'arXiv Machine Learning (cs.LG)',
        url: 'https://export.arxiv.org/rss/cs.LG',
      },
      {
        name: 'arXiv Computer Vision (cs.CV)',
        url: 'https://export.arxiv.org/rss/cs.CV',
      },
      {
        name: 'arXiv NLP (cs.CL)',
        url: 'https://export.arxiv.org/rss/cs.CL',
      },
      {
        name: 'arXiv Neural Networks (cs.NE)',
        url: 'https://export.arxiv.org/rss/cs.NE',
      },
    ];

    let addedCount = 0;

    for (const source of defaultSources) {
      const existing = await prisma.rssSource.findUnique({
        where: { url: source.url },
      });

      if (!existing) {
        await prisma.rssSource.create({
          data: source,
        });
        addedCount++;
        console.log(`✅ 添加RSS源: ${source.name}`);
      }
    }

    return NextResponse.json({
      success: true,
      addedCount,
      message: `已添加 ${addedCount} 个预设RSS源`,
    });
  } catch (error: any) {
    console.error('初始化RSS源失败：', error);
    return NextResponse.json(
      { error: '初始化失败', details: error?.message },
      { status: 500 }
    );
  }
}
