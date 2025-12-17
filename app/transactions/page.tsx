import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TransactionFilters } from "@/components/transaction-filters";
import { TransactionList } from "@/components/transaction-list";
import { Prisma } from "@prisma/client";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { StatisticsDashboard } from "@/components/statistics/statistics-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExportButton } from "@/components/export-button";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    redirect("/login");
  }

  const { search, type, categoryId, accountId, startDate, endDate, view } = searchParams;
  
  // Pagination Parameters
  const page = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.pageSize) || 100;
  const skip = (page - 1) * pageSize;

  // 1. Calculate Date Ranges for Statistics (Summary Cards)
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  // 2. Fetch Statistics (Summary Cards)
  const [currentMonthStats, lastMonthStats] = await Promise.all([
    prisma.transaction.groupBy({
      by: ['type'],
      where: {
        date: { gte: currentMonthStart, lte: currentMonthEnd },
        user: { 
          // @ts-ignore
          familyId: user.familyId || user.id 
        }
      },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ['type'],
      where: {
        date: { gte: lastMonthStart, lte: lastMonthEnd },
        user: { 
          // @ts-ignore
          familyId: user.familyId || user.id 
        }
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

  // 3. Prepare Filters for List
  const where: Prisma.TransactionWhereInput = {
    user: {
      // @ts-ignore
      familyId: user.familyId || user.id // Fallback to user ID if no family (shouldn't happen with new logic)
    }
  };

  if (search && typeof search === 'string') {
    where.OR = [
      { description: { contains: search } }, 
    ];
  }

  if (type && typeof type === 'string') {
    where.type = type;
  }

  if (categoryId && typeof categoryId === 'string') {
    if (categoryId === 'uncategorized') {
      where.categoryId = null;
    } else {
      where.categoryId = categoryId;
    }
  }

  if (accountId && typeof accountId === 'string') {
    where.accountId = accountId;
  }

  if (startDate && typeof startDate === 'string') {
    const dateFilter = where.date as Prisma.DateTimeFilter || {};
    where.date = { ...dateFilter, gte: new Date(startDate) };
  }

  if (endDate && typeof endDate === 'string') {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    const dateFilter = where.date as Prisma.DateTimeFilter || {};
    where.date = { ...dateFilter, lte: end };
  }

  // 4. Fetch Transactions with Pagination
  const [transactions, totalCount] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        category: true,
        account: true,
        user: true,
      },
      skip,
      take: pageSize,
    }),
    prisma.transaction.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);
  const categories = await prisma.category.findMany();
  const accounts = await prisma.account.findMany();

  // 5. Fetch Statistics Data (for Dashboard)
  const oneYearAgo = new Date();
  oneYearAgo.setMonth(oneYearAgo.getMonth() - 11);
  oneYearAgo.setDate(1); // Start of that month
  oneYearAgo.setHours(0, 0, 0, 0);

  const statsTransactions = await prisma.transaction.findMany({
    where: {
      date: { gte: oneYearAgo },
      user: { 
        // @ts-ignore
        familyId: user.familyId || user.id 
      }
    },
    include: {
      category: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: { date: 'asc' }
  });

  // Process Data for Dashboard
  const monthlyMap = new Map<string, { income: number; expense: number }>();
  const categoryMap = new Map<string, number>();

  statsTransactions.forEach(tx => {
    const date = new Date(tx.date);
    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyMap.has(monthStr)) {
      monthlyMap.set(monthStr, { income: 0, expense: 0 });
    }
    const monthData = monthlyMap.get(monthStr)!;
    if (tx.type === 'INCOME') {
      monthData.income += tx.amount;
    } else if (tx.type === 'EXPENSE') {
      monthData.expense += tx.amount;
    }

    if (tx.categoryId && tx.category) {
      // Key format: month|categoryId|categoryName|type|userId|userName
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

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">交易记录</h1>
          <p className="text-muted-foreground mt-1">查看及管理您的所有收支明细</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <ExportButton />
          <Link href="/transactions/create">
            <Button className="gap-2 shadow-md w-full md:w-auto">
              <Plus className="h-4 w-4" /> 记一笔
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue={view === 'statistics' ? 'statistics' : 'list'} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">交易列表</TabsTrigger>
          <TabsTrigger value="statistics">统计分析</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-8">
          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 border-red-200 dark:border-red-900/50">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">本月支出</p>
                    <h3 className="text-2xl font-bold mt-2 text-red-700 dark:text-red-300">
                      ¥ {currentExpense.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                  <div className={`flex items-center text-sm font-medium ${expenseGrowth > 0 ? 'text-red-600' : 'text-green-600'} bg-white/50 dark:bg-black/20 px-2 py-1 rounded-full`}>
                    {expenseGrowth > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                    {Math.abs(expenseGrowth).toFixed(1)}% 
                    <span className="text-xs text-muted-foreground ml-1">环比</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 border-green-200 dark:border-green-900/50">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">本月收入</p>
                    <h3 className="text-2xl font-bold mt-2 text-green-700 dark:text-green-300">
                      ¥ {currentIncome.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                  <div className={`flex items-center text-sm font-medium ${incomeGrowth > 0 ? 'text-green-600' : 'text-red-600'} bg-white/50 dark:bg-black/20 px-2 py-1 rounded-full`}>
                     {incomeGrowth > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                     {Math.abs(incomeGrowth).toFixed(1)}%
                     <span className="text-xs text-muted-foreground ml-1">环比</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <TransactionFilters categories={categories} accounts={accounts} />
          
          <Card className="shadow-sm border-0 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
            <TransactionList 
              transactions={transactions}
              page={page}
              pageSize={pageSize}
              totalPages={totalPages}
              totalCount={totalCount}
            />
          </Card>
        </TabsContent>

        <TabsContent value="statistics">
          <StatisticsDashboard 
            monthlyStats={monthlyStats} 
            categoryStats={categoryStats} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
