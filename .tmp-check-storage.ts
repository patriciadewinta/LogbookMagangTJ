import zlib from "node:zlib";
import { createClient } from "@supabase/supabase-js";

function countImageDraws(b: Buffer): number {
  const raw = b.toString("latin1");
  const re = /stream\r?\n([\s\S]*?)endstream/g;
  let draws = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    const chunk = Buffer.from(m[1], "latin1");
    let out = chunk;
    try {
      out = zlib.inflateSync(chunk);
    } catch {}
    draws += (out.toString("latin1").match(/\/[A-Za-z0-9]+\s+Do\b/g) ?? []).length;
  }
  return draws;
}

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  const s = await prisma.logbookSubmission.findFirst({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      logbookFilePath: true,
      pembimbingName: true,
    },
  });
  console.log("SUBMISSION:", JSON.stringify(s, null, 2));
  if (!s) process.exit(0);

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data, error } = await admin.storage.from("logbooks").download(s.logbookFilePath);
  if (error || !data) {
    console.log("DOWNLOAD_ERR:", error?.message);
    process.exit(0);
  }
  const buf = Buffer.from(await data.arrayBuffer());
  console.log("FILE:", s.logbookFilePath, buf.length, "bytes");
  console.log("DRAWS:", countImageDraws(buf), "(2 = cuma QR anak magang, 5 = semua QR)");
  await prisma.$disconnect();
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
