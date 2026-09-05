import { AdminManualBooking } from "@/components/AdminManualBooking";
import { AdminStandaloneSidebar } from "@/components/AdminStandaloneSidebar";
import { requireAdmin } from "@/lib/adminAuth";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminManualBookingPage() {
  try {
    await requireAdmin();
  } catch {
    notFound();
  }

  return (
    <AdminStandaloneSidebar>
      <AdminManualBooking />
    </AdminStandaloneSidebar>
  );
}
