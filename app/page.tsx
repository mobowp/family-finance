import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { HomeDashboard } from "@/components/home/home-dashboard";

export default async function Home() {
  const session = await auth();
  const user = session?.user;

  if (!user?.email) {
    redirect('/login');
  }

  const userRecord = await prisma.user.findUnique({
    where: { email: user.email }
  });

  if (!userRecord) {
    redirect('/login');
  }

  const familyId = userRecord.familyId || userRecord.id;

  const [accounts, assets, transactions] = await Promise.all([
    prisma.account.findMany({ 
      where: { 
        user: {
          OR: [
            { id: userRecord.id },
            { familyId: familyId }
          ]
        }
      } 
    }),
    prisma.asset.findMany({ 
      where: { 
        user: {
          OR: [
            { id: userRecord.id },
            { familyId: familyId }
          ]
        }
      } 
    }),
    prisma.transaction.findMany({
      where: { 
        user: {
          OR: [
            { id: userRecord.id },
            { familyId: familyId }
          ]
        }
      },
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
      take: 5,
      include: { category: true, account: true }
    })
  ]);

  // 2. Calculate Stats
  // Total Assets
  const accountsTotal = accounts.reduce((sum, acc) => {
    // If account is CREDIT type, assume positive balance is debt
    if (acc.type === 'CREDIT') {
      return sum - acc.balance;
    }
    return sum + acc.balance;
  }, 0);
  
  const assetsTotal = assets.reduce((sum, asset) => {
    const price = asset.marketPrice || asset.costPrice || 0;
    return sum + (asset.quantity * price);
  }, 0);
  const totalWealth = accountsTotal + assetsTotal;

  // Monthly Stats
  const now = new Date();
  // Start of current month (00:00:00)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  // Start of next month (00:00:00)
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const monthlyTransactions = await prisma.transaction.findMany({
    where: {
      user: {
        OR: [
          { id: userRecord.id },
          { familyId: familyId }
        ]
      },
      date: {
        gte: startOfMonth,
        lt: startOfNextMonth
      }
    }
  });

  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const monthlyExpense = monthlyTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  // Asset Distribution for Chart
  const accountTypeMap: Record<string, number> = {};
  accounts.forEach(acc => {
    // Skip credit accounts if they are debts (positive balance)
    if (acc.type === 'CREDIT' && acc.balance > 0) return;
    
    const typeName = getAccountTypeName(acc.type);
    accountTypeMap[typeName] = (accountTypeMap[typeName] || 0) + acc.balance;
  });

  const assetTypeMap: Record<string, number> = {};
  assets.forEach(asset => {
    const typeName = getAssetTypeName(asset.type);
    const value = asset.quantity * (asset.marketPrice || asset.costPrice || 0);
    assetTypeMap[typeName] = (assetTypeMap[typeName] || 0) + value;
  });

  const chartData = [
    ...Object.entries(accountTypeMap).map(([name, value]) => ({ name, value })),
    ...Object.entries(assetTypeMap).map(([name, value]) => ({ name, value }))
  ].filter(item => item.value > 0);

  return (
    <>
      <HomeDashboard 
        user={user}
        totalWealth={totalWealth}
        monthlyIncome={monthlyIncome}
        monthlyExpense={monthlyExpense}
        transactions={transactions}
        chartData={chartData}
      />
    </>
  );
}

function getAccountTypeName(type: string) {
  const map: Record<string, string> = {
    'CASH': '现金',
    'SAVINGS': '存储',
    'INVESTMENT': '投资',
    'DEBT': '负债',
    // Keep old types for compatibility if needed, or remove them
    'BANK': '银行卡',
    'ALIPAY': '支付宝',
    'WECHAT': '微信',
    'CREDIT': '信用卡',
    'OTHER': '其他'
  };
  return map[type] || type;
}

function getAssetTypeName(type: string) {
  const map: Record<string, string> = {
    'STOCK': '股票',
    'FUND': '基金',
    'PHYSICAL_GOLD': '实物黄金',
    'HK_STOCK': '港股',
    'US_STOCK': '美股',
    'CN_STOCK': 'A股',
    'CRYPTO': '加密货币',
    'BOND': '债券',
    'REAL_ESTATE': '房产',
    'OTHER': '其他'
  };
  return map[type] || type;
}
