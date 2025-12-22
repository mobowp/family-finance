'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import React, { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CornerDownRight, Loader2 } from "lucide-react";

interface TransactionFormProps {
  action: (formData: FormData) => Promise<void>;
  categories: { id: string; name: string; type: string }[];
  accounts: { id: string; name: string; balance: number; parentId?: string | null }[];
  defaultValues?: {
    type: string;
    amount: number;
    categoryId: string | null;
    accountId: string;
    date: Date;
    description: string | null;
  };
  submitLabel?: string;
}

export function TransactionForm({ 
  action, 
  categories, 
  accounts, 
  defaultValues,
  submitLabel = "保存"
}: TransactionFormProps) {
  const [selectedType, setSelectedType] = useState(defaultValues?.type || "EXPENSE");
  const [isPending, startTransition] = useTransition();

  const filteredCategories = categories.filter(cat => cat.type === selectedType);

  // Group accounts by hierarchy
  const getFlattenedAccounts = () => {
    const accountMap = new Map(accounts.map(a => [a.id, a]));
    const visited = new Set<string>();
    const result: (typeof accounts[0] & { depth: number })[] = [];

    const processAccount = (account: typeof accounts[0], depth: number) => {
      if (visited.has(account.id)) return;
      visited.add(account.id);
      
      result.push({ ...account, depth });
      
      // Find children
      const children = accounts.filter(a => a.parentId === account.id);
      children.forEach(child => processAccount(child, depth + 1));
    };

    // Process top-level accounts (those with no parent or parent not in list)
    const topLevelAccounts = accounts.filter(a => !a.parentId || !accountMap.has(a.parentId));
    topLevelAccounts.forEach(acc => processAccount(acc, 0));

    // Process any remaining accounts (orphans or cycles, though cycles shouldn't happen in valid tree)
    accounts.forEach(acc => {
      if (!visited.has(acc.id)) {
        processAccount(acc, 0);
      }
    });

    return result;
  };

  const flattenedAccounts = getFlattenedAccounts();

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      await action(formData);
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="type">交易类型</Label>
        <Select 
          name="type" 
          value={selectedType} 
          onValueChange={setSelectedType}
          required
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="选择类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EXPENSE">支出</SelectItem>
            <SelectItem value="INCOME">收入</SelectItem>
            <SelectItem value="TRANSFER">转账</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">金额</Label>
        <Input 
          type="number" 
          id="amount" 
          name="amount" 
          placeholder="0.00" 
          step="0.01" 
          defaultValue={defaultValues?.amount}
          required 
        />
      </div>

      {selectedType !== 'TRANSFER' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
              <Label htmlFor="categoryId">分类</Label>
              <Link href="/settings?tab=categories" className="text-xs text-blue-600 hover:underline">
                  管理分类
              </Link>
          </div>
          <Select 
            name="categoryId" 
            defaultValue={defaultValues?.categoryId || "none"}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">无分类</SelectItem>
              {filteredCategories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="accountId">{selectedType === 'TRANSFER' ? '转出账户' : '账户'}</Label>
        {flattenedAccounts.length === 0 ? (
          <div className="flex flex-col gap-2 p-4 border border-dashed rounded-md bg-muted/50">
            <p className="text-sm text-muted-foreground">暂无账户，请先创建账户</p>
            <Link href="/accounts/create">
              <Button type="button" variant="outline" size="sm" className="w-full">
                前往创建账户
              </Button>
            </Link>
          </div>
        ) : (
          <Select 
            name="accountId" 
            defaultValue={defaultValues?.accountId} 
            required
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择账户" />
            </SelectTrigger>
            <SelectContent>
              {flattenedAccounts.map((account) => (
                <SelectItem 
                  key={account.id} 
                  value={account.id} 
                  className={account.depth === 0 ? "font-medium" : ""}
                  style={{ paddingLeft: account.depth > 0 ? `${account.depth * 1.5 + 0.5}rem` : undefined }}
                >
                  <div className="flex items-center w-full gap-2">
                    {account.depth > 0 && (
                      <CornerDownRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                    )}
                    <span>{account.name}</span>
                    <span className="text-muted-foreground text-xs ml-auto">¥{account.balance}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {selectedType === 'TRANSFER' && (
        <div className="space-y-2">
          <Label htmlFor="targetAccountId">转入账户</Label>
          {flattenedAccounts.length === 0 ? (
            <div className="flex flex-col gap-2 p-4 border border-dashed rounded-md bg-muted/50">
              <p className="text-sm text-muted-foreground">暂无账户，请先创建账户</p>
              <Link href="/accounts/create">
                <Button type="button" variant="outline" size="sm" className="w-full">
                  前往创建账户
                </Button>
              </Link>
            </div>
          ) : (
            <Select 
              name="targetAccountId" 
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择转入账户" />
              </SelectTrigger>
              <SelectContent>
                {flattenedAccounts.map((account) => (
                  <SelectItem 
                    key={account.id} 
                    value={account.id} 
                    className={account.depth === 0 ? "font-medium" : ""}
                    style={{ paddingLeft: account.depth > 0 ? `${account.depth * 1.5 + 0.5}rem` : undefined }}
                  >
                    <div className="flex items-center w-full gap-2">
                      {account.depth > 0 && (
                        <CornerDownRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                      )}
                      <span>{account.name}</span>
                      <span className="text-muted-foreground text-xs ml-auto">¥{account.balance}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="date">日期时间</Label>
        <Input 
          type="datetime-local" 
          id="date" 
          name="date" 
          step="1"
          defaultValue={defaultValues?.date 
            ? new Date(new Date(defaultValues.date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19)
            : new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19)
          } 
          required 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">备注</Label>
        <Input 
          type="text" 
          id="description" 
          name="description" 
          defaultValue={defaultValues?.description || ""}
          placeholder="例如：午餐、工资" 
        />
      </div>

      <div className="flex gap-4">
        <Link href="/transactions" className="w-full">
          <Button type="button" variant="outline" className="w-full" disabled={isPending}>
            取消
          </Button>
        </Link>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              保存中...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
