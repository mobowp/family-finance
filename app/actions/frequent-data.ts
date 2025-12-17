'use server';

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./user";

export async function getFrequentCategoriesAndAccounts() {
  const user = await getCurrentUser();
  if (!user) return { categories: [], accounts: [] };

  const familyId = (user as any).familyId || user.id;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // 1. 获取最近 7 天的交易记录
  const recentTransactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      date: { gte: sevenDaysAgo }
    },
    select: {
      categoryId: true,
      accountId: true
    }
  });

  // 2. 统计分类使用频次
  const categoryCount: Record<string, number> = {};
  // 3. 统计账户使用频次
  const accountCount: Record<string, number> = {};

  recentTransactions.forEach(tx => {
    if (tx.categoryId) {
      categoryCount[tx.categoryId] = (categoryCount[tx.categoryId] || 0) + 1;
    }
    if (tx.accountId) {
      accountCount[tx.accountId] = (accountCount[tx.accountId] || 0) + 1;
    }
  });

  // 4. 获取所有分类和账户
  const [allCategories, allAccounts] = await Promise.all([
    prisma.category.findMany(),
    prisma.account.findMany({
      where: {
        user: {
          OR: [
            { id: user.id },
            { familyId: familyId }
          ]
        }
      },
      include: { children: true }
    })
  ]);

  // 5. 对分类进行排序：频次高的在前，频次相同的按原顺序
  const sortedCategories = [...allCategories].sort((a, b) => {
    const countA = categoryCount[a.id] || 0;
    const countB = categoryCount[b.id] || 0;
    if (countA !== countB) {
      return countB - countA; // 降序
    }
    return 0; // 保持原有相对顺序（或按名称排序等）
  });

  // 6. 对账户进行排序
  // 注意：账户有层级结构，这里我们只对扁平化后的列表进行排序建议，
  // 或者在前端处理。为了简单起见，我们返回一个排序后的 ID 列表供前端参考，
  // 或者直接返回排序后的扁平列表。
  // 考虑到前端组件 `transaction-form.tsx` 使用了 `getFlattenedAccounts` 逻辑来展示层级，
  // 直接打乱顺序会破坏层级展示。
  // 
  // 方案优化：
  // 保持原有层级结构展示，但在下拉框顶部增加“常用账户”分组？
  // 或者，仅仅是把高频使用的账户在各自的层级中提前？
  // 
  // 用户需求是“默认按照最近7天选择频次倒序”。
  // 如果完全倒序，层级结构（父子账户）可能会被打散，导致视觉混乱。
  // 但为了满足“快捷选择”，我们可以将高频账户提取到列表最前面，或者在排序时赋予高权重。
  // 
  // 让我们先返回带有频次权重的列表，前端决定如何展示。
  // 这里我们简单地返回按频次排序的列表，前端如果需要保持层级，可以自行处理。
  // 但为了直接满足需求，我们尝试返回排序后的列表。
  
  const sortedAccounts = [...allAccounts].sort((a, b) => {
    const countA = accountCount[a.id] || 0;
    const countB = accountCount[b.id] || 0;
    if (countA !== countB) {
      return countB - countA;
    }
    return 0;
  });

  return {
    categories: sortedCategories,
    accounts: sortedAccounts,
    categoryCounts: categoryCount,
    accountCounts: accountCount
  };
}
