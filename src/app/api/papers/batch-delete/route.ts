import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const { paperIds } = await request.json();

  if (!paperIds || paperIds.length === 0) {
    return NextResponse.json(
      { error: '请选择要删除的论文' },
      { status: 400 }
    );
  }

  try {
    // 批量删除
    await prisma.paper.deleteMany({
      where: {
        id: { in: paperIds },
      },
    });

    console.log(`✅ 已批量删除 ${paperIds.length} 篇论文`);

    return NextResponse.json({
      success: true,
      deletedCount: paperIds.length,
    });
  } catch (error: any) {
    console.error('批量删除失败：', error);
    return NextResponse.json(
      { error: '删除失败', details: error?.message },
      { status: 500 }
    );
  }
}
