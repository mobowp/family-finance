'use client';

import { Download } from "lucide-react";
import { exportTransactions } from "@/app/actions/export";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function ExportMenuItem() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      const params: { [key: string]: string } = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });

      const base64 = await exportTransactions(params);
      
      const link = document.createElement('a');
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
      link.download = `交易明细_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("交易明细已成功导出为 Excel 文件");
    } catch (error) {
      console.error('Export failed:', error);
      toast.error("导出过程中发生错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0 cursor-pointer flex items-center"
      onClick={handleExport}
    >
      <Download className="h-4 w-4 mr-2" />
      {loading ? "导出中..." : "导出数据"}
    </div>
  );
}
