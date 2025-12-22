'use client';

import { Card } from "@/components/ui/card";
import { MonthlyStatsLoader } from "@/components/monthly-stats-loader";
import { TransactionList } from "@/components/transaction-list";
import { TransactionFilters } from "@/components/transaction-filters";
import { useVisibilityState } from "@/hooks/use-visibility-state";

interface TransactionPageWrapperProps {
  transactions: any[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  categories: any[];
  accounts: any[];
}

export function TransactionPageWrapper({
  transactions,
  page,
  pageSize,
  totalPages,
  totalCount,
  categories,
  accounts
}: TransactionPageWrapperProps) {
  const { isVisible, toggleVisibility } = useVisibilityState();

  return (
    <div className="space-y-8">
      <MonthlyStatsLoader isVisible={isVisible} />

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
