import { createAccount } from "@/app/actions/account";
import { AccountForm } from "@/components/account-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/actions/user";

export default async function CreateAccountPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const user = await getCurrentUser();
  
  if (!user) {
    return <div>请先登录</div>;
  }

  const familyId = (user as any).familyId || user.id;
  const accounts = await prisma.account.findMany({
    where: { 
      parentId: null,
      user: {
        OR: [
          { id: user.id },
          { familyId: familyId }
        ]
      }
    } 
  });

  const isAdmin = user.role === 'ADMIN';
  let users: { id: string; name: string | null; email: string }[] = [];
  if (isAdmin) {
    users = await prisma.user.findMany({
      where: {
        OR: [
          { id: familyId },
          { familyId: familyId }
        ]
      },
      select: { id: true, name: true, email: true }
    });
  }

  const parentId = typeof searchParams.parentId === 'string' ? searchParams.parentId : undefined;

  return (
    <div className="flex justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>添加账户</CardTitle>
        </CardHeader>
      <CardContent>
          <AccountForm 
            action={createAccount} 
            parentAccounts={accounts} 
            users={users}
            defaultValues={parentId ? { parentId } as any : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}