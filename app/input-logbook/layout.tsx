// Segment config untuk server action submitLogbook (generate PDF + kirim
// email bisa makan waktu di cold start) — tidak boleh di page "use client",
// jadi lewat layout server.
export const maxDuration = 60;

export default function InputLogbookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
