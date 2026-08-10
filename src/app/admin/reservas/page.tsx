import { AdminShell } from "@/components/AdminShell";
import { requireAdmin } from "@/lib/adminAuth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReservationsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login");
  }
  return <AdminShell section="reservas" />;
}
