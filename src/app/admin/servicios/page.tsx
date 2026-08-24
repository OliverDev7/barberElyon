import { AdminServicesPage } from "@/components/AdminServicesPage";
import { requireAdmin } from "@/lib/adminAuth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login");
  }
  return <AdminServicesPage />;
}