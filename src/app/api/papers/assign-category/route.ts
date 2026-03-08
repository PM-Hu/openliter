import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const { paperIds, categoryId } = await request.json();

  if (!paperIds || paperIds.length === 0) {
    return NextResponse.json(
      { error: '请选择要分组的论文' },
      { status: 400 }
    );
  }

  try {
    // categoryId 为 null 时表示移除分组
    await prisma.paper.updateMany({
      where: {
        id: { in: paperIds },
      },
      data: {
        categoryId: categoryId || null,
      },
    });

    console.log(`✅ 已将 ${paperIds.length} 篇论文分配到分组 ${categoryId || '未分组'}`);

    return NextResponse.json({
      success: true,
      updatedCount: paperIds.length,
    });
  } catch (error: any) {
    console.error('分配分组失败：', error);
    return NextResponse.json(
      { error: '分配失败', details: error?.message },
      { status: 500 }
    );
  }
}
