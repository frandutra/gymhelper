-- Custom SQL migration file, put your code below! --

-- exercises es el catálogo global (compartido por todos los usuarios):
-- solo lectura para cualquier autenticado. Sin políticas de escritura:
-- el seed (scripts/seed-exercises.ts) usa la service role key, que
-- bypassea RLS por completo.

CREATE POLICY "select_exercises" ON public.exercises
  FOR SELECT TO authenticated
  USING (true);