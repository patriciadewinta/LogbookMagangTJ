import SidebarShell from "@/components/sidebar-shell";
import { getSidebarUser } from "@/lib/user";

const navItems = [
  { href: "/od", label: "Home", icon: "/assets/sidebar-home.png" },
  { href: "/od/history", label: "History Logbook", icon: "/assets/sidebar-history.png" },
  { href: "/od/list-anak", label: "List Anak Magang", icon: "/assets/sidebar-home.png" },
  { href: "/od/settings", label: "Settings", icon: "/assets/sidebar-settings.png" },
];

export default async function OdSidebar() {
  const user = await getSidebarUser();
  return (
    <SidebarShell navItems={navItems} activeClass="bg-[#5A69D3]" user={user} />
  );
}
