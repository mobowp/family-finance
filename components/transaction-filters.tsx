'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";
import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface TransactionFiltersProps {
  categories: { id: string; name: string; type: string }[];
  accounts: { id: string; name: string }[];
}

export function TransactionFilters({ categories, accounts }: TransactionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(false);

  // Local state for inputs
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [type, setType] = useState(searchParams.get("type") || "");
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") || "");
  const [accountId, setAccountId] = useState(searchParams.get("accountId") || "");
  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (type) params.set("type", type);
    if (categoryId) params.set("categoryId", categoryId);
    if (accountId) params.set("accountId", accountId);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    startTransition(() => {
      router.push(`/transactions?${params.toString()}`);
    });
  };

  const handleReset = () => {
    setSearch("");
    setType("");
    setCategoryId("");
    setAccountId("");
    setStartDate("");
    setEndDate("");
    startTransition(() => {
      router.push("/transactions");
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索备注或金额..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9 bg-white dark:bg-zinc-900"
          />
        </div>
        <Button 
          variant={showFilters ? "secondary" : "outline"} 
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          筛选
        </Button>
        <Button onClick={handleSearch} disabled={isPending}>
          {isPending ? "查询中..." : "查询"}
        </Button>
      </div>

      {showFilters && (
        <Card className="p-4 bg-muted/30 border-dashed">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">收支类型</Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">全部类型</option>
                <option value="EXPENSE">支出</option>
                <option value="INCOME">收入</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">分类</Label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">全部分类</option>
                <option value="uncategorized">无分类</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">账户</Label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">全部账户</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 flex flex-col justify-end">
               <Button variant="ghost" onClick={handleReset} className="w-full text-muted-foreground hover:text-destructive">
                 <X className="h-4 w-4 mr-2" /> 清空条件
               </Button>
            </div>

            <div className="space-y-2 col-span-2 md:col-span-1">
              <Label className="text-xs text-muted-foreground">开始日期</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2 col-span-2 md:col-span-1">
              <Label className="text-xs text-muted-foreground">结束日期</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
