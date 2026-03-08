import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const { papers } = await request.json();

  if (!papers || papers.length === 0) {
    return NextResponse.json(
      { error: '请选择要添加的论文' },
      { status: 400 }
    );
  }

  try {
    let addedCount = 0;
    const skippedIds: number[] = [];

    for (const paper of papers) {
      try {
        // 再次检查是否已存在
        const existing = await prisma.paper.findFirst({
          where: {
            title: paper.title,
          },
        });

        if (existing) {
          skippedIds.push(paper.id || Math.random());
          continue;
        }

        // 保存论文
        await prisma.paper.create({
          data: {
            title: paper.title,
            authors: paper.authors,
            abstract: paper.abstract,
            pdfUrl: paper.link,
            arxivId: null,
          },
        });

        addedCount++;
      } catch (error) {
        console.error(`保存论文失败: ${paper.title}`, error);
      }
    }

    console.log(`✅ 批量添加完成：成功 ${addedCount} 篇，跳过 ${skippedIds.length} 篇`);

    return NextResponse.json({
      success: true,
      addedCount,
      skippedCount: skippedIds.length,
    });
  } catch (error: any) {
    console.error('批量添加论文失败：', error);
    return NextResponse.json(
      { error: '添加失败', details: error?.message },
      { status: 500 }
    );
  }
}
