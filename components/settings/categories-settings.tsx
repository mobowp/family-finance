import { prisma } from "@/lib/prisma";
import { CreateCategoryDialog } from "@/components/create-category-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteCategoryButton } from "./delete-category-button";

export async function CategoriesSettings() {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const expenseCategories = categories.filter(c => c.type === 'EXPENSE');
  const incomeCategories = categories.filter(c => c.type === 'INCOME');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h3 className="text-lg font-medium">分类列表</h3>
           <p className="text-sm text-muted-foreground">自定义您的收入与支出分类。</p>
        </div>
        <CreateCategoryDialog />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600 text-base">支出分类</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {expenseCategories.length === 0 ? (
                <p className="text-muted-foreground text-sm">暂无支出分类</p>
            ) : (
                <div className="flex flex-wrap gap-2">
                {expenseCategories.map(category => (
                    <div key={category.id} className="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-1.5 rounded-full border border-red-200 dark:border-red-900">
                        <span className="text-sm font-medium">{category.name}</span>
                        <DeleteCategoryButton 
                            id={category.id} 
                            name={category.name} 
                            colorClass="text-red-400 hover:text-red-600"
                        />
                    </div>
                ))}
                </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-green-600 text-base">收入分类</CardTitle>
          </CardHeader>
          <CardContent>
             {incomeCategories.length === 0 ? (
                <p className="text-muted-foreground text-sm">暂无收入分类</p>
            ) : (
                <div className="flex flex-wrap gap-2">
                {incomeCategories.map(category => (
                    <div key={category.id} className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-900">
                        <span className="text-sm font-medium">{category.name}</span>
                        <DeleteCategoryButton 
                            id={category.id} 
                            name={category.name} 
                            colorClass="text-green-400 hover:text-green-600"
                        />
                    </div>
                ))}
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
