'use client';

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TransactionStatsCards } from "@/components/transaction-stats-cards";
import { TransactionList } from "@/components/transaction-list";
import { TransactionFilters } from "@/components/transaction-filters";

interface TransactionPageWrapperProps {
  currentExpense: number;
  currentIncome: number;
  expenseGrowth: number;
  incomeGrowth: number;
  transactions: any[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  categories: any[];
  accounts: any[];
}

export function TransactionPageWrapper({
  currentExpense,
  currentIncome,
  expenseGrowth,
  incomeGrowth,
  transactions,
  page,
  pageSize,
  totalPages,
  totalCount,
  categories,
  accounts
}: TransactionPageWrapperProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
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
        <h2 className="text-lg font-semibold">交易数据</h2>
      </div>

      <TransactionStatsCards 
        currentExpense={currentExpense}
        currentIncome={currentIncome}
        expenseGrowth={expenseGrowth}
        incomeGrowth={incomeGrowth}
        isVisible={isVisible}
      />

      <TransactionFilters categories={categories} accounts={accounts} />
      
      <Card className="shadow-sm border-0 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
        <TransactionList 
          transactions={transactions}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          totalCount={totalCount}
          isVisible={isVisible}
        />
      </Card>
    </div>
  );
}
