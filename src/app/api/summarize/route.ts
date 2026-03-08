import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

export async function POST(request: Request) {
  const { abstract, paperId } = await request.json();

  const prompt = `请用中文总结这篇论文的创新点和摘要（200字以内）：

摘要：${abstract}

要求：
1. 用通俗易懂的中文解释
2. 突出核心创新点
3. 说明潜在应用价值`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    // 打印完整响应用于调试
    console.log('GLM API 原始响应：', JSON.stringify(completion, null, 2));

    // 检查响应结构
    if (!completion.choices || completion.choices.length === 0) {
      console.error('GLM API返回的choices为空');
      return NextResponse.json(
        { error: 'API返回格式异常：无choices', rawResponse: completion },
        { status: 500 }
      );
    }

    const summary = completion.choices[0].message?.content;
    if (!summary) {
      console.error('GLM API返回的content为空');
      return NextResponse.json(
        { error: 'API返回内容为空', rawResponse: completion },
        { status: 500 }
      );
    }

    // ✅ 保存摘要到数据库
    if (paperId) {
      await prisma.paper.update({
        where: { id: paperId },
        data: { tldr: summary },
      });
      console.log(`✅ 摘要已保存到数据库 (论文ID: ${paperId})`);
    }

    return NextResponse.json({ summary, paperId });
  } catch (error: any) {
    console.error('AI调用失败：', error);
    return NextResponse.json(
      { error: 'AI调用失败', details: error?.message || '未知错误' },
      { status: 500 }
    );
  }
}
