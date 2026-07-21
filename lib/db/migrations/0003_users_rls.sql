-- Custom SQL migration file, put your code below! --

-- Políticas RLS de users: cada usuario ve y edita solo su propia fila.
-- Sin política de INSERT (la crea el trigger handle_new_user, SECURITY
-- DEFINER, que bypassea RLS) ni de DELETE (se borra en cascada desde
-- auth.users al eliminar la cuenta).

CREATE POLICY "select_own_user" ON public.users
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id);
--> statement-breakpoint
CREATE POLICY "update_own_user" ON public.users
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);