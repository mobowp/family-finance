'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from './user';

export async function createAccount(formData: FormData) {
  const name = formData.get('name') as string;
  const type = formData.get('type') as string;
  const balance = parseFloat(formData.get('balance') as string) || 0;
  const currency = formData.get('currency') as string || 'CNY';
  const parentId = formData.get('parentId') as string;
  const icon = formData.get('icon') as string;

  const user = await getCurrentUser();

  if (!user) {
    throw new Error('请先登录');
  }

  try {
    await prisma.account.create({
      data: {
        name,
        type,
        balance,
        currency,
        userId: user.id,
        parentId: parentId === 'none' ? null : parentId,
        icon,
      },
    });
  } catch (error) {
    console.error('Failed to create account:', error);
    throw new Error('创建账户失败');
  }

  revalidatePath('/accounts');
  revalidatePath('/wealth');
  revalidatePath('/transactions');
  revalidateTag('accounts');
  redirect('/wealth?tab=accounts');
}

export async function updateAccount(id: string, formData: FormData) {
  const name = formData.get('name') as string;
  const type = formData.get('type') as string;
  const balance = parseFloat(formData.get('balance') as string) || 0;
  const currency = formData.get('currency') as string || 'CNY';
  const parentId = formData.get('parentId') as string;
  const icon = formData.get('icon') as string;
  const userId = formData.get('userId') as string;

  // 处理子账户更新
  const rawFormData = Object.fromEntries(formData.entries());
  const childUpdates: Record<string, any> = {};

  for (const [key, value] of Object.entries(rawFormData)) {
    if (key.startsWith('child_')) {
      const parts = key.split('_');
      if (parts.length >= 3) {
        const childId = parts[1];
        const field = parts.slice(2).join('_');
        
        if (!childUpdates[childId]) {
          childUpdates[childId] = {};
        }
        
        if (field === 'balance') {
             childUpdates[childId][field] = parseFloat(value as string) || 0;
        } else {
             childUpdates[childId][field] = value;
        }
      }
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const updateData: any = {
        name,
        type,
        balance,
        currency,
        parentId: parentId === 'none' ? null : parentId,
        icon,
      };

      const currentUser = await getCurrentUser();
      const userIdChanged = currentUser?.role === 'ADMIN' && userId && userId !== '';
      
      if (userIdChanged) {
        updateData.userId = userId;
      }

      await tx.account.update({
        where: { id },
        data: updateData,
      });

      if (userIdChanged) {
        await tx.account.updateMany({
          where: { parentId: id },
          data: { userId: userId }
        });
      }

      for (const [childId, data] of Object.entries(childUpdates)) {
        await tx.account.update({
          where: { id: childId },
          data: data,
        });
      }
    });
  } catch (error) {
    console.error('Failed to update account:', error);
    throw new Error('更新账户失败');
  }

  revalidatePath('/accounts');
  revalidatePath('/wealth');
  revalidatePath('/transactions');
  revalidateTag('accounts');
  redirect('/wealth?tab=accounts');
}

export async function deleteAccount(id: string, isChild: boolean = false) {
  try {
    // Check if account has transactions
    const transactionCount = await prisma.transaction.count({
      where: { accountId: id }
    });

    if (transactionCount > 0) {
      throw new Error('该账户下有交易记录，无法删除');
    }

    // Check if account has children
    const childrenCount = await prisma.account.count({
      where: { parentId: id }
    });

    if (childrenCount > 0) {
        throw new Error('该账户下有子账户，无法删除');
    }

    await prisma.account.delete({
      where: { id }
    });
  } catch (error) {
    console.error('Failed to delete account:', error);
    throw error;
  }

  revalidatePath('/accounts');
  revalidatePath('/wealth');
  revalidatePath('/transactions');
  revalidateTag('accounts');
  
  if (!isChild) {
    redirect('/wealth?tab=accounts');
  }
}

export async function createChildAccount(formData: FormData) {
  const name = formData.get('name') as string;
  const type = formData.get('type') as string;
  const balance = parseFloat(formData.get('balance') as string) || 0;
  const currency = formData.get('currency') as string || 'CNY';
  const parentId = formData.get('parentId') as string;
  const icon = formData.get('icon') as string;

  const user = await getCurrentUser();

  if (!user) {
    throw new Error('请先登录');
  }

  try {
    await prisma.account.create({
      data: {
        name,
        type,
        balance,
        currency,
        userId: user.id,
        parentId: parentId,
        icon,
      },
    });
  } catch (error) {
    console.error('Failed to create child account:', error);
    throw new Error('创建子账户失败');
  }

  revalidatePath('/accounts');
  revalidatePath('/wealth');
  revalidatePath('/transactions');
  revalidateTag('accounts');
}
