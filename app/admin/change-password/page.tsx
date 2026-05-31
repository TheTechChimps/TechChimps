import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminPasswordChangeForm } from "@/components/admin/admin-password-change-form";
import { ADMIN_SESSION_COOKIE, getAdminSessionFromToken } from "@/lib/admin-session";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Change Admin Password",
  description: "Set the private TechChimps admin password.",
  path: "/admin/change-password"
});

export default async function AdminChangePasswordPage() {
  const cookieStore = await cookies();
  const user = getAdminSessionFromToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);

  if (!user) {
    redirect("/admin/login");
  }

  if (!user.passwordChangeRequired) {
    redirect("/admin");
  }

  return (
    <main>
      <section className="section portal-hero">
        <div className="container split portal-auth-layout">
          <div>
            <span className="eyebrow">First login setup</span>
            <h1 className="title">Change the temporary admin password.</h1>
            <p className="subtitle">
              The temporary password only gets you this far. Set a real password before opening live chats, orders, CRM,
              and the prompt inbox.
            </p>
          </div>
          <AdminPasswordChangeForm email={user.email} />
        </div>
      </section>
    </main>
  );
}
