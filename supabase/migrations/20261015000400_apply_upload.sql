-- Atomic upload commit (review PR #1: Codex P1/P2). One RPC call = one transaction: every target table of an upload
-- is applied through apply_changes, then the upload is marked committed. Any failure rolls back everything, so the
-- upload stays staged/planned and a retry starts clean. Only the uploader (or Admin) may commit; the row lock
-- (select … for update) also serialises two commits of the same upload.
-- Idempotent and additive only.

create or replace function public.apply_upload(p_upload_id uuid, p_changes jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  up record;
  c jsonb;
  r jsonb;
  n_ins int := 0; n_upd int := 0; n_del int := 0; n_sup int := 0;
begin
  select u.id, u.status, u.uploaded_by into up from public.upload u where u.id = p_upload_id for update;
  if not found then
    raise exception 'Upload tidak ditemukan atau bukan milik Anda' using errcode = '42501';
  end if;
  if up.uploaded_by is distinct from public.current_email() and not (select public.has_role('admin')) then
    raise exception 'Hanya pengunggah atau Admin yang bisa menyimpan upload ini' using errcode = '42501';
  end if;
  if up.status not in ('staged', 'planned') then
    raise exception 'Upload sudah %', up.status;
  end if;
  if p_changes is null or jsonb_typeof(p_changes) <> 'array' then
    raise exception 'apply_upload: p_changes harus array';
  end if;
  for c in select * from jsonb_array_elements(p_changes) loop
    r := public.apply_changes(
      c ->> 'table',
      coalesce(c -> 'inserts', '[]'::jsonb),
      coalesce(c -> 'updates', '[]'::jsonb),
      array(select jsonb_array_elements_text(coalesce(c -> 'soft_deletes', '[]'::jsonb))),
      array(select jsonb_array_elements_text(coalesce(c -> 'supersede', '[]'::jsonb)))
    );
    n_ins := n_ins + (r ->> 'inserted')::int;
    n_upd := n_upd + (r ->> 'updated')::int;
    n_del := n_del + (r ->> 'deleted')::int;
    n_sup := n_sup + (r ->> 'superseded')::int;
  end loop;
  update public.upload
     set status = 'committed', committed_at = now(), inserted = n_ins, updated = n_upd, deleted = n_del
   where id = p_upload_id;
  return jsonb_build_object('inserted', n_ins, 'updated', n_upd, 'deleted', n_del, 'superseded', n_sup);
end $$;
