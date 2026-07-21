-- Custom SQL migration file, put your code below! --

-- Políticas RLS de workout_sessions: cada usuario solo accede a sus propias
-- sesiones (user_id directo).

CREATE POLICY "select_own_workout_sessions" ON public.workout_sessions
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
--> statement-breakpoint
CREATE POLICY "insert_own_workout_sessions" ON public.workout_sessions
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
--> statement-breakpoint
CREATE POLICY "update_own_workout_sessions" ON public.workout_sessions
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
--> statement-breakpoint
CREATE POLICY "delete_own_workout_sessions" ON public.workout_sessions
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);