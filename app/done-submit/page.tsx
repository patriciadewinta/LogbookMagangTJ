import Link from "next/link";
import { ViewTransition } from "react";
import Toast from "@/components/toast";
import PageTransition from "@/components/page-transition";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function DoneUploadRow({ fileName, hint }: { fileName: string; hint: string }) {
  return (
    <div className="flex w-full items-center gap-5 rounded-[10px] border border-dashed border-black/60 px-5 py-4 dark:border-white/60">
      <div className="grid size-12 shrink-0 place-items-center rounded-[10px] bg-[#deedf8]">
        <img
          src="/assets/pdf-icon.png"
          alt=""
          className="size-10 object-contain"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[20px] text-black dark:text-white">{fileName}</p>
        <p className="truncate text-[16px] text-black/30 dark:text-white/30">{hint}</p>
      </div>
      <span className="shrink-0 rounded-[10px] bg-[#deedf8] px-4 py-1.5 text-[16px] font-light text-[#001192] dark:bg-white/10 dark:text-[#4258ff]">
        Terkirim
      </span>
    </div>
  );
}

export default async function DoneSubmitPage() {
  const user = await requireUser();

  const submission = await prisma.logbookSubmission.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { logbookFilePath: true },
  });

  const fileName = submission?.logbookFilePath.split("/").pop() ?? "logbook_magang.pdf";

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#edf7fe] px-4 py-16 dark:bg-[#262f49]">
      <Toast />

      <PageTransition>
      <div className="absolute left-[clamp(16px,4vw,102px)] top-5 flex items-center gap-3">
        <Link
          href="/"
          transitionTypes={["nav-back"]}
          aria-label="Kembali"
          title="Kembali"
          className="grid size-12 place-items-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        >
          <img src="/assets/back-arrow.png" alt="" className="size-10 object-contain" />
        </Link>
        <ViewTransition name="logo-tj" default="block">
          <img
            src="/assets/logo-tj.png"
            alt="Logo Tj"
            className="size-14 rounded-[10px] object-cover dark:hidden"
          />
          <img
            src="/assets/logo-tj-dark.png"
            alt="Logo Tj"
            className="hidden size-14 rounded-[10px] object-cover dark:block"
          />
        </ViewTransition>
      </div>

      <ViewTransition
        name="main-card"
        default="block w-full max-w-[1026px]"
      >
      <div className="w-full max-w-[1026px] rounded-[10px] border border-[#d9d9d9] bg-white p-6 shadow-[0px_0px_48px_0px_rgba(0,0,0,0.35)] sm:p-10 dark:border-white/10 dark:bg-black">
        <h1 className="text-[28px] font-bold leading-tight text-black dark:text-white sm:text-[40px]">
          Logbook terkirim!
        </h1>
        <p className="mt-2 max-w-[720px] text-[18px] font-light leading-snug text-black dark:text-white sm:text-[20px]">
          Laporan magangmu sudah masuk. Pantau status persetujuan pada beranda atau history.
        </p>

        <div className="mt-8 flex flex-col gap-6">
          <div>
            <p className="text-[24px] font-semibold text-black dark:text-white">
              Logbook Magang
            </p>
            <div className="mt-2">
              <DoneUploadRow
                fileName={fileName}
                hint="Format PDF, XLSX, atau CSV, maks. 1MB"
              />
            </div>
          </div>
        </div>

        <Link
          href="/"
          transitionTypes={["nav-back"]}
          className="mt-8 block w-full rounded-[10px] bg-[#001192] py-3 text-center text-[20px] font-bold text-white transition-opacity hover:opacity-90 dark:bg-[#4258ff]"
        >
          Kembali ke Beranda
        </Link>
      </div>
      </ViewTransition>
      </PageTransition>
    </div>
  );
}
