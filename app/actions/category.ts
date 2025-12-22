'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function createCategory(formData: FormData) {
  const name = formData.get('name') as string;
  const type = formData.get('type') as string;
  
  // Basic validation
  if (!name || !type) {
    throw new Error('名称和类型不能为空');
  }

  try {
    await prisma.category.create({
      data: {
        name,
        type,
      },
    });
  } catch (error) {
    console.error('Failed to create category:', error);
    throw new Error('创建分类失败');
  }

  revalidatePath('/categories');
  revalidatePath('/transactions/create');
  revalidatePath('/transactions');
  revalidateTag('categories');
}

export async function deleteCategory(id: string) {
  try {
    await prisma.category.delete({
      where: { id },
    });
  } catch (error) {
    console.error('Failed to delete category:', error);
    // Likely constraint violation (transactions exist)
    throw new Error('删除分类失败，可能该分类下有交易记录');
  }

  revalidatePath('/categories');
  revalidatePath('/transactions/create');
  revalidatePath('/transactions');
  revalidateTag('categories');
}
