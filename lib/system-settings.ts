import { prisma } from "@/lib/prisma";

// Internal use only, no auth check (for server-side calls)
// This function is NOT a Server Action and cannot be called from the client.
export async function getSystemSettingInternal(key: string, familyId: string) {
  const setting = await prisma.systemSetting.findUnique({
    where: { 
      key_familyId: {
        key,
        familyId
      }
    },
  });
  return setting?.value;
}
