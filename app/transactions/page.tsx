import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, TrendingUp, TrendingDown, Download, Upload, FileDown } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExportMenuItem } from "@/components/export-menu-item";
import { TransactionPageWrapper } from "@/components/transaction-page-wrapper";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
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

  const familyId = user.familyId || user.id;
  const userFilter = {
    OR: [
      { id: user.id },
      { familyId: familyId }
    ]
  };

  const params = await searchParams;
  const { search, type, categoryId, accountId, startDate, endDate, view } = params;
  
  // Pagination Parameters
  const page = Number(params.page) || 1;
  const pageSize = Number(params.pageSize) || 100;
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
      user: userFilter
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 shadow-sm w-full md:w-auto">
                <FileDown className="h-4 w-4" /> 数据管理
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/transactions/import" className="cursor-pointer flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  导入数据
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                 <ExportMenuItem />
               </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          <TransactionPageWrapper 
            currentExpense={currentExpense}
            currentIncome={currentIncome}
            expenseGrowth={expenseGrowth}
            incomeGrowth={incomeGrowth}
            transactions={transactions}
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            totalCount={totalCount}
            categories={categories}
            accounts={accounts}
          />
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
