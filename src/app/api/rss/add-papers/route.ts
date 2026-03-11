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
        // 去重检查：标题 + 作者组合匹配
        const whereConditions: any[] = [
          { title: paper.title }
        ];

        // 如果有作者信息，添加作者匹配条件
        if (paper.authors && paper.authors !== 'Unknown') {
          whereConditions.push({ authors: paper.authors });
        }

        const existing = await prisma.paper.findFirst({
          where: {
            AND: whereConditions,
          },
        });

        if (existing) {
          console.log(`⏭️  跳过重复论文: "${paper.title?.substring(0, 50)}..."`);
          skippedIds.push(paper.id || Math.random());
          continue;
        }

        // 解析发布日期（优先使用 publicationDate，回退到 pubDate）
        let publicationDate = null;
        const dateSource = paper.publicationDate || paper.pubDate;

        if (dateSource) {
          // 如果是字符串，解析为 Date；如果已经是 Date 对象，直接使用
          publicationDate = typeof dateSource === 'string' ? new Date(dateSource) : dateSource;
          // 检查日期是否有效
          if (isNaN(publicationDate.getTime())) {
            publicationDate = null;
          }
        }

        // 保存论文
        await prisma.paper.create({
          data: {
            title: paper.title,
            authors: paper.authors,
            abstract: paper.abstract,
            pdfUrl: paper.link,
            arxivId: null,
            journalName: paper.journalName,
            publicationDate: publicationDate,
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
