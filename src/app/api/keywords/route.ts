import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 获取所有保存的关键词
export async function GET() {
  try {
    const keywords = await prisma.savedKeyword.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(keywords);
  } catch (error: any) {
    console.error('获取关键词失败：', error);
    return NextResponse.json(
      { error: '获取失败', details: error?.message },
      { status: 500 }
    );
  }
}
