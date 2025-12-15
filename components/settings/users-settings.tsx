import { prisma } from "@/lib/prisma";
import { CreateUserDialog } from "@/components/create-user-dialog";
import { DeleteUserDialog } from "@/components/settings/delete-user-dialog";
import { ResetPasswordDialog } from "@/components/settings/reset-password-dialog";
import { EditUserEmailDialog } from "@/components/settings/edit-user-email-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export async function UsersSettings() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h3 className="text-lg font-medium">用户列表</h3>
           <p className="text-sm text-muted-foreground">管理系统内的所有用户。</p>
        </div>
        <CreateUserDialog />
      </div>

      <div className="space-y-4">
        {users.length === 0 ? (
            <p className="text-muted-foreground text-sm">暂无其他用户</p>
        ) : (
            <div className="grid gap-4">
            {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="flex items-center gap-4">
                        <Avatar>
                            {/* @ts-ignore */}
                            <AvatarImage src={user.image || ""} />
                            <AvatarFallback>
                                {user.name?.[0]?.toUpperCase() || <UserIcon className="h-4 w-4" />}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                            {(user as any).role || 'USER'}
                        </div>
                        <EditUserEmailDialog userId={user.id} currentEmail={user.email || ''} userName={user.name || 'User'} />
                        <ResetPasswordDialog userId={user.id} userName={user.name || 'User'} />
                        {user.email !== 'mobowp027@gmail.com' && (
                            <DeleteUserDialog userId={user.id} userName={user.name || 'User'} />
                        )}
                    </div>
                </div>
            ))}
            </div>
        )}
      </div>
    </div>
  );
}
