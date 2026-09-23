// Pengukuran durasi sementara untuk melacak sumber lemot.
//
// Cara pakai:
//   const t = timer("home");
//   t.mark("auth");        // catat titik waktu
//   ...
//   t.done();              // cetak ringkasan ke console server
//
// PENTING: pemisah ringkasan HARUS ASCII. HTTP header cuma menerima
// karakter 0-255, jadi panah "→" (U+2192) bikin response 500 dengan pesan
// "Cannot convert argument to a ByteString" — bug yang sama kelasnya dengan
// BOM di env var. Pakai "->" saja.
//
// Hasilnya juga dikirim sebagai header `X-Timing` pada response, jadi bisa
// dibaca langsung dari DevTools → Network → Headers tanpa buka log Vercel.
//
// HAPUS BERKAS INI (dan pemakaiannya) setelah sumber lemot ketemu.

export function timer(label: string) {
  const start = performance.now();
  const marks: { name: string; ms: number }[] = [];

  return {
    /** Catat waktu sejak awal (bukan sejak mark sebelumnya). */
    mark(name: string) {
      marks.push({ name, ms: performance.now() - start });
      return this;
    },
    /** Total sejak dibuat. */
    elapsed() {
      return performance.now() - start;
    },
    /** Ringkasan kompak: "auth 320ms -> query 75ms -> TOTAL 400ms" */
    summary() {
      const total = performance.now() - start;
      const parts: string[] = [];
      let prev = 0;
      for (const m of marks) {
        parts.push(`${m.name} ${Math.round(m.ms - prev)}ms`);
        prev = m.ms;
      }
      parts.push(`TOTAL ${Math.round(total)}ms`);
      return parts.join(" -> ");
    },
    /** Cetak ke console server dan kembalikan string untuk header. */
    done() {
      const s = this.summary();
      console.log(`[timing:${label}] ${s}`);
      return s;
    },
  };
}

export type Timer = ReturnType<typeof timer>;

/** Satukan beberapa ringkasan jadi satu header, mis. dari proxy + halaman. */
export function mergeTimings(...summaries: (string | null | undefined)[]) {
  return summaries.filter(Boolean).join(" | ");
}

/**
 * Buang semua karakter non-ASCII supaya nilainya aman dipakai sebagai nilai
 * HTTP header (header hanya menerima byte 0-255).
 */
export function asciiSafe(s: string) {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[^\x20-\x7E]/g, "?");
}
