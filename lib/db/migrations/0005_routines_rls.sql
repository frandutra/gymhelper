-- Custom SQL migration file, put your code below! --

-- Políticas RLS de routines: cada usuario solo accede a sus propias rutinas.

CREATE POLICY "select_own_routines" ON public.routines
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
--> statement-breakpoint
CREATE POLICY "insert_own_routines" ON public.routines
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
--> statement-breakpoint
CREATE POLICY "update_own_routines" ON public.routines
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
--> statement-breakpoint
CREATE POLICY "delete_own_routines" ON public.routines
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);