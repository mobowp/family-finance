import { NextRequest } from 'next/server';
import { auth } from "@/auth";
import { getSystemSettings } from "@/app/actions/system-settings";
import { prisma } from "@/lib/prisma";

async function getFinancialContext(userId: string, familyId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { familyId: true }
  });

  const targetFamilyId = user?.familyId || familyId;

  const familyMembers = await prisma.user.findMany({
    where: { 
      OR: [
        { id: targetFamilyId },
        { familyId: targetFamilyId }
      ]
    },
    select: { id: true, name: true }
  });

  const familyMemberIds = familyMembers.map(m => m.id);

  const accounts = await prisma.account.findMany({
    where: { userId: { in: familyMemberIds } },
    select: { 
      name: true, 
      type: true, 
      balance: true, 
      currency: true,
      user: { select: { name: true } }
    }
  });

  const assets = await prisma.asset.findMany({
    where: { userId: { in: familyMemberIds } },
    select: { 
      name: true, 
      type: true, 
      quantity: true, 
      marketPrice: true, 
      costPrice: true, 
      symbol: true,
      user: { select: { name: true } }
    }
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const transactions = await prisma.transaction.findMany({
    where: { 
      userId: { in: familyMemberIds },
      date: { gte: thirtyDaysAgo }
    },
    orderBy: { date: 'desc' },
    take: 50,
    include: { 
      category: true, 
      account: true,
      user: { select: { name: true } }
    }
  });

  if (accounts.length === 0 && assets.length === 0 && transactions.length === 0) {
    return `当前家庭暂无财务数据。用户尚未添加任何账户、资产或交易记录。请提醒用户先添加财务数据后再进行分析。`;
  }

  let context = `家庭财务概况 (截至 ${new Date().toLocaleDateString()}):\n\n`;
  
  context += `【账户余额】:\n`;
  if (accounts.length === 0) {
    context += `暂无账户数据\n`;
  } else {
    accounts.forEach(acc => {
      context += `- [${acc.user?.name || '未知'}] ${acc.name} (${acc.type}): ${acc.balance.toFixed(2)} ${acc.currency}\n`;
    });
  }
  
  context += `\n【投资资产】:\n`;
  if (assets.length === 0) {
    context += `暂无资产数据\n`;
  } else {
    assets.forEach(asset => {
      const value = (asset.marketPrice || asset.costPrice) * asset.quantity;
      const profit = (asset.marketPrice ? (asset.marketPrice - asset.costPrice) * asset.quantity : 0);
      context += `- [${asset.user?.name || '未知'}] ${asset.name} (${asset.type}): 市值 ${value.toFixed(2)}, 盈亏 ${profit.toFixed(2)}\n`;
    });
  }

  context += `\n【最近交易 (近30天)】:\n`;
  if (transactions.length === 0) {
    context += `暂无交易记录\n`;
  } else {
    context += `共 ${transactions.length} 笔交易：\n`;
    transactions.forEach(t => {
      context += `- [${t.user?.name || '未知'}] ${t.date.toLocaleDateString()} | ${t.type === 'EXPENSE' ? '支出' : t.type === 'INCOME' ? '收入' : '转账'} | ${t.amount.toFixed(2)} | ${t.category?.name || '无分类'} | ${t.description || ''}\n`;
    });
  }

  return context;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { messages } = await req.json();
    
    const user = session.user as any;
    const familyId = user.familyId || user.id;
    
    const settings = await getSystemSettings();
    const provider = settings.ai_provider || 'deepseek';
    const apiKey = settings.ai_api_key;
    const model = settings.ai_model || 'deepseek-chat';

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI API 密钥未配置' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let financialContext = "";
    try {
      financialContext = await getFinancialContext(session.user.id, familyId);
    } catch (e) {
      console.error("Failed to get financial context:", e);
    }

    const systemPrompt = {
      role: 'system',
      content: `你是一个专业的家庭财务理财助手。

【重要规则】
1. 你只能基于下方提供的实际财务数据进行分析和回答
2. 严禁编造、推测或杜撰任何不存在的交易、账户或资产信息
3. 如果数据为空或不足以回答问题，请明确告知用户并建议添加数据
4. 所有数字、金额、交易描述必须来自实际数据，不得虚构

【当前家庭财务数据】
${financialContext}

【回答要求】
- 仅基于上述实际数据进行分析
- 数据中已标注所属用户，可按需筛选
- 保持回答简洁、专业、客观
- 如果数据不足，诚实告知而非猜测`
    };

    const apiMessages = [systemPrompt, ...messages];

    let apiUrl = '';
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (provider === 'deepseek') {
      apiUrl = 'https://api.deepseek.com/chat/completions';
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else if (provider === 'openrouter') {
      apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
      headers['Authorization'] = `Bearer ${apiKey}`;
      headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({ error: `AI 服务请求失败: ${response.statusText}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const json = JSON.parse(data);
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(json)}\n\n`));
                } catch (e) {
                  console.error('Parse error:', e);
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (error: any) {
    console.error('AI Chat API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
