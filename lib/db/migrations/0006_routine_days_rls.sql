-- Custom SQL migration file, put your code below! --

-- Políticas RLS de routine_days: no tiene user_id propio, la propiedad se
-- verifica subiendo a routines.user_id.

CREATE POLICY "select_own_routine_days" ON public.routine_days
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.routines
      WHERE routines.id = routine_days.routine_id
        AND routines.user_id = (SELECT auth.uid())
    )
  );
--> statement-breakpoint
CREATE POLICY "insert_own_routine_days" ON public.routine_days
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.routines
      WHERE routines.id = routine_days.routine_id
        AND routines.user_id = (SELECT auth.uid())
    )
  );
--> statement-breakpoint
CREATE POLICY "update_own_routine_days" ON public.routine_days
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.routines
      WHERE routines.id = routine_days.routine_id
        AND routines.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.routines
      WHERE routines.id = routine_days.routine_id
        AND routines.user_id = (SELECT auth.uid())
    )
  );
--> statement-breakpoint
CREATE POLICY "delete_own_routine_days" ON public.routine_days
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.routines
      WHERE routines.id = routine_days.routine_id
        AND routines.user_id = (SELECT auth.uid())
    )
  );