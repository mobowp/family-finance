import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

export const getCachedCategories = unstable_cache(
  async () => {
    return await prisma.category.findMany({
      select: { id: true, name: true, type: true },
      orderBy: { name: 'asc' }
    });
  },
  ['categories'],
  {
    revalidate: 300,
    tags: ['categories']
  }
);

export const getCachedAccounts = unstable_cache(
  async () => {
    return await prisma.account.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
  },
  ['accounts'],
  {
    revalidate: 300,
    tags: ['accounts']
  }
);