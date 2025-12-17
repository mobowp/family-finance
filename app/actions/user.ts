'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { auth, signOut } from '@/auth';
import bcrypt from 'bcryptjs';

export async function createUser(formData: FormData) {
  const currentUser = await getCurrentUser();
  const isAdmin = currentUser?.email === 'mobowp027@gmail.com' || (currentUser as any)?.role === 'ADMIN';

  if (!isAdmin) {
    throw new Error('只有管理员可以创建新用户');
  }

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string || "password"; 
  const role = formData.get('role') as string || "USER";
  
  try {
    // const hashedPassword = await bcrypt.hash(password, 10);
    
    await prisma.user.create({
      data: {
        name,
        email,
        password: password, // Store plain text password
        role,
        // @ts-ignore
        familyId: (currentUser as any)?.familyId, // Assign to same family
      },
    });
  } catch (error) {
    console.error('Failed to create user:', error);
    throw new Error('创建用户失败');
  }

  revalidatePath('/settings');
}

export async function deleteUser(userId: string) {
  try {
    // Use a transaction to delete all related data first
    await prisma.$transaction(async (tx) => {
      // 1. Delete transactions
      await tx.transaction.deleteMany({ where: { userId } });
      
      // 2. Delete budgets
      await tx.budget.deleteMany({ where: { userId } });
      
      // 3. Delete assets
      await tx.asset.deleteMany({ where: { userId } });
      
      // 4. Break account parent-child relationships to avoid foreign key constraints
      await tx.account.updateMany({ 
        where: { userId }, 
        data: { parentId: null } 
      });
      
      // 5. Delete accounts
      await tx.account.deleteMany({ where: { userId } });
      
      // 6. Finally delete the user
      await tx.user.delete({
        where: { id: userId }
      });
    });
  } catch (error) {
    console.error('Failed to delete user:', error);
    throw new Error('删除用户失败');
  }
  revalidatePath('/settings');
}

export async function updateUser(userId: string, formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
      },
    });
  } catch (error) {
    console.error('Failed to update user:', error);
  }

  revalidatePath('/users');
}

export async function updateUserEmail(userId: string, newEmail: string) {
  const currentUser = await getCurrentUser();
  const isAdmin = currentUser?.email === 'mobowp027@gmail.com' || (currentUser as any)?.role === 'ADMIN';

  if (!isAdmin) {
    throw new Error('只有管理员可以修改用户邮箱');
  }

  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail }
    });

    if (existingUser && existingUser.id !== userId) {
      throw new Error('该邮箱已被其他用户使用');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { email: newEmail },
    });
    
    revalidatePath('/settings');
  } catch (error) {
    console.error('Failed to update user email:', error);
    throw error instanceof Error ? error : new Error('更新邮箱失败');
  }
}

export async function switchUser(userId: string) {
  // Deprecated in favor of real auth
  // But we could implement a "sudo" mode or just ignore it
  console.warn("Switch user is deprecated. Use logout/login.");
}

export async function getCurrentUser() {
  const session = await auth();
  
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (user) return user;
  }

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (user) return user;
  }

  return null;
}

export async function logoutUser() {
  await signOut({ redirectTo: '/login' });
}

export async function resetUserPassword(userId: string, newPassword: string) {
  try {
    // const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { id: userId },
      data: { password: newPassword }, // Store plain text password
    });
    
    revalidatePath('/settings');
  } catch (error) {
    console.error('Failed to reset password:', error);
    throw new Error('重置密码失败');
  }
}
