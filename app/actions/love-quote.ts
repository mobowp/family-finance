'use server';

import { prisma } from "@/lib/prisma";
import { getSystemSettingInternal } from "@/lib/system-settings";
import { chatWithAI } from "./ai";

export async function getDailyLoveQuote() {
  const today = new Date().toISOString().split('T')[0];

  // 1. 尝试从数据库获取今日情话
  const existingQuote = await prisma.dailyLoveQuote.findUnique({
    where: { date: today },
  });

  if (existingQuote) {
    return existingQuote.content;
  }

  // 2. 如果没有，调用 AI 生成
  const loveStartDate = await getSystemSettingInternal('love_start_date');
  const customPrompt = await getSystemSettingInternal('love_quote_prompt');
  let daysLoved = 0;
  
  if (loveStartDate) {
    const start = new Date(loveStartDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    daysLoved = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  } else {
    // 默认值，如果未设置
    daysLoved = 1;
  }

  let prompt = "";
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

  try {
    console.log("Generating love quote with prompt:", prompt);
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
      return response.content;
    } else {
      console.error("AI returned no content:", response);
      return "今天的情话正在酝酿中...\n爱你的每一天。";
    }
  } catch (error) {
    console.error("Failed to generate love quote:", error);
    return "无论发生什么，我都在你身边。\n爱你的每一天。";
  }
}

export async function refreshDailyLoveQuote() {
  const today = new Date().toISOString().split('T')[0];
  console.log("Refreshing daily love quote for:", today);
  
  // 删除今日已有的情话
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
