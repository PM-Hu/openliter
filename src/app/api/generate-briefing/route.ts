import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// AI API配置（使用环境变量）
const AI_API_KEY = process.env.OPENAI_API_KEY;
const AI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4';
const AI_MODEL = process.env.OPENAI_MODEL || 'glm-4-flash';

async function generateAIBriefing(papers: any[], keyword: string): Promise<string> {
  if (!AI_API_KEY) {
    throw new Error('OPENAI_API_KEY 未配置，请在 .env 文件中设置');
  }

  // 格式化论文信息
  const papersInfo = papers.map((paper, index) => {
    return `论文 ${index + 1}:
标题: ${paper.title}
作者: ${paper.authors || '未知'}
期刊: ${paper.journalName || '未知'}
日期: ${paper.publicationDate ? new Date(paper.publicationDate).toLocaleDateString() : '未知'}
摘要: ${paper.abstract?.substring(0, 300) || '暂无摘要'}`;
  }).join('\n\n');

  const prompt = `你是一个专业的科研助手。请根据以下论文列表，生成一份简明的学术简报。

关键词: ${keyword}
找到论文数量: ${papers.length}

论文列表:
${papersInfo}

请生成一份结构化的学术简报，包含以下部分：
1. 研究概述（2-3句话总结这些论文的整体研究方向）
2. 主要发现（列出3-5个关键发现或创新点）
3. 研究趋势（分析这些论文反映的研究趋势）
4. 推荐阅读（如果有特别值得关注的论文，请推荐1-2篇并说明理由）

请使用中文回答，保持专业且简洁的风格。`;

  try {
    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`AI API 错误: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('调用AI API失败:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  const { keyword, maxPapers = 10 } = await request.json();

  if (!keyword || keyword.trim().length === 0) {
    return NextResponse.json(
      { error: '请提供关键词' },
      { status: 400 }
    );
  }

  try {
    // 从数据库搜索匹配的论文
    const papers = await prisma.paper.findMany({
      where: {
        OR: [
          { title: { contains: keyword } },
          { abstract: { contains: keyword } },
          { authors: { contains: keyword } },
          { journalName: { contains: keyword } },
        ],
      },
      orderBy: {
        publicationDate: 'desc',
      },
      take: maxPapers,
    });

    if (papers.length === 0) {
      return NextResponse.json({
        success: false,
        message: `未找到与关键词 "${keyword}" 相关的论文`,
      });
    }

    console.log(`📊 找到 ${papers.length} 篇论文，正在生成简报...`);

    // 生成AI简报
    const briefing = await generateAIBriefing(papers, keyword);

    console.log('✅ AI简报生成完成');

    return NextResponse.json({
      success: true,
      briefing,
      papersCount: papers.length,
      papers: papers.map(p => ({
        id: p.id,
        title: p.title,
        authors: p.authors,
        journalName: p.journalName,
        publicationDate: p.publicationDate,
      })),
    });
  } catch (error: any) {
    console.error('生成简报失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '生成简报失败',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
