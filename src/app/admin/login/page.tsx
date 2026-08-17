import { redirect } from "next/navigation";
import { AdminLoginMock } from "@/components/AdminLoginMock";
import { hasValidAdminSession } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  // A valid persistent session means the administrator is already signed in.
  // Do not show the login form again unless the session is invalid/expired or
  // has been explicitly cleared by the logout endpoint.
  if (await hasValidAdminSession()) redirect("/admin");

  return <AdminLoginMock />;
}