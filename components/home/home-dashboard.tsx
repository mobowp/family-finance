'use client';

import Link from "next/link";
import { 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CreditCard, 
  Activity,
  Plus,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AssetPieChart } from "@/components/home/asset-pie-chart";
import { LoveQuoteCard } from "@/components/home/love-quote-card";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useState } from "react";

interface HomeDashboardProps {
  user: any;
  totalWealth: number;
  monthlyIncome: number;
  monthlyExpense: number;
  transactions: any[];
  chartData: { name: string; value: number }[];
}

export function HomeDashboard({
  user,
  totalWealth,
  monthlyIncome,
  monthlyExpense,
  transactions,
  chartData
}: HomeDashboardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const now = new Date();

  const formatCurrency = (value: number) => {
    if (!isVisible) return '******';
    return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatTransactionAmount = (amount: number, type: string) => {
    if (!isVisible) return '******';
    const prefix = type === 'INCOME' ? '+' : '-';
    return `${prefix}${Math.abs(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                欢迎回来，{user.name || '用户'}
              </h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsVisible(!isVisible)}
                className="rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                {isVisible ? (
                  <Eye className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                )}
              </Button>
            </div>
            <p className="text-muted-foreground mt-1">
              今天是 {format(now, 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/transactions/create">
              <Button className="shadow-lg hover:scale-105 transition-transform bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
                <Plus className="mr-2 h-4 w-4" /> 记一笔
              </Button>
            </Link>
            <Link href="/wealth?tab=assets">
              <Button variant="outline" className="shadow-sm hover:scale-105 transition-transform bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <Wallet className="mr-2 h-4 w-4" /> 管理资产
              </Button>
            </Link>
          </div>
        </div>

        {/* Love Quote Card (Mobile Only) */}
        <div className="md:hidden">
          <LoveQuoteCard />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard 
            title="总资产" 
            value={formatCurrency(totalWealth)}
            icon={<Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
            trend="总财富"
            trendColor="text-blue-600"
          />
          <StatsCard 
            title="本月收入" 
            value={formatCurrency(monthlyIncome)}
            icon={<TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />}
            trend="本月累计"
            trendColor="text-green-600"
          />
          <StatsCard 
            title="本月支出" 
            value={formatCurrency(monthlyExpense)}
            icon={<TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />}
            trend="本月累计"
            trendColor="text-red-600"
          />
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Recent Transactions (Left - 8 cols) */}
          <div className="md:col-span-8 space-y-6">
            <Card className="border-white/20 dark:border-slate-700/30 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-xl h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl">近期交易</CardTitle>
                  <CardDescription>最近的收支记录</CardDescription>
                </div>
                <Link href="/transactions">
                  <Button variant="ghost" size="sm" className="gap-1">
                    查看全部 <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.length > 0 ? (
                    transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-4 rounded-lg bg-white/40 dark:bg-slate-800/40 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            tx.type === 'INCOME' 
                              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {tx.type === 'INCOME' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-medium">{isVisible ? (tx.description || tx.category?.name || '无描述') : '******'}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(tx.date), 'MM-dd HH:mm:ss')} · {tx.account.name}
                            </p>
                          </div>
                        </div>
                        <div className={`font-bold ${
                          tx.type === 'INCOME' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {formatTransactionAmount(tx.amount, tx.type)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      暂无交易记录
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar (Right - 4 cols) */}
          <div className="md:col-span-4 space-y-6 flex flex-col">
            
            {/* Love Quote Card (Desktop Only) */}
            <div className="hidden md:block">
              <LoveQuoteCard />
            </div>

            {/* Asset Distribution */}
            <Card className="border-white/20 dark:border-slate-700/30 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-xl flex-1">
              <CardHeader>
                <CardTitle className="text-xl">资产分布</CardTitle>
                <CardDescription>各类资产占比概览</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <div className={!isVisible ? "blur-md select-none transition-all duration-300" : "transition-all duration-300"}>
                    <AssetPieChart data={chartData} />
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    暂无资产数据
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions / Budget Preview */}
            <Card className="border-white/20 dark:border-slate-700/30 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl">快捷入口</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Link href="/wealth?tab=accounts" className="block">
                  <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer text-blue-600 dark:text-blue-400">
                    <CreditCard className="h-6 w-6 mb-2" />
                    <span className="text-sm font-medium">账户管理</span>
                  </div>
                </Link>
                <Link href="/transactions?view=statistics" className="block">
                  <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors cursor-pointer text-orange-600 dark:text-orange-400">
                    <Activity className="h-6 w-6 mb-2" />
                    <span className="text-sm font-medium">统计报表</span>
                  </div>
                </Link>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </main>
  );
}

function StatsCard({ title, value, icon, trend, trendColor }: { title: string, value: string, icon: React.ReactNode, trend: string, trendColor: string }) {
  return (
    <Card className="border-white/20 dark:border-slate-700/30 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-xl hover:-translate-y-1 transition-transform duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`text-xs ${trendColor} mt-1 font-medium flex items-center`}>
          {trend}
        </p>
      </CardContent>
    </Card>
  );
}
