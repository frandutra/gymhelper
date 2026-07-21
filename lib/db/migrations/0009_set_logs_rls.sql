-- Custom SQL migration file, put your code below! --

-- Políticas RLS de set_logs: user_id está denormalizado en la tabla
-- específicamente para que esta política sea una comparación directa
-- (ver nota en CLAUDE.md), sin joins hasta session_id/exercise_id.

CREATE POLICY "select_own_set_logs" ON public.set_logs
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
--> statement-breakpoint
CREATE POLICY "insert_own_set_logs" ON public.set_logs
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
--> statement-breakpoint
CREATE POLICY "update_own_set_logs" ON public.set_logs
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
--> statement-breakpoint
CREATE POLICY "delete_own_set_logs" ON public.set_logs
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);