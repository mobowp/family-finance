'use server';

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./user";
import { getSystemSettingInternal } from "@/lib/system-settings";

export type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

// 获取用户财务数据摘要
async function getFinancialContext(userId: string) {
  // 1. 获取账户余额 (所有用户)
  const accounts = await prisma.account.findMany({
    // where: { userId }, // 已移除用户过滤，允许 AI 查看所有数据
    select: { 
      name: true, 
      type: true, 
      balance: true, 
      currency: true,
      user: { select: { name: true } }
    }
  });

  // 2. 获取资产信息 (所有用户)
  const assets = await prisma.asset.findMany({
    // where: { userId }, // 已移除用户过滤
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

  // 3. 获取最近 30 天的交易记录 (所有用户)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const transactions = await prisma.transaction.findMany({
    where: { 
      // userId, // 已移除用户过滤
      date: { gte: thirtyDaysAgo }
    },
    orderBy: { date: 'desc' },
    take: 50, // 增加条数限制
    include: { 
      category: true, 
      account: true,
      user: { select: { name: true } }
    }
  });

  // 格式化数据为文本
  let context = `系统所有用户财务概况 (截至 ${new Date().toLocaleDateString()}):\n\n`;
  
  context += `【账户余额】:\n`;
  accounts.forEach(acc => {
    context += `- [用户:${acc.user?.name || '未知'}] ${acc.name} (${acc.type}): ${acc.balance.toFixed(2)} ${acc.currency}\n`;
  });
  
  context += `\n【投资资产】:\n`;
  assets.forEach(asset => {
    const value = (asset.marketPrice || asset.costPrice) * asset.quantity;
    const profit = (asset.marketPrice ? (asset.marketPrice - asset.costPrice) * asset.quantity : 0);
    context += `- [用户:${asset.user?.name || '未知'}] ${asset.name} (${asset.type}): 市值 ${value.toFixed(2)}, 盈亏 ${profit.toFixed(2)}\n`;
  });

  context += `\n【最近交易 (近30天前50笔)】:\n`;
  transactions.forEach(t => {
    context += `- [用户:${t.user?.name || '未知'}] ${t.date.toLocaleDateString()} | ${t.type === 'EXPENSE' ? '支出' : t.type === 'INCOME' ? '收入' : '转账'} | ${t.amount.toFixed(2)} | ${t.category?.name || '无分类'} | ${t.description || ''}\n`;
  });

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

    // 1. 获取 AI 配置
    const provider = await getSystemSettingInternal('ai_provider');
    const apiKey = await getSystemSettingInternal('ai_api_key');
    const model = await getSystemSettingInternal('ai_model');

    console.log("AI Config:", { provider, model, hasKey: !!apiKey });

    if (!apiKey) {
      return { error: "管理员未配置 AI API Key，请联系管理员。" };
    }

    // 2. 获取财务数据上下文
    // 只有在对话开始时（或者用户明确询问财务状况时）才注入上下文，
    // 但为了简单起见，我们作为 System Prompt 注入
    let financialContext = "";
    try {
      financialContext = await getFinancialContext(user.id);
    } catch (e) {
      console.error("Failed to get financial context:", e);
      // 继续执行，只是没有上下文
    }

    const systemPrompt: Message = {
      role: 'system',
      content: `你是一个专业的家庭财务理财助手。以下是系统中所有用户的财务数据摘要：\n\n${financialContext}\n\n请根据这些数据回答用户的问题。数据中已标注所属用户。如果用户询问特定人的数据，请筛选回答。如果用户询问整体情况，请综合分析。请保持回答简洁、专业、客观。`
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
    const reply = data.choices[0]?.message?.content || "抱歉，我没有理解您的问题。";

    return { content: reply };

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
