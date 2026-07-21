-- Custom SQL migration file, put your code below! --

-- Enlaza public.users.id con auth.users(id). Al borrarse el usuario de auth,
-- se borra en cascada su fila de dominio. Garantiza integridad referencial.
ALTER TABLE public.users
  ADD CONSTRAINT users_id_auth_users_id_fk
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;