import { updateAccount } from "@/app/actions/account";
import { AccountForm } from "@/components/account-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/user";

export default async function EditAccountPage({ params }: { params: { id: string } }) {
  const account = await prisma.account.findUnique({
    where: { id: params.id },
    include: { children: true }
  });

  if (!account) {
    redirect('/wealth?tab=accounts');
  }

  const parentAccounts = await prisma.account.findMany({
    where: { parentId: null }
  });

  const currentUser = await getCurrentUser();
  const isAdmin = currentUser?.role === 'ADMIN';
  
  let users: { id: string; name: string | null; email: string }[] = [];
  if (isAdmin && currentUser) {
    const familyId = (currentUser as any).familyId || currentUser.id;
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

  const updateAccountWithId = updateAccount.bind(null, account.id);

  return (
    <div className="flex justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>编辑账户</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountForm 
            action={updateAccountWithId} 
            parentAccounts={parentAccounts}
            defaultValues={account}
            users={users}
          />
        </CardContent>
      </Card>
    </div>
  );
}
