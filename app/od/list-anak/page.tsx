import OdSidebar from "@/components/od-sidebar";
import ListAnakContent from "@/components/list-anak-content";
import PageTransition from "@/components/page-transition";
import { requireOD } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSidebarUser } from "@/lib/user";
import type { InternRow } from "@/components/od-intern-table";

export default async function OdListAnakPage() {
  const [, user, interns, pendingTokens] = await Promise.all([
    requireOD(),
    getSidebarUser(),
    prisma.profile.findMany({
      where: { role: "mahasiswa" },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        university: true,
        domisili: true,
        posisi: true,
        startDate: true,
        endDate: true,
        phone: true,
      },
    }),
    prisma.passwordSetToken.findMany({
      where: { usedAt: null },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const now = new Date();
  // Undangan yang belum dikonfirmasi via email — ditampilkan paling atas
  // supaya OD tahu ada anak magang yang belum aktiv.
  const pendingRows: InternRow[] = pendingTokens.map((t) => ({
    id: `pending-${t.id}`,
    tokenId: t.id,
    fullName: t.name || "Mahasiswa",
    email: t.email,
    university: t.university,
    domisili: t.domisili,
    posisi: t.posisi,
    startDate: t.startDate,
    endDate: t.endDate,
    phone: t.phone,
    status: new Date(t.expiresAt) < now ? "expired" : "pending",
  }));
  const activeRows: InternRow[] = interns.map((p) => ({ ...p, tokenId: null, status: "aktif" as const }));

  return (
    <div className="flex min-h-screen bg-[#edf7fe] dark:bg-[#262f49]">
      <OdSidebar />

      <main className="min-w-0 flex-1 px-6 py-6 pt-20 sm:px-8 lg:pt-6">
        <PageTransition>
          <ListAnakContent initialInterns={[...pendingRows, ...activeRows]} />
        </PageTransition>
      </main>
    </div>
  );
}
