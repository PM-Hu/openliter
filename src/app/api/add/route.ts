import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseStringPromise } from 'xml2js';

export async function POST(request: Request) {
  const { arxivUrl } = await request.json();

  // 1. 解析arXiv ID
  const arxivId = arxivUrl.match(/arxiv\.org\/abs\/(\d+\.\d+)/)?.[1];
  if (!arxivId) {
    return NextResponse.json({ error: '无效的arXiv链接' }, { status: 400 });
  }

  // 2. 调用arXiv API获取论文信息
  const apiUrl = `http://export.arxiv.org/api/query?id_list=${arxivId}`;
  const response = await fetch(apiUrl);
  const xml = await response.text();

  // 3. 解析XML数据
  const result = await parseStringPromise(xml);
  const entry = result.feed.entry[0];

  const paperData = {
    title: entry.title[0].replace(/\s+/g, ' '),
    authors: entry.author?.map((a: any) => a.name[0]).join(', '),
    abstract: entry.summary[0].replace(/\s+/g, ' '),
    arxivId: arxivId,
    pdfUrl: `https://arxiv.org/pdf/${arxivId}.pdf`,
  };

  // 4. 保存到数据库
  const paper = await prisma.paper.create({
    data: paperData,
  });

  return NextResponse.json(paper);
}
