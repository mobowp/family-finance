'use server';

import { prisma } from "@/lib/prisma";
import { getSystemSettingInternal } from "@/lib/system-settings";
import { chatWithAI } from "./ai";
import { startOfMonth, endOfMonth } from "date-fns";

// 获取财务统计数据
async function getFinancialStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // 今日收支
  const todayStats = await prisma.transaction.groupBy({
    by: ['type'],
    where: {
      date: { gte: todayStart, lt: todayEnd },
    },
    _sum: { amount: true },
  });

  // 本月收支
  const monthStats = await prisma.transaction.groupBy({
    by: ['type'],
    where: {
      date: { gte: monthStart, lte: monthEnd },
    },
    _sum: { amount: true },
  });

  // 账户总余额
  const accounts = await prisma.account.findMany({
    select: { balance: true, type: true }
  });
  
  // 计算总资产
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const todayIncome = todayStats.find(s => s.type === 'INCOME')?._sum.amount || 0;
  const todayExpense = todayStats.find(s => s.type === 'EXPENSE')?._sum.amount || 0;
  const monthIncome = monthStats.find(s => s.type === 'INCOME')?._sum.amount || 0;
  const monthExpense = monthStats.find(s => s.type === 'EXPENSE')?._sum.amount || 0;

  return {
    todayIncome: todayIncome.toFixed(2),
    todayExpense: todayExpense.toFixed(2),
    monthIncome: monthIncome.toFixed(2),
    monthExpense: monthExpense.toFixed(2),
    totalBalance: totalBalance.toFixed(2),
  };
}

export type QuoteResult = {
  content: string;
  type: string;
  daysLoved: number | null;
};

export async function getDailyLoveQuote(): Promise<QuoteResult> {
  const today = new Date().toISOString().split('T')[0];
  
  // 获取当前激活的模板
  const activeTemplate = await getSystemSettingInternal('active_quote_template') || 'love_quote';

  // 1. 尝试从数据库获取今日内容
  const existingQuote = await prisma.dailyLoveQuote.findUnique({
    where: { date: today },
  });

  if (existingQuote) {
    return {
      content: existingQuote.content,
      type: activeTemplate,
      daysLoved: activeTemplate === 'love_quote' ? await getLoveDays() : null
    };
  }

  // 2. 如果没有，准备生成
  let prompt = "";
  let daysLoved = 0;

  // 获取自定义 Prompt
  const customPromptKey = activeTemplate === 'love_quote' ? 'love_quote_prompt' : `template_prompt_${activeTemplate}`;
  const customPrompt = await getSystemSettingInternal(customPromptKey);

  if (activeTemplate === 'love_quote') {
    const loveStartDate = await getSystemSettingInternal('love_start_date');
    if (loveStartDate) {
      const start = new Date(loveStartDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - start.getTime());
      daysLoved = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    } else {
      daysLoved = 1;
    }

    if (customPrompt) {
      prompt = customPrompt.replace(/\$\{daysLoved\}/g, daysLoved.toString());
    } else {
      prompt = `请生成一段给爱人的每日情话。
要求：
1. 风格温暖、深情、具象化，避免空洞的词藻。
2. 字数在 100 字左右。
3. 结尾必须包含一句：爱你的第${daysLoved}天。
4. 不要包含任何解释性文字，直接输出情话内容。
5. 文本中可以包含换行符。

参考风格：
以前觉得“永远”是个很虚幻的词，直到遇见你，我才开始具象化地理解它的含义。
那不是什么轰轰烈烈的誓言，而是每一个清晨醒来，我都无比确信：无论未来如何变迁，我的计划里，始终有你。你是我心底最安静、也最坚定的归宿。
爱你的第${daysLoved}天。`;
    }
  } else if (activeTemplate === 'financial_status') {
    const stats = await getFinancialStats();
    if (customPrompt) {
      prompt = customPrompt
        .replace(/\$\{todayIncome\}/g, stats.todayIncome)
        .replace(/\$\{todayExpense\}/g, stats.todayExpense)
        .replace(/\$\{monthIncome\}/g, stats.monthIncome)
        .replace(/\$\{monthExpense\}/g, stats.monthExpense)
        .replace(/\$\{totalBalance\}/g, stats.totalBalance);
    } else {
      prompt = `请根据以下财务数据，生成一段简短的财务日报。
数据：
- 今日收入：${stats.todayIncome}
- 今日支出：${stats.todayExpense}
- 本月支出：${stats.monthExpense}
- 总资产：${stats.totalBalance}

要求：
1. 语言幽默风趣，带一点调侃。
2. 如果今日支出较多，提醒节约；如果收入不错，给予鼓励。
3. 字数 100 字左右。
4. 不要包含解释性文字。`;
    }
  } else if (activeTemplate === 'spending_diagnosis') {
    const stats = await getFinancialStats();
    if (customPrompt) {
      prompt = customPrompt
        .replace(/\$\{todayExpense\}/g, stats.todayExpense)
        .replace(/\$\{monthExpense\}/g, stats.monthExpense);
    } else {
      prompt = `请扮演一位毒舌但专业的理财顾问，对我的消费情况进行诊断。
数据：
- 今日支出：${stats.todayExpense}
- 本月支出：${stats.monthExpense}

要求：
1. 风格犀利，一针见血。
2. 给出一条具体的省钱建议。
3. 字数 100 字左右。`;
    }
  } else if (activeTemplate === 'what_to_eat') {
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const todayWeek = weekDays[new Date().getDay()];
    
    if (customPrompt) {
      prompt = customPrompt.replace(/\$\{weekday\}/g, todayWeek);
    } else {
      prompt = `今天是${todayWeek}，请为我推荐今天的菜单（早餐、午餐、晚餐）。
要求：
1. 菜品家常且健康。
2. 给出推荐理由。
3. 字数 100 字左右。`;
    }
  } else {
    // 默认回退到情话
    prompt = "请生成一段温暖的每日寄语。";
  }

  try {
    console.log(`Generating quote for template ${activeTemplate} with prompt:`, prompt);
    const response = await chatWithAI([
      { role: 'user', content: prompt }
    ]);
    console.log("AI Response:", response);

    if (response.content) {
      // 3. 保存到数据库
      await prisma.dailyLoveQuote.create({
        data: {
          date: today,
          content: response.content,
        },
      });
      return {
        content: response.content,
        type: activeTemplate,
        daysLoved: activeTemplate === 'love_quote' ? daysLoved : null
      };
    } else {
      console.error("AI returned no content:", response);
      return {
        content: "今天的内容正在酝酿中...\n请稍后再试。",
        type: activeTemplate,
        daysLoved: activeTemplate === 'love_quote' ? daysLoved : null
      };
    }
  } catch (error) {
    console.error("Failed to generate quote:", error);
    return {
      content: "无论发生什么，生活都要继续。\n加油！",
      type: activeTemplate,
      daysLoved: activeTemplate === 'love_quote' ? daysLoved : null
    };
  }
}

export async function refreshDailyLoveQuote() {
  const today = new Date().toISOString().split('T')[0];
  console.log("Refreshing daily quote for:", today);
  
  // 删除今日已有的记录
  try {
    await prisma.dailyLoveQuote.delete({
      where: { date: today },
    });
  } catch (e) {
    // 忽略删除错误（如果不存在）
    console.log("No existing quote to delete or delete failed:", e);
  }

  // 重新生成
  return getDailyLoveQuote();
}

export async function getLoveDays() {
  const loveStartDate = await getSystemSettingInternal('love_start_date');
  if (!loveStartDate) return null;

  const start = new Date(loveStartDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
