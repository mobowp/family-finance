import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, familyId: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const familyId = user.familyId || user.id;
    const userFilter = {
      OR: [
        { id: user.id },
        { familyId: familyId }
      ]
    };

    const oneYearAgo = new Date();
    oneYearAgo.setMonth(oneYearAgo.getMonth() - 11);
    oneYearAgo.setDate(1);
    oneYearAgo.setHours(0, 0, 0, 0);

    const statsTransactions = await prisma.transaction.findMany({
      where: {
        date: { gte: oneYearAgo },
        user: userFilter
      },
      select: {
        id: true,
        amount: true,
        type: true,
        date: true,
        categoryId: true,
        userId: true,
        category: {
          select: { id: true, name: true }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { date: 'asc' }
    });

    const monthlyMap = new Map();
    const categoryMap = new Map();

    statsTransactions.forEach(tx => {
      const date = new Date(tx.date);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMap.has(monthStr)) {
        monthlyMap.set(monthStr, { income: 0, expense: 0 });
      }
      const monthData = monthlyMap.get(monthStr);
      if (tx.type === 'INCOME') {
        monthData.income += tx.amount;
      } else if (tx.type === 'EXPENSE') {
        monthData.expense += tx.amount;
      }

      if (tx.categoryId && tx.category) {
        const userName = tx.user?.name || tx.user?.email || 'Unknown';
        const key = `${monthStr}|${tx.categoryId}|${tx.category.name}|${tx.type}|${tx.userId}|${userName}`;
        const currentAmount = categoryMap.get(key) || 0;
        categoryMap.set(key, currentAmount + tx.amount);
      }
    });

    const monthlyStats = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      income: data.income,
      expense: data.expense,
      net: data.income - data.expense
    })).sort((a, b) => a.month.localeCompare(b.month));

    const categoryStats = Array.from(categoryMap.entries()).map(([key, amount]) => {
      const [month, categoryId, categoryName, type, userId, userName] = key.split('|');
      return {
        month,
        categoryId,
        categoryName,
        type,
        userId,
        userName,
        amount
      };
    });

    return NextResponse.json({ monthlyStats, categoryStats });
  } catch (error) {
    console.error('Statistics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
