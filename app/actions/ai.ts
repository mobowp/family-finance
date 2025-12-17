'use server';

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./user";
import { getSystemSettingInternal } from "@/lib/system-settings";

export type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning_content?: string;
};

// 获取用户财务数据摘要
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

export async function chatWithAI(messages: Message[]) {
  try {
    console.log("Starting chatWithAI...");
    const user = await getCurrentUser();
    if (!user) {
      console.log("User not logged in");
      return { error: "请先登录" };
    }

    const familyId = (user as any).familyId || user.id;

    // 1. 获取 AI 配置
    const provider = await getSystemSettingInternal('ai_provider', familyId);
    const apiKey = await getSystemSettingInternal('ai_api_key', familyId);
    const model = await getSystemSettingInternal('ai_model', familyId);

    console.log("AI Config:", { provider, model, hasKey: !!apiKey });

    if (!apiKey) {
      return { error: "管理员未配置 AI API Key，请联系管理员。" };
    }

    // 2. 获取财务数据上下文
    // 只有在对话开始时（或者用户明确询问财务状况时）才注入上下文，
    // 但为了简单起见，我们作为 System Prompt 注入
    let financialContext = "";
    try {
      financialContext = await getFinancialContext(user.id, familyId);
    } catch (e) {
      console.error("Failed to get financial context:", e);
      // 继续执行，只是没有上下文
    }

    const systemPrompt: Message = {
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

    // 3. 构建请求
    const apiMessages = [systemPrompt, ...messages];
    
    let apiUrl = '';
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    if (provider === 'deepseek') {
      apiUrl = 'https://api.deepseek.com/chat/completions';
    } else if (provider === 'openrouter') {
      apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
      // OpenRouter specific headers
      headers['HTTP-Referer'] = 'https://family-finance.app'; // Optional
      headers['X-Title'] = 'Family Finance App'; // Optional
    } else {
      return { error: "不支持的 AI 服务商" };
    }

    // 4. 调用 API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: model || 'deepseek-chat',
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API Error:', errorText);
      return { error: `AI 服务请求失败: ${response.statusText}` };
    }

    const data = await response.json();
    const messageData = data.choices[0]?.message;
    const reply = messageData?.content || "抱歉，我没有理解您的问题。";
    const reasoningContent = messageData?.reasoning_content;

    return { 
      content: reply,
      reasoning_content: reasoningContent 
    };

  } catch (error: any) {
    console.error('Chat Error:', error);
    return { error: "系统错误，请稍后再试。" };
  }
}

export async function testNowApiConnection(appkey: string, sign: string) {
  try {
    // 使用黄金价格接口测试，因为它参数简单
    const url = 'http://api.k780.com';
    const params = new URLSearchParams({
      app: 'finance.gold_price',
      goldid: '1053',
      appkey: appkey,
      sign: sign,
      format: 'json',
    });

    const fullUrl = `${url}?${params.toString()}`;
    const response = await fetch(fullUrl, { cache: 'no-store' });
    const data = await response.json();

    if (data.success === '1') {
      return { success: true, message: '连接成功' };
    } else {
      return { success: false, message: `连接失败: ${data.msg || '未知错误'}` };
    }
  } catch (error: any) {
    return { success: false, message: `连接错误: ${error.message}` };
  }
}

export async function testAiConnection(provider: string, apiKey: string) {
  try {
    let apiUrl = '';
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    if (provider === 'deepseek') {
      apiUrl = 'https://api.deepseek.com/models'; // DeepSeek models endpoint
    } else if (provider === 'openrouter') {
      apiUrl = 'https://openrouter.ai/api/v1/models'; // OpenRouter models endpoint
    } else {
      return { success: false, message: '不支持的服务商' };
    }

    const response = await fetch(apiUrl, { 
      method: 'GET',
      headers: headers 
    });

    if (response.ok) {
      return { success: true, message: '连接成功' };
    } else {
      return { success: false, message: `连接失败: ${response.statusText}` };
    }
  } catch (error: any) {
    return { success: false, message: `连接错误: ${error.message}` };
  }
}

export async function getAiModels(provider: string, apiKey: string) {
  try {
    let apiUrl = '';
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    if (provider === 'deepseek') {
      apiUrl = 'https://api.deepseek.com/models';
    } else if (provider === 'openrouter') {
      apiUrl = 'https://openrouter.ai/api/v1/models';
    } else {
      return { error: '不支持的服务商' };
    }

    const response = await fetch(apiUrl, { 
      method: 'GET',
      headers: headers 
    });

    if (!response.ok) {
      return { error: `获取模型列表失败: ${response.statusText}` };
    }

    const data = await response.json();
    
    // Normalize data structure
    // DeepSeek: { object: "list", data: [{ id: "deepseek-chat", ... }] }
    // OpenRouter: { data: [{ id: "openai/gpt-4", ... }] }
    
    let models: {id: string, name: string}[] = [];

    if (data.data && Array.isArray(data.data)) {
      models = data.data.map((m: any) => ({
        id: m.id,
        name: m.id // OpenRouter and DeepSeek usually use ID as name
      }));
    } else {
      // Fallback if structure is different or empty
      console.warn('Unexpected API response structure:', data);
    }

    return { models };
  } catch (error: any) {
    return { error: `获取模型列表错误: ${error.message}` };
  }
}
