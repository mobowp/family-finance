'use client';

import { useState, useEffect } from 'react';
import { StatisticsDashboard } from '@/components/statistics/statistics-dashboard';
import { Loader2 } from 'lucide-react';

export function StatisticsTabContent() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/statistics');
        if (!response.ok) {
          throw new Error('Failed to fetch statistics');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">加载统计数据中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-destructive">加载失败: {error}</p>
      </div>
    );
  }

  if (!data || !data.monthlyStats || data.monthlyStats.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">暂无统计数据</p>
      </div>
    );
  }

  return (
    <StatisticsDashboard 
      monthlyStats={data.monthlyStats} 
      categoryStats={data.categoryStats} 
    />
  );
}