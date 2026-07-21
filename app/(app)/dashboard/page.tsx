import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

// Placeholder: el dashboard real ("qué me toca hoy") se construye en Fase 3.6.
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <p className="text-sm text-gray-500">Sesión iniciada como {user?.email}</p>
      <form action={logout}>
        <Button type="submit">Cerrar sesión</Button>
      </form>
    </main>
  );
}
