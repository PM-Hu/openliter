import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const { paperId } = await request.json();

  try {
    // 删除论文
    await prisma.paper.delete({
      where: { id: paperId },
    });

    console.log(`论文已删除 (ID: ${paperId})`);

    return NextResponse.json({ success: true, paperId });
  } catch (error: any) {
    console.error('删除论文失败：', error);
    return NextResponse.json(
      { error: '删除失败', details: error?.message || '未知错误' },
      { status: 500 }
    );
  }
}
