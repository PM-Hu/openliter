import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const { name, url } = await request.json();

  try {
    // 检查URL是否已存在
    const existing = await prisma.rssSource.findUnique({
      where: { url },
    });

    if (existing) {
      return NextResponse.json(
        { error: '该RSS源已存在' },
        { status: 400 }
      );
    }

    // 添加RSS源
    const rssSource = await prisma.rssSource.create({
      data: {
        name,
        url,
      },
    });

    console.log(`✅ RSS源已添加: ${name}`);
    return NextResponse.json(rssSource);
  } catch (error: any) {
    console.error('添加RSS源失败：', error);
    return NextResponse.json(
      { error: '添加失败', details: error?.message },
      { status: 500 }
    );
  }
}
