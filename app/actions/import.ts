'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import * as XLSX from 'xlsx';
import { parse } from "date-fns";

export async function importTransactions(base64Data: string, options?: { autoCreateAccount?: boolean; autoCreateCategory?: boolean }) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    throw new Error("User not found");
  }

  const autoCreateAccount = options?.autoCreateAccount ?? false;
  const autoCreateCategory = options?.autoCreateCategory ?? false;

  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length > 0) {
      const firstRow = data[0] as any;
      console.log('Excel columns:', Object.keys(firstRow));
      console.log('First row data:', firstRow);
    }

    let categories = await prisma.category.findMany();
    let accounts = await prisma.account.findMany({
      where: {
        user: {
          OR: [
            { id: user.id },
            { familyId: user.familyId || user.id }
          ]
        }
      }
    });

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { id: user.id },
          { familyId: user.familyId || user.id }
        ]
      }
    });

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    const createdAccounts: string[] = [];
    const createdCategories: string[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const row: any = data[i];
      
      try {
        const dateStr = row['日期'];
        const typeStr = row['类型'];
        const amount = parseFloat(row['金额']);
        const categoryName = row['分类'];
        const accountName = row['账户'];
        const description = row['描述'] || '';
        const userName = row['归属人'] || row['记账人'];

        if (!dateStr || !typeStr || isNaN(amount)) {
          errors.push(`第 ${i + 2} 行: 缺少必填字段（日期、类型或金额）`);
          errorCount++;
          continue;
        }

        let date: Date;
        try {
          date = parse(dateStr, 'yyyy-MM-dd HH:mm:ss', new Date());
          if (isNaN(date.getTime())) {
            date = new Date(dateStr);
          }
        } catch (e) {
          errors.push(`第 ${i + 2} 行: 日期格式错误 "${dateStr}"`);
          errorCount++;
          continue;
        }

        const type = typeStr === '收入' ? 'INCOME' : 'EXPENSE';

        let category = categories.find(c => c.name === categoryName);
        if (!category && categoryName && categoryName !== '无分类') {
          if (autoCreateCategory) {
            category = await prisma.category.create({
              data: {
                name: categoryName,
                type: type,
              }
            });
            categories.push(category);
            createdCategories.push(categoryName);
          } else {
            errors.push(`第 ${i + 2} 行: 找不到分类 "${categoryName}"`);
            errorCount++;
            continue;
          }
        }

        let account = accounts.find(a => a.name === accountName);
        if (!account) {
          if (autoCreateAccount) {
            account = await prisma.account.create({
              data: {
                name: accountName,
                type: 'BANK',
                balance: 0,
                userId: user.id,
              }
            });
            accounts.push(account);
            createdAccounts.push(accountName);
          } else {
            errors.push(`第 ${i + 2} 行: 找不到账户 "${accountName}"`);
            errorCount++;
            continue;
          }
        }

        let targetUser = user;
        if (userName && userName !== user.name && userName !== user.email) {
          console.log(`Row ${i + 2}: Looking for user "${userName}", current user: "${user.name}"`);
          const foundUser = users.find(u => u.name === userName || u.email === userName);
          if (foundUser) {
            console.log(`Row ${i + 2}: Found user "${foundUser.name}"`);
            targetUser = foundUser;
          } else {
            console.log(`Row ${i + 2}: User not found, adding warning`);
            warnings.push(`第 ${i + 2} 行: 找不到用户 "${userName}"，已使用当前登录用户 "${user.name || user.email}"`);
          }
        } else {
          console.log(`Row ${i + 2}: Using current user. userName="${userName}", user.name="${user.name}"`);
        }

        await prisma.transaction.create({
          data: {
            date,
            type,
            amount,
            description,
            categoryId: category?.id || null,
            accountId: account.id,
            userId: targetUser.id,
          }
        });

        successCount++;
      } catch (error: any) {
        errors.push(`第 ${i + 2} 行: ${error.message}`);
        errorCount++;
      }
    }

    const uniqueWarnings = Array.from(new Set(warnings));
    
    console.log('Import summary:', {
      successCount,
      errorCount,
      warningsCount: uniqueWarnings.length,
      createdAccountsCount: new Set(createdAccounts).size,
      createdCategoriesCount: new Set(createdCategories).size
    });
    
    return {
      success: true,
      successCount,
      errorCount,
      errors: errors.slice(0, 10),
      totalErrors: errors.length,
      warnings: uniqueWarnings.slice(0, 10),
      totalWarnings: uniqueWarnings.length,
      createdAccounts: Array.from(new Set(createdAccounts)),
      createdCategories: Array.from(new Set(createdCategories))
    };
  } catch (error: any) {
    console.error('Import error:', error);
    throw new Error(`导入失败: ${error.message}`);
  }
}
