import { AdminVerseSidebarLink } from "@/components/AdminVerseSidebarLink";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <><AdminVerseSidebarLink />{children}</>;
}