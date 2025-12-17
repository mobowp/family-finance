'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./user";

export async function getSystemSettings() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    throw new Error("Unauthorized");
  }

  const familyId = (user as any).familyId || user.id;

  const settings = await prisma.systemSetting.findMany({
    where: {
      familyId: familyId
    }
  });
  return settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string>);
}

export async function updateSystemSetting(key: string, value: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    throw new Error("Unauthorized");
  }

  const familyId = (user as any).familyId || user.id;

  await prisma.systemSetting.upsert({
    where: { 
      key_familyId: {
        key,
        familyId
      }
    },
    update: { value },
    create: { 
      key, 
      value,
      familyId
    },
  });

  revalidatePath('/settings');
}

