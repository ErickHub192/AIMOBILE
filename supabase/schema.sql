

create extension if not exists "pgcrypto";

create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  rol text not null default 'usuario' check (rol in ('usuario', 'admin')),
  estado text not null default 'activo' check (estado in ('activo', 'inactivo', 'suspendido')),
  fecha_registro timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.proyectos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  nombre_proyecto text not null,
  descripcion_inicial text,
  objetivo text,
  fecha_inicio date default current_date,
  fecha_fin_estimada date,
  estado text not null default 'definido' check (estado in ('definido', 'en_desarrollo', 'en_pruebas', 'finalizado', 'cancelado')),
  presupuesto_estimado numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversaciones (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null unique references public.proyectos(id) on delete cascade,
  titulo_conversacion text,
  fecha_creacion timestamptz not null default now(),
  fecha_ultima_actualizacion timestamptz not null default now(),
  estado text not null default 'activa' check (estado in ('activa', 'cerrada', 'archivada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mensajes (
  id uuid primary key default gen_random_uuid(),
  conversacion_id uuid not null references public.conversaciones(id) on delete cascade,
  emisor text not null check (emisor in ('usuario', 'ia', 'sistema')),
  contenido text not null,
  tipo_mensaje text not null default 'consulta' check (tipo_mensaje in ('consulta', 'respuesta', 'sugerencia', 'validacion', 'error', 'sistema')),
  fecha_envio timestamptz not null default now(),
  orden_mensaje integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.requerimientos (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos(id) on delete cascade,
  mensaje_origen_id uuid references public.mensajes(id) on delete set null,
  tipo_requerimiento text not null default 'funcional' check (tipo_requerimiento in ('funcional', 'no_funcional')),
  descripcion text not null,
  prioridad text not null default 'media' check (prioridad in ('alta', 'media', 'baja')),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobado', 'implementado', 'descartado')),
  fecha_registro timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.iteraciones (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos(id) on delete cascade,
  numero_iteracion integer not null,
  objetivo_iteracion text,
  comentarios_usuario text,
  fecha_inicio timestamptz not null default now(),
  fecha_cierre timestamptz,
  estado text not null default 'abierta' check (estado in ('abierta', 'en_proceso', 'cerrada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (proyecto_id, numero_iteracion)
);

create table if not exists public.versiones_aplicacion (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos(id) on delete cascade,
  iteracion_id uuid references public.iteraciones(id) on delete set null,
  numero_version text not null,
  descripcion_version text,
  framework_objetivo text,
  ruta_codigo_fuente text,
  estado_generacion text not null default 'generada' check (estado_generacion in ('generada', 'validada', 'rechazada', 'en_revision')),
  fecha_generacion timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pantallas (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.versiones_aplicacion(id) on delete cascade,
  nombre_pantalla text not null,
  tipo_pantalla text not null,
  orden_visual integer not null,
  descripcion_funcional text,
  estado text not null default 'activa' check (estado in ('activa', 'modificada', 'eliminada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.previews (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.versiones_aplicacion(id) on delete cascade,
  url_preview text,
  storage_path text,
  fecha_generacion timestamptz not null default now(),
  fecha_expiracion timestamptz,
  estado text not null default 'disponible' check (estado in ('disponible', 'expirado', 'eliminado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.apks_generados (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.versiones_aplicacion(id) on delete cascade,
  nombre_archivo text not null,
  ruta_archivo text,
  storage_path text,
  version_code integer,
  version_name text,
  tamano_mb numeric,
  fecha_generacion timestamptz not null default now(),
  estado text not null default 'generado' check (estado in ('generado', 'descargado', 'fallido')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.usuarios enable row level security;
alter table public.proyectos enable row level security;
alter table public.conversaciones enable row level security;
alter table public.mensajes enable row level security;
alter table public.requerimientos enable row level security;
alter table public.iteraciones enable row level security;
alter table public.versiones_aplicacion enable row level security;
alter table public.pantallas enable row level security;
alter table public.previews enable row level security;
alter table public.apks_generados enable row level security;

drop policy if exists "usuarios_select_own" on public.usuarios;
create policy "usuarios_select_own" on public.usuarios for select using (auth.uid() = id);
drop policy if exists "usuarios_insert_own" on public.usuarios;
create policy "usuarios_insert_own" on public.usuarios for insert with check (auth.uid() = id);
drop policy if exists "usuarios_update_own" on public.usuarios;
create policy "usuarios_update_own" on public.usuarios for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "proyectos_own" on public.proyectos;
create policy "proyectos_own" on public.proyectos for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

drop policy if exists "conversaciones_own" on public.conversaciones;
create policy "conversaciones_own" on public.conversaciones for all using (
  exists (select 1 from public.proyectos p where p.id = proyecto_id and p.usuario_id = auth.uid())
) with check (
  exists (select 1 from public.proyectos p where p.id = proyecto_id and p.usuario_id = auth.uid())
);

drop policy if exists "mensajes_own" on public.mensajes;
create policy "mensajes_own" on public.mensajes for all using (
  exists (
    select 1 from public.conversaciones c
    join public.proyectos p on p.id = c.proyecto_id
    where c.id = conversacion_id and p.usuario_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.conversaciones c
    join public.proyectos p on p.id = c.proyecto_id
    where c.id = conversacion_id and p.usuario_id = auth.uid()
  )
);

drop policy if exists "requerimientos_own" on public.requerimientos;
create policy "requerimientos_own" on public.requerimientos for all using (
  exists (select 1 from public.proyectos p where p.id = proyecto_id and p.usuario_id = auth.uid())
) with check (
  exists (select 1 from public.proyectos p where p.id = proyecto_id and p.usuario_id = auth.uid())
);

drop policy if exists "iteraciones_own" on public.iteraciones;
create policy "iteraciones_own" on public.iteraciones for all using (
  exists (select 1 from public.proyectos p where p.id = proyecto_id and p.usuario_id = auth.uid())
) with check (
  exists (select 1 from public.proyectos p where p.id = proyecto_id and p.usuario_id = auth.uid())
);

drop policy if exists "versiones_own" on public.versiones_aplicacion;
create policy "versiones_own" on public.versiones_aplicacion for all using (
  exists (select 1 from public.proyectos p where p.id = proyecto_id and p.usuario_id = auth.uid())
) with check (
  exists (select 1 from public.proyectos p where p.id = proyecto_id and p.usuario_id = auth.uid())
);

drop policy if exists "pantallas_own" on public.pantallas;
create policy "pantallas_own" on public.pantallas for all using (
  exists (
    select 1 from public.versiones_aplicacion v
    join public.proyectos p on p.id = v.proyecto_id
    where v.id = version_id and p.usuario_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.versiones_aplicacion v
    join public.proyectos p on p.id = v.proyecto_id
    where v.id = version_id and p.usuario_id = auth.uid()
  )
);

drop policy if exists "previews_own" on public.previews;
create policy "previews_own" on public.previews for all using (
  exists (
    select 1 from public.versiones_aplicacion v
    join public.proyectos p on p.id = v.proyecto_id
    where v.id = version_id and p.usuario_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.versiones_aplicacion v
    join public.proyectos p on p.id = v.proyecto_id
    where v.id = version_id and p.usuario_id = auth.uid()
  )
);

drop policy if exists "apks_own" on public.apks_generados;
create policy "apks_own" on public.apks_generados for all using (
  exists (
    select 1 from public.versiones_aplicacion v
    join public.proyectos p on p.id = v.proyecto_id
    where v.id = version_id and p.usuario_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.versiones_aplicacion v
    join public.proyectos p on p.id = v.proyecto_id
    where v.id = version_id and p.usuario_id = auth.uid()
  )
);


-- Crea automáticamente el perfil público cuando se registra un usuario en Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id, nombre)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'Usuario')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.usuarios (id, nombre)
select id, coalesce(raw_user_meta_data->>'name', raw_user_meta_data->>'full_name', split_part(email, '@', 1), 'Usuario')
from auth.users
on conflict (id) do nothing;

notify pgrst, 'reload schema';
