import { cache } from "react";
import { prisma } from "@/lib/prisma";

// Profil user untuk request ini — cache() mendedupe query, jadi auth-guard,
// page, dan sidebar yang sama-sama butuh profil cukup sekali round-trip DB.
export const getProfileForUser = cache(async (userId: string) => {
  return prisma.profile.findUnique({
    where: { id: userId },
    select: {
      fullName: true,
      university: true,
      domisili: true,
      posisi: true,
      phone: true,
      avatarPath: true,
      role: true,
    },
  });
});
