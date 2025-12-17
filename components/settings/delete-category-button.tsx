'use client';

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteCategory } from "@/app/actions/category";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeleteCategoryButtonProps {
  id: string;
  name: string;
  colorClass?: string; // 用于区分收入/支出的颜色
}

export function DeleteCategoryButton({ id, name, colorClass = "text-red-400 hover:text-red-600" }: DeleteCategoryButtonProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteCategory(id);
      toast.success(`分类 "${name}" 已删除`);
      setOpen(false);
    } catch (error) {
      toast.error("删除失败，可能该分类下有交易记录");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button 
          className={`ml-1 transition-colors ${colorClass}`}
          disabled={isDeleting}
          type="button"
        >
          {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除分类 "{name}"？</AlertDialogTitle>
          <AlertDialogDescription>
            此操作无法撤销。如果该分类下已有交易记录，删除可能会失败。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "删除中..." : "确认删除"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
