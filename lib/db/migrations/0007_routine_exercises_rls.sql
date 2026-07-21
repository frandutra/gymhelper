-- Custom SQL migration file, put your code below! --

-- Políticas RLS de routine_exercises: tampoco tiene user_id propio, la
-- propiedad se verifica subiendo routine_day_id -> routine_id -> user_id.

CREATE POLICY "select_own_routine_exercises" ON public.routine_exercises
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.routine_days
      JOIN public.routines ON routines.id = routine_days.routine_id
      WHERE routine_days.id = routine_exercises.routine_day_id
        AND routines.user_id = (SELECT auth.uid())
    )
  );
--> statement-breakpoint
CREATE POLICY "insert_own_routine_exercises" ON public.routine_exercises
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.routine_days
      JOIN public.routines ON routines.id = routine_days.routine_id
      WHERE routine_days.id = routine_exercises.routine_day_id
        AND routines.user_id = (SELECT auth.uid())
    )
  );
--> statement-breakpoint
CREATE POLICY "update_own_routine_exercises" ON public.routine_exercises
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.routine_days
      JOIN public.routines ON routines.id = routine_days.routine_id
      WHERE routine_days.id = routine_exercises.routine_day_id
        AND routines.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.routine_days
      JOIN public.routines ON routines.id = routine_days.routine_id
      WHERE routine_days.id = routine_exercises.routine_day_id
        AND routines.user_id = (SELECT auth.uid())
    )
  );
--> statement-breakpoint
CREATE POLICY "delete_own_routine_exercises" ON public.routine_exercises
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.routine_days
      JOIN public.routines ON routines.id = routine_days.routine_id
      WHERE routine_days.id = routine_exercises.routine_day_id
        AND routines.user_id = (SELECT auth.uid())
    )
  );