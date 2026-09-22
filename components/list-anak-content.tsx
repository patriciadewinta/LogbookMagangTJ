"use client";

import { useState, useMemo, useEffect } from "react";
import OdInternTable, { InternRow } from "@/components/od-intern-table";
import AddInternModal from "@/components/add-intern-modal";
import { useToast } from "@/components/toast-provider";

export default function ListAnakContent({
  initialInterns,
}: {
  initialInterns: InternRow[];
}) {
  const [interns, setInterns] = useState<InternRow[]>(initialInterns);
  const toast = useToast();

  // Data asli datang dari server component; setelah router.refresh() (edit/
  // hapus/tambah), prop initialInterns berubah tapi useState tidak ikut
  // update. Sync manual biar list selalu mencerminkan data terbaru.
  useEffect(() => {
    setInterns(initialInterns);
  }, [initialInterns]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [fileUploadNote, setFileUploadNote] = useState("");

  // Filter interns based on search query
  const filteredInterns = useMemo(() => {
    if (!searchQuery.trim()) return interns;
    const query = searchQuery.toLowerCase();
    return interns.filter(
      (intern) =>
        intern.fullName?.toLowerCase().includes(query) ||
        intern.university?.toLowerCase().includes(query) ||
        intern.domisili?.toLowerCase().includes(query) ||
        intern.posisi?.toLowerCase().includes(query)
    );
  }, [interns, searchQuery]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 1MB)
    const maxSize = 1 * 1024 * 1024; // 1MB in bytes
    if (file.size > maxSize) {
      toast.warning("Ukuran file terlalu besar! Maksimal 1MB.", "File Terlalu Besar");
      e.target.value = "";
      return;
    }

    // Check file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    if (!validTypes.includes(file.type)) {
      toast.warning("Format file tidak didukung. Gunakan .xlsx atau .csv", "Format Tidak Didukung");
      e.target.value = "";
      return;
    }

    setFileUploadNote(`File "${file.name}" siap diupload (${(file.size / 1024).toFixed(2)} KB)`);
  };

  return (
    <>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#333333] dark:text-white sm:text-3xl">
            List Anak Magang
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-[10px] border border-[#d9d9d9] bg-white pl-10 pr-4 text-sm text-[#333333] outline-none focus:border-[#4258FF] dark:border-[#d9d9d9] dark:bg-black dark:text-white dark:focus:border-[#4258ff]"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 rounded-full bg-[#4258FF] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#374adf]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform ${showDropdown ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-[10px] border border-[#d9d9d9] bg-white shadow-lg dark:border-white/10 dark:bg-black">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDropdown(false);
                      setShowAddModal(true);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[#374151] transition-colors hover:bg-[#f3f4f6] dark:text-white dark:hover:bg-white/10"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Input Manual
                  </button>
                  <div className="relative">
                    <label
                      className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm text-[#374151] transition-colors hover:bg-[#f3f4f6] dark:text-white dark:hover:bg-white/10"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      File Upload
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="border-t border-[#d9d9d9] px-4 py-2 text-xs text-[#727272] dark:border-white/10 dark:text-white/75">
                    Upload file dengan format .xlsx atau .csv maks. 1MB
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {fileUploadNote && (
        <div className="mt-4 rounded-[10px] border border-green-300 bg-green-50 px-4 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          {fileUploadNote}
        </div>
      )}

      <OdInternTable interns={filteredInterns} />

      {showAddModal && <AddInternModal onClose={() => setShowAddModal(false)} />}
    </>
  );
}
