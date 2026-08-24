import OdSidebar from "@/components/od-sidebar";
import ApproverTabs from "@/components/approver-tabs";
import PageTransition from "@/components/page-transition";
import { requireOD } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSidebarUser } from "@/lib/user";

export default async function OdApproversPage() {
  const [, user, approvers] = await Promise.all([
    requireOD(),
    getSidebarUser(),
    prisma.approver.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: { id: true, name: true, email: true, divisi: true, role: true },
    }),
  ]);

  return (
    <div className="flex min-h-screen bg-[#edf7fe] dark:bg-[#262f49]">
      <OdSidebar />

      <main className="min-w-0 flex-1 px-4 py-7 pt-20 sm:px-8 lg:pt-7">
        <PageTransition>
          <h1 className="mt-4 text-[28px] leading-[1.15] text-black dark:text-white sm:text-[40px]">
            Data Approver
          </h1>
          <p className="mt-2 text-[18px] font-light leading-snug text-black dark:text-white sm:text-[20px]">
            Kelola data master pembimbing, kepala departemen, dan kepala divisi
          </p>

          <ApproverTabs approvers={approvers} />
        </PageTransition>
      </main>
    </div>
  );
}
