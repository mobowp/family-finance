'use client';

import { useState } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { TransactionActions } from "@/components/transaction-actions";
import { PaginationControl } from "@/components/pagination-control";
import { deleteTransactions } from "@/app/actions/transaction";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TransactionListProps {
  transactions: any[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  isVisible: boolean;
}

export function TransactionList({ 
  transactions, 
  page, 
  pageSize, 
  totalPages, 
  totalCount,
  isVisible
}: TransactionListProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(transactions.map(tx => tx.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTransactions(selectedIds);
      setSelectedIds([]);
      setIsDeleteDialogOpen(false);
      toast({
        title: "删除成功",
        description: `已删除 ${selectedIds.length} 条记录`,
      });
    } catch (error) {
      toast({
        title: "删除失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="mb-6 flex justify-between items-center px-2">
        <div className="text-sm text-muted-foreground">
          {selectedIds.length > 0 ? `已选择 ${selectedIds.length} 项` : `共 ${totalCount} 条记录`}
        </div>
        {selectedIds.length > 0 && (
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => setIsDeleteDialogOpen(true)}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" /> 批量删除
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-md border">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p>暂无交易记录</p>
            <Link href="/transactions/create" className="mt-4 text-primary hover:underline">
              立即记录第一笔收支
            </Link>
          </div>
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="h-14 px-6 w-[50px]">
                    <Checkbox 
                      checked={selectedIds.length === transactions.length && transactions.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="h-14 px-6 font-medium text-muted-foreground w-[150px]">日期</th>
                  <th className="h-14 px-6 font-medium text-muted-foreground w-[150px]">分类</th>
                  <th className="h-14 px-6 font-medium text-muted-foreground">备注</th>
                  <th className="h-14 px-6 font-medium text-muted-foreground w-[100px]">记账人</th>
                  <th className="h-14 px-6 font-medium text-muted-foreground w-[150px]">账户</th>
                  <th className="h-14 px-6 font-medium text-muted-foreground text-right w-[150px]">金额</th>
                  <th className="h-14 px-6 font-medium text-muted-foreground text-right w-[100px]">操作</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors group">
                    <td className="p-6">
                      <Checkbox 
                        checked={selectedIds.includes(tx.id)}
                        onCheckedChange={(checked) => handleSelectOne(tx.id, checked as boolean)}
                      />
                    </td>
                    <td className="p-6 font-medium text-foreground/90" suppressHydrationWarning>
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td className="p-6">
                      <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                        {tx.category?.name || '无分类'}
                      </span>
                    </td>
                    <td className="p-6 text-muted-foreground max-w-[300px] truncate">
                      {isVisible ? (tx.description || '-') : '******'}
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={tx.user?.image || undefined} 
                            alt={tx.user?.name || '用户头像'}
                          />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                              {tx.user?.name?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground whitespace-nowrap">{tx.user?.name || '未知'}</span>
                      </div>
                    </td>
                    <td className="p-6 text-foreground/80">{tx.account.name}</td>
                    <td className="p-6 text-right font-mono font-medium">
                      <div className={`flex items-center justify-end gap-1 ${tx.type === 'EXPENSE' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {tx.type === 'EXPENSE' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                        <span className="text-base">
                          {isVisible ? (
                            <>
                              {tx.type === 'EXPENSE' ? '-' : '+'}
                              {tx.amount.toFixed(2)}
                            </>
                          ) : '******'}
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      <TransactionActions id={tx.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 border-t">
               <PaginationControl 
                  currentPage={page}
                  pageSize={pageSize}
                  totalPages={totalPages}
                  totalCount={totalCount}
               />
            </div>
          </>
        )}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除选中的 {selectedIds.length} 条记录吗？此操作无法撤销，且会影响相关账户的余额。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
