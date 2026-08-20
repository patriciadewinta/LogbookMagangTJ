import SidebarShell from "@/components/sidebar-shell";
import { getSidebarUser } from "@/lib/user";

const navItems = [
  { href: "/", label: "Home", icon: "/assets/sidebar-home.png" },
  { href: "/history", label: "History", icon: "/assets/sidebar-history.png" },
  { href: "/settings", label: "Settings", icon: "/assets/sidebar-settings.png" },
];

export default async function Sidebar() {
  const user = await getSidebarUser();
  return (
    <SidebarShell navItems={navItems} activeClass="bg-[#97a3ff]/60" user={user} />
  );
}
