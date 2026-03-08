import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const papers = await prisma.paper.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json(papers);
}
