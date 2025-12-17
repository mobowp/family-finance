'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { importTransactions } from "@/app/actions/import";
import { toast } from "sonner";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [autoCreateAccount, setAutoCreateAccount] = useState(true);
  const [autoCreateCategory, setAutoCreateCategory] = useState(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        toast.error('请选择 Excel 文件（.xlsx 或 .xls）');
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('请先选择文件');
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const bytes = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);
          
          const result = await importTransactions(base64, {
            autoCreateAccount,
            autoCreateCategory
          });
          
          console.log('Import result:', result);
          setResult(result);
          
          if (result.errorCount === 0) {
            toast.success(`成功导入 ${result.successCount} 条记录！`);
          } else {
            toast.warning(`导入完成：成功 ${result.successCount} 条，失败 ${result.errorCount} 条`);
          }
        } catch (error: any) {
          toast.error(error.message || '导入失败');
          console.error('Import error:', error);
        } finally {
          setImporting(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      toast.error(error.message || '读取文件失败');
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center gap-4">
          <Link href="/transactions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              导入交易记录
            </h1>
            <p className="text-muted-foreground mt-1">
              从 Excel 文件批量导入交易数据
            </p>
          </div>
        </div>

        <Card className="border-white/20 dark:border-slate-700/30 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-xl">
          <CardHeader>
            <CardTitle>上传 Excel 文件</CardTitle>
            <CardDescription>
              请确保 Excel 文件包含以下列：日期、类型、金额、分类、账户、描述、归属人（或记账人）
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>导入前准备</AlertTitle>
              <AlertDescription className="space-y-2 mt-2">
                <p>1. 确保 Excel 文件格式正确，包含必填列：<strong>日期、类型、金额、账户</strong></p>
                <p>2. 日期格式：<code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">yyyy-MM-dd HH:mm:ss</code> 或 <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">yyyy-MM-dd</code></p>
                <p>3. 类型：<strong>收入</strong> 或 <strong>支出</strong></p>
              </AlertDescription>
            </Alert>

            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <h4 className="font-medium text-sm">导入选项</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCreateAccount}
                    onChange={(e) => setAutoCreateAccount(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">自动创建不存在的账户</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCreateCategory}
                    onChange={(e) => setAutoCreateCategory(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">自动创建不存在的分类</span>
                </label>
              </div>
            </div>

            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-4">
                  {file ? (
                    <>
                      <FileSpreadsheet className="h-16 w-16 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-lg font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="h-16 w-16 text-slate-400" />
                      <div>
                        <p className="text-lg font-medium">点击选择文件</p>
                        <p className="text-sm text-muted-foreground">
                          支持 .xlsx 和 .xls 格式
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleImport}
                disabled={!file || importing}
                className="flex-1"
              >
                {importing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    导入中...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    开始导入
                  </>
                )}
              </Button>
              {file && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setFile(null);
                    setResult(null);
                  }}
                >
                  清除
                </Button>
              )}
            </div>

            {result && (
              <Alert className={result.errorCount === 0 ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"}>
                {result.errorCount === 0 ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                )}
                <AlertTitle>导入结果</AlertTitle>
                <AlertDescription className="space-y-2 mt-2">
                  <p>✅ 成功导入：<strong>{result.successCount}</strong> 条</p>
                  {result.createdAccounts && result.createdAccounts.length > 0 && (
                    <p>🆕 自动创建账户：<strong>{result.createdAccounts.join('、')}</strong></p>
                  )}
                  {result.createdCategories && result.createdCategories.length > 0 && (
                    <p>🆕 自动创建分类：<strong>{result.createdCategories.join('、')}</strong></p>
                  )}
                  {result.warnings && result.warnings.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="font-medium">⚠️ 警告信息（前 10 条）：</p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {result.warnings.map((warning: string, index: number) => (
                          <li key={index} className="text-yellow-600 dark:text-yellow-400">
                            {warning}
                          </li>
                        ))}
                      </ul>
                      {result.totalWarnings > 10 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          还有 {result.totalWarnings - 10} 条警告未显示
                        </p>
                      )}
                    </div>
                  )}
                  {result.errorCount > 0 && (
                    <>
                      <p>❌ 失败：<strong>{result.errorCount}</strong> 条</p>
                      {result.errors && result.errors.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <p className="font-medium">错误详情（前 10 条）：</p>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {result.errors.map((error: string, index: number) => (
                              <li key={index} className="text-red-600 dark:text-red-400">
                                {error}
                              </li>
                            ))}
                          </ul>
                          {result.totalErrors > 10 && (
                            <p className="text-sm text-muted-foreground mt-2">
                              还有 {result.totalErrors - 10} 条错误未显示
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  <div className="mt-4">
                    <Link href="/transactions">
                      <Button variant="outline" size="sm">
                        查看交易记录
                      </Button>
                    </Link>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/20 dark:border-slate-700/30 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-xl">
          <CardHeader>
            <CardTitle>Excel 文件格式示例</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left p-2 font-medium">日期</th>
                    <th className="text-left p-2 font-medium">类型</th>
                    <th className="text-left p-2 font-medium">金额</th>
                    <th className="text-left p-2 font-medium">分类</th>
                    <th className="text-left p-2 font-medium">账户</th>
                    <th className="text-left p-2 font-medium">描述</th>
                    <th className="text-left p-2 font-medium">记账人</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="p-2">2024-01-01 12:00:00</td>
                    <td className="p-2">支出</td>
                    <td className="p-2">50.00</td>
                    <td className="p-2">餐饮</td>
                    <td className="p-2">微信</td>
                    <td className="p-2">午餐</td>
                    <td className="p-2">张三</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="p-2">2024-01-02 09:30:00</td>
                    <td className="p-2">收入</td>
                    <td className="p-2">5000.00</td>
                    <td className="p-2">工资</td>
                    <td className="p-2">银行卡</td>
                    <td className="p-2">月薪</td>
                    <td className="p-2">张三</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
