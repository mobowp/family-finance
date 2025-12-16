'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, RefreshCw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDailyLoveQuote, refreshDailyLoveQuote, getLoveDays } from "@/app/actions/love-quote";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function LoveQuoteCard() {
  const [quote, setQuote] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [daysTogether, setDaysTogether] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // 并行加载情话和相爱天数
      const [quoteData, days] = await Promise.all([
        getDailyLoveQuote(),
        calculateDaysTogether()
      ]);
      
      if (quoteData) {
        setQuote(quoteData);
      }
      setDaysTogether(days);
    } catch (error) {
      console.error("Failed to load love quote data", error);
    } finally {
      setLoading(false);
    }
  }

  async function calculateDaysTogether() {
    try {
      const days = await getLoveDays();
      return days;
    } catch (e) {
      return null;
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const newQuote = await refreshDailyLoveQuote();
      if (newQuote) {
        setQuote(newQuote);
        toast.success("已更新今日情话");
      }
    } catch (error) {
      toast.error("更新失败");
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">每日情话</CardTitle>
          <Heart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-20 flex items-center justify-center">
            <span className="text-sm text-muted-foreground">加载中...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-pink-200 dark:border-pink-900 bg-gradient-to-br from-pink-50 to-white dark:from-pink-950/20 dark:to-slate-950">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Heart className="w-24 h-24 text-pink-500" />
      </div>
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />
          <CardTitle className="text-sm font-medium text-pink-700 dark:text-pink-300">每日情话</CardTitle>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-pink-400 hover:text-pink-600 hover:bg-pink-100 dark:hover:bg-pink-900/30"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
        </Button>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <div className="space-y-4">
          <div className="min-h-[60px] flex items-center">
            <p className="text-base tracking-wide text-justify text-slate-700 dark:text-slate-200 leading-relaxed">
              "{quote || "陪伴是最长情的告白。"}"
            </p>
          </div>
          
          {daysTogether !== null && (
            <div className="flex items-center gap-2 text-sm text-pink-600 dark:text-pink-400 bg-pink-100/50 dark:bg-pink-900/20 p-2 rounded-lg w-fit">
              <Calendar className="w-4 h-4" />
              <span>我们已经相爱 <span className="font-bold text-lg">{daysTogether}</span> 天</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
