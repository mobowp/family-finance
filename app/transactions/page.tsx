import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Upload, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { StatisticsTabContent } from "@/components/statistics-tab-content";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExportMenuItem } from "@/components/export-menu-item";
import { TransactionPageWrapper } from "@/components/transaction-page-wrapper";
import { TransactionPageHeader } from "@/components/transaction-page-header";
import { getCachedCategories, getCachedAccounts } from "@/lib/cache";

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
    where: { email: session.user.email },
    select: { id: true, familyId: true }
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
  
  const page = Number(params.page) || 1;
  const pageSize = Number(params.pageSize) || 50;
  const skip = (page - 1) * pageSize;

  // 月度统计数据改为客户端按需加载

  // Prepare Filters for List
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

  // 4. Fetch Transactions with Pagination (并行查询，使用缓存的分类和账户)
  const [transactions, totalCount, categories, accounts] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        amount: true,
        type: true,
        date: true,
        description: true,
        categoryId: true,
        accountId: true,
        userId: true,
        category: {
          select: { id: true, name: true, type: true }
        },
        account: {
          select: { id: true, name: true }
        },
        user: {
          select: { id: true, name: true, email: true, image: true }
        },
      },
      skip,
      take: pageSize,
    }),
    prisma.transaction.count({ where }),
    getCachedCategories(),
    getCachedAccounts(),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // 统计数据改为客户端按需加载

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <TransactionPageHeader />
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
          <StatisticsTabContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}
