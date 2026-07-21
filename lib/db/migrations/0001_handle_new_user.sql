-- Custom SQL migration file, put your code below! --

-- Sincroniza auth.users -> public.users.
-- Al registrarse un usuario en Supabase Auth, se crea automáticamente su fila
-- de dominio en public.users (id = auth.uid, email).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
--> statement-breakpoint
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();