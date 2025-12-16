'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, RefreshCw, Calendar, Wallet, Activity, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDailyLoveQuote, refreshDailyLoveQuote, QuoteResult } from "@/app/actions/love-quote";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function LoveQuoteCard() {
  const [quoteData, setQuoteData] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await getDailyLoveQuote();
      setQuoteData(data);
    } catch (error) {
      console.error("Failed to load quote data", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const newData = await refreshDailyLoveQuote();
      if (newData) {
        setQuoteData(newData);
        toast.success("已更新今日内容");
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
          <CardTitle className="text-sm font-medium">每日寄语</CardTitle>
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

  // 根据类型选择图标和颜色
  const getTemplateConfig = (type: string) => {
    switch (type) {
      case 'financial_status':
        return {
          title: '财务日报',
          icon: Wallet,
          color: 'text-blue-500',
          bgColor: 'bg-blue-100/50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-900',
          gradient: 'from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-950',
          textColor: 'text-blue-700 dark:text-blue-300'
        };
      case 'spending_diagnosis':
        return {
          title: '消费诊断',
          icon: Activity,
          color: 'text-red-500',
          bgColor: 'bg-red-100/50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-900',
          gradient: 'from-red-50 to-white dark:from-red-950/20 dark:to-slate-950',
          textColor: 'text-red-700 dark:text-red-300'
        };
      case 'what_to_eat':
        return {
          title: '今天吃什么',
          icon: Utensils,
          color: 'text-orange-500',
          bgColor: 'bg-orange-100/50 dark:bg-orange-900/20',
          borderColor: 'border-orange-200 dark:border-orange-900',
          gradient: 'from-orange-50 to-white dark:from-orange-950/20 dark:to-slate-950',
          textColor: 'text-orange-700 dark:text-orange-300'
        };
      case 'love_quote':
      default:
        return {
          title: '每日情话',
          icon: Heart,
          color: 'text-pink-500',
          bgColor: 'bg-pink-100/50 dark:bg-pink-900/20',
          borderColor: 'border-pink-200 dark:border-pink-900',
          gradient: 'from-pink-50 to-white dark:from-pink-950/20 dark:to-slate-950',
          textColor: 'text-pink-700 dark:text-pink-300'
        };
    }
  };

  const config = getTemplateConfig(quoteData?.type || 'love_quote');
  const Icon = config.icon;

  return (
    <Card className={cn("relative overflow-hidden", config.borderColor, "bg-gradient-to-br", config.gradient)}>
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Icon className={cn("w-24 h-24", config.color)} />
      </div>
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4 fill-current", config.color)} />
          <CardTitle className={cn("text-sm font-medium", config.textColor)}>{config.title}</CardTitle>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("h-8 w-8 hover:bg-white/50 dark:hover:bg-slate-800/50", config.color)}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
        </Button>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <div className="space-y-4">
          <div className="min-h-[60px] flex items-center">
            <p className="text-base tracking-wide text-justify text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
              {quoteData?.content || "内容生成中..."}
            </p>
          </div>
          
          {quoteData?.type === 'love_quote' && quoteData.daysLoved !== null && (
            <div className={cn("flex items-center gap-2 text-sm p-2 rounded-lg w-fit", config.textColor, config.bgColor)}>
              <Calendar className="w-4 h-4" />
              <span>我们已经相爱 <span className="font-bold text-lg">{quoteData.daysLoved}</span> 天</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
