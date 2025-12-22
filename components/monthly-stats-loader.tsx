'use client';

import { useState, useEffect } from 'react';
import { TransactionStatsCards } from '@/components/transaction-stats-cards';
import { Skeleton } from '@/components/ui/skeleton';

interface MonthlyStatsLoaderProps {
  isVisible: boolean;
}

export function MonthlyStatsLoader({ isVisible }: MonthlyStatsLoaderProps) {
  const [stats, setStats] = useState<{
    currentIncome: number;
    currentExpense: number;
    incomeGrowth: number;
    expenseGrowth: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/monthly-stats');
        if (!response.ok) {
          throw new Error('Failed to fetch monthly stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to load monthly stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <TransactionStatsCards
      currentExpense={stats.currentExpense}
      currentIncome={stats.currentIncome}
      expenseGrowth={stats.expenseGrowth}
      incomeGrowth={stats.incomeGrowth}
      isVisible={isVisible}
    />
  );
}