import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/actions/user";
import { WealthDashboard } from "@/components/wealth/wealth-dashboard";

export default async function WealthPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const currentUser = await getCurrentUser();
  
  // Fetch accounts
  let accounts: any[] = [];
  try {
     accounts = await prisma.account.findMany({
       // @ts-ignore
       where: { 
         parentId: null,
         user: {
           // @ts-ignore
           familyId: currentUser?.familyId || currentUser?.id
         }
       },
       include: { 
        // @ts-ignore
        children: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
       }
     });
  } catch (e) {
     console.error(e);
  }

  // Always fetch users for filtering, regardless of role
  const users = await prisma.user.findMany({
    where: {
      // @ts-ignore
      familyId: currentUser?.familyId || currentUser?.id
    },
    select: { id: true, name: true, email: true }
  });

  // Fetch assets
  const assets = await prisma.asset.findMany({
    where: {
      user: {
        // @ts-ignore
        familyId: currentUser?.familyId || currentUser?.id
      }
    },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });
  const assetTypes = await prisma.assetType.findMany();

  // Calculate totals
  const totalAccountBalance = accounts.reduce((sum, account) => {
    const childBalance = account.children?.reduce((cSum: number, child: any) => cSum + child.balance, 0) || 0;
    return sum + account.balance + childBalance;
  }, 0);

  const totalAssetValue = assets.reduce((sum, asset) => {
    const price = asset.marketPrice || asset.costPrice;
    return sum + (price * asset.quantity);
  }, 0);

  const totalWealth = totalAccountBalance + totalAssetValue;

  return (
    <WealthDashboard 
      totalWealth={totalWealth}
      totalAccountBalance={totalAccountBalance}
      totalAssetValue={totalAssetValue}
      accounts={accounts}
      assets={assets}
      assetTypes={assetTypes}
      users={users}
      defaultTab={(searchParams.tab as string) || "accounts"}
    />
  );
}
