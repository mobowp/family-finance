'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, User as UserIcon, Mail, KeyRound, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserPasswordDisplay } from "@/components/settings/user-password-display";
import { EditUserEmailDialog } from "@/components/settings/edit-user-email-dialog";
import { ResetPasswordDialog } from "@/components/settings/reset-password-dialog";
import { DeleteUserDialog } from "@/components/settings/delete-user-dialog";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  password: string;
  createdAt: Date;
}

interface UsersTableProps {
  users: User[];
  currentUserEmail?: string;
}

export function UsersTable({ users, currentUserEmail }: UsersTableProps) {
  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>密码</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.image || undefined} alt={user.name || '用户头像'} />
                    <AvatarFallback>
                      {user.name?.[0]?.toUpperCase() || <UserIcon className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                    {user.role === 'ADMIN' ? '管理员' : '普通用户'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <UserPasswordDisplay password={user.password} />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">打开菜单</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>操作</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      <EditUserEmailDialog userId={user.id} currentEmail={user.email || ''} userName={user.name || 'User'}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Mail className="mr-2 h-4 w-4" />
                          修改邮箱
                        </DropdownMenuItem>
                      </EditUserEmailDialog>

                      <ResetPasswordDialog userId={user.id} userName={user.name || 'User'}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <KeyRound className="mr-2 h-4 w-4" />
                          重置密码
                        </DropdownMenuItem>
                      </ResetPasswordDialog>

                      {user.email !== 'mobowp027@gmail.com' && user.email !== currentUserEmail && (
                        <>
                          <DropdownMenuSeparator />
                          <DeleteUserDialog userId={user.id} userName={user.name || 'User'}>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              删除用户
                            </DropdownMenuItem>
                          </DeleteUserDialog>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      <div className="grid gap-4 md:hidden">
        {users.map((user) => (
          <div key={user.id} className="flex flex-col gap-4 p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={user.image || undefined} alt={user.name || '用户头像'} />
                  <AvatarFallback>
                    {user.name?.[0]?.toUpperCase() || <UserIcon className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                {user.role === 'ADMIN' ? '管理员' : '用户'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">密码:</span>
                <UserPasswordDisplay password={user.password} />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <EditUserEmailDialog userId={user.id} currentEmail={user.email || ''} userName={user.name || 'User'}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Mail className="mr-2 h-4 w-4" />
                      修改邮箱
                    </DropdownMenuItem>
                  </EditUserEmailDialog>

                  <ResetPasswordDialog userId={user.id} userName={user.name || 'User'}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <KeyRound className="mr-2 h-4 w-4" />
                      重置密码
                    </DropdownMenuItem>
                  </ResetPasswordDialog>

                  {user.email !== 'mobowp027@gmail.com' && user.email !== currentUserEmail && (
                    <>
                      <DropdownMenuSeparator />
                      <DeleteUserDialog userId={user.id} userName={user.name || 'User'}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          删除用户
                        </DropdownMenuItem>
                      </DeleteUserDialog>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
