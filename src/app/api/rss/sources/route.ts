import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const sources = await prisma.rssSource.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(sources);
  } catch (error: any) {
    console.error('获取RSS源列表失败：', error);
    return NextResponse.json(
      { error: '获取失败', details: error?.message },
      { status: 500 }
    );
  }
}
