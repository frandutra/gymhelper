import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Guard de sesión para todas las rutas autenticadas.
 * Sin usuario válido → redirige a /login.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}
