'use client';

import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface TransactionStatsCardsProps {
  currentExpense: number;
  currentIncome: number;
  expenseGrowth: number;
  incomeGrowth: number;
  isVisible: boolean;
}

export function TransactionStatsCards({
  currentExpense,
  currentIncome,
  expenseGrowth,
  incomeGrowth,
  isVisible
}: TransactionStatsCardsProps) {
  const formatCurrency = (value: number) => {
    if (!isVisible) return '******';
    return value.toLocaleString('zh-CN', { minimumFractionDigits: 2 });
  };

  const formatGrowth = (value: number) => {
    if (!isVisible) return '**';
    return Math.abs(value).toFixed(1);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 border-red-200 dark:border-red-900/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">本月支出</p>
                <h3 className="text-2xl font-bold mt-2 text-red-700 dark:text-red-300">
                  ¥ {formatCurrency(currentExpense)}
                </h3>
              </div>
              <div className={`flex items-center text-sm font-medium ${expenseGrowth > 0 ? 'text-red-600' : 'text-green-600'} bg-white/50 dark:bg-black/20 px-2 py-1 rounded-full`}>
                {expenseGrowth > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                {formatGrowth(expenseGrowth)}% 
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
                  ¥ {formatCurrency(currentIncome)}
                </h3>
              </div>
              <div className={`flex items-center text-sm font-medium ${incomeGrowth > 0 ? 'text-green-600' : 'text-red-600'} bg-white/50 dark:bg-black/20 px-2 py-1 rounded-full`}>
                {incomeGrowth > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                {formatGrowth(incomeGrowth)}%
                <span className="text-xs text-muted-foreground ml-1">环比</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
