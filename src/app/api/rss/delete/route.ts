import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const { sourceId } = await request.json();

  try {
    await prisma.rssSource.delete({
      where: { id: sourceId },
    });

    console.log(`✅ RSS源已删除 (ID: ${sourceId})`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('删除RSS源失败：', error);
    return NextResponse.json(
      { error: '删除失败', details: error?.message },
      { status: 500 }
    );
  }
}
