import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

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

    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const [currentMonthStats, lastMonthStats] = await Promise.all([
      prisma.transaction.groupBy({
        by: ['type'],
        where: {
          date: { gte: currentMonthStart, lte: currentMonthEnd },
          user: userFilter
        },
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ['type'],
        where: {
          date: { gte: lastMonthStart, lte: lastMonthEnd },
          user: userFilter
        },
        _sum: { amount: true },
      }),
    ]);

    const currentIncome = currentMonthStats.find(s => s.type === 'INCOME')?._sum.amount || 0;
    const currentExpense = currentMonthStats.find(s => s.type === 'EXPENSE')?._sum.amount || 0;
    const lastIncome = lastMonthStats.find(s => s.type === 'INCOME')?._sum.amount || 0;
    const lastExpense = lastMonthStats.find(s => s.type === 'EXPENSE')?._sum.amount || 0;

    const calculateGrowth = (current: number, last: number) => {
      if (last === 0) return current > 0 ? 100 : 0;
      return ((current - last) / last) * 100;
    };

    const incomeGrowth = calculateGrowth(currentIncome, lastIncome);
    const expenseGrowth = calculateGrowth(currentExpense, lastExpense);

    return NextResponse.json({
      currentIncome,
      currentExpense,
      incomeGrowth,
      expenseGrowth
    });
  } catch (error) {
    console.error('Monthly stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}