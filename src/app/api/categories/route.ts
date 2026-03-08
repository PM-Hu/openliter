import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { papers: true },
        },
      },
    });
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error('获取分组列表失败：', error);
    return NextResponse.json(
      { error: '获取失败', details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { name, color } = await request.json();

  if (!name) {
    return NextResponse.json(
      { error: '分组名称不能为空' },
      { status: 400 }
    );
  }

  try {
    const category = await prisma.category.create({
      data: {
        name,
        color: color || '#3B82F6',
      },
    });

    console.log(`✅ 分组已创建: ${name}`);
    return NextResponse.json(category);
  } catch (error: any) {
    console.error('创建分组失败：', error);
    return NextResponse.json(
      { error: '创建失败', details: error?.message },
      { status: 500 }
    );
  }
}
