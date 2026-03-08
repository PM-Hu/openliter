import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const { categoryId } = await request.json();

  try {
    await prisma.category.delete({
      where: { id: categoryId },
    });

    console.log(`✅ 分组已删除 (ID: ${categoryId})`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('删除分组失败：', error);
    return NextResponse.json(
      { error: '删除失败', details: error?.message },
      { status: 500 }
    );
  }
}
