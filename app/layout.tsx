import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import ThemeToggle from "@/components/theme-toggle";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Logbook Magang",
  description: "Aplikasi report logbook magang",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem("theme");var t=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(t)document.documentElement.classList.add("dark")}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <div className="fixed right-6 top-6 z-50">
          <ThemeToggle />
        </div>
        {children}
      </body>
    </html>
  );
}
