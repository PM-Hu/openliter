import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 添加新关键词
export async function POST(request: Request) {
  const { keyword } = await request.json();

  if (!keyword || keyword.trim().length === 0) {
    return NextResponse.json(
      { error: '关键词不能为空' },
      { status: 400 }
    );
  }

  try {
    // 检查是否已存在
    const existing = await prisma.savedKeyword.findFirst({
      where: { keyword: keyword.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: '该关键词已存在' },
        { status: 400 }
      );
    }

    const savedKeyword = await prisma.savedKeyword.create({
      data: {
        keyword: keyword.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      keyword: savedKeyword,
    });
  } catch (error: any) {
    console.error('添加关键词失败：', error);
    return NextResponse.json(
      { error: '添加失败', details: error?.message },
      { status: 500 }
    );
  }
}

// 删除关键词
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: '缺少关键词ID' },
      { status: 400 }
    );
  }

  try {
    await prisma.savedKeyword.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('删除关键词失败：', error);
    return NextResponse.json(
      { error: '删除失败', details: error?.message },
      { status: 500 }
    );
  }
}
