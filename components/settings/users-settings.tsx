import { prisma } from "@/lib/prisma";
import { CreateUserDialog } from "@/components/create-user-dialog";
import { UsersTable } from "@/components/settings/users-table";
import { getCurrentUser } from "@/app/actions/user";

export async function UsersSettings() {
  const currentUser = await getCurrentUser();
  
  const users = await prisma.user.findMany({
    where: {
      // @ts-ignore
      familyId: currentUser?.familyId || currentUser?.id
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h3 className="text-lg font-medium">家庭成员</h3>
           <p className="text-sm text-muted-foreground">管理您的家庭成员。</p>
        </div>
        <CreateUserDialog />
      </div>

      <div className="space-y-4">
        {users.length === 0 ? (
            <p className="text-muted-foreground text-sm">暂无其他家庭成员</p>
        ) : (
            <UsersTable users={users} currentUserEmail={currentUser?.email || undefined} />
        )}
      </div>
    </div>
  );
}
