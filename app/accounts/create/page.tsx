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
  const accounts = await prisma.account.findMany({
    where: { 
      parentId: null,
      user: {
        // @ts-ignore
        familyId: user?.familyId || user?.id
      }
    } 
  });

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
            defaultValues={parentId ? { parentId } as any : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
