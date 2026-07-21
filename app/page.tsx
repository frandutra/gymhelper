import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { error } = await supabase.auth.getUser();

  // "Auth session missing" es la respuesta esperada sin sesión iniciada:
  // confirma que la conexión con Supabase funciona.
  const connected = !error || error.message.includes("session missing");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 p-8">
      <h1 className="text-2xl font-semibold">GymHelper</h1>
      <p className="text-sm text-gray-500">
        Supabase: {connected ? "conectado ✅" : `error ❌ (${error?.message})`}
      </p>
    </main>
  );
}
