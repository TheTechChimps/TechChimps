import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import {
  ADMIN_SESSION_COOKIE,
  getAdminSessionFromToken,
  getConfiguredAdminSummary,
  isAdminConfigured,
  isAdminCookieAuthenticated
} from "@/lib/admin-session";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Admin Login",
  description: "Private TechChimps admin login.",
  path: "/admin/login"
});

export default async function AdminLoginPage() {
  const cookieStore = await cookies();
  const user = getAdminSessionFromToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);

  if (user?.passwordChangeRequired) {
    redirect("/admin/change-password");
  }

  if (isAdminCookieAuthenticated(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    redirect("/admin");
  }
  const adminEmail = getConfiguredAdminSummary()[0]?.email ?? "techchimps@proton.me";

  return (
    <main>
      <section className="section portal-hero">
        <div className="container split portal-auth-layout">
          <div>
            <span className="eyebrow">Private studio area</span>
            <h1 className="title">Admin is hidden until you log in.</h1>
            <p className="subtitle">Customer-facing visitors only see the public site, prices, request flow, and portal.</p>
          </div>
          <AdminLoginForm adminEmail={adminEmail} configured={isAdminConfigured()} />
        </div>
      </section>
    </main>
  );
}
