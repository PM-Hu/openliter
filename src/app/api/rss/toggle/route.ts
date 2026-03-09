import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const { sourceId, isActive } = await request.json();

  if (!sourceId || isActive === undefined) {
    return NextResponse.json(
      { error: '参数不完整' },
      { status: 400 }
    );
  }

  try {
    await prisma.rssSource.update({
      where: { id: sourceId },
      data: { isActive },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('切换RSS源状态失败：', error);
    return NextResponse.json(
      { error: '操作失败', details: error?.message },
      { status: 500 }
    );
  }
}
