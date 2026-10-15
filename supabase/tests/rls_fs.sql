-- Role test for the B8 FS tables (PRD v2 §2, §5; Fase 1b; migration 20261016000100_b8_fs.sql). Same method as
-- rls_roles.sql: impersonate each role through JWT claims, try insert / update / select, compare with the rule.
-- Always rolls back. Local only.
begin;

create temporary table rls_result (ok boolean, check_name text, detail text) on commit drop;
grant all on rls_result to authenticated, anon;

do $$
declare
  roles text[] := array['admin','finance','cost_accounting','ppic','production','warehouse','engineering','purchasing','sales','management'];
  r text;
  t record;
  bv uuid;
  bv_done uuid;
  denied boolean;
  err text;
  n int;
  -- table → writers, readers, insert template (%s = per-role suffix), update statement
  spec jsonb := jsonb_build_object(
    'fs_line', jsonb_build_object('w', '["admin","finance"]'::jsonb, 'r', '"all"'::jsonb,
      'ins', 'insert into public.fs_line (code, statement, section, kind, label_id, label_en, sort_order) values (''t.%s'', ''bs'', ''x'', ''leaf'', ''t'', ''t'', 999)',
      'upd', 'update public.fs_line set label_id = label_id where code = ''bs.cash'''),
    'coa_fs_map', jsonb_build_object('w', '["admin","finance"]'::jsonb, 'r', '"all"'::jsonb,
      'ins', 'insert into public.coa_fs_map (account, effective_from, fs_line_code) values (''T-%s'', ''2026-11-01'', ''bs.cash'')',
      'upd', 'update public.coa_fs_map set note = note where account = ''1101-001'''),
    'tb_month', jsonb_build_object('w', '["admin","finance"]'::jsonb, 'r', '["admin","finance","cost_accounting"]'::jsonb,
      'ins', 'insert into public.tb_month (month, account, balance_close, line_key) values (''2026-09-01'', ''1101-001'', 1, ''T|%s'')',
      'upd', 'update public.tb_month set account_name = account_name where line_key = ''setup'''),
    'history_fs_line', jsonb_build_object('w', '["admin","finance"]'::jsonb, 'r', '["admin","finance","cost_accounting"]'::jsonb,
      'ins', 'insert into public.history_fs_line (month, fs_line_code, amount, line_key) values (''2026-01-01'', ''bs.cash'', 1, ''T|%s'')',
      'upd', 'update public.history_fs_line set source_ref = source_ref where line_key = ''setup'''),
    'budget_fs_line', jsonb_build_object('w', '["admin","finance"]'::jsonb, 'r', '["admin","finance","cost_accounting"]'::jsonb,
      'ins', 'insert into public.budget_fs_line (budget_version_id, month, fs_line_code, amount, line_key) values (''BV'', ''2026-09-01'', ''bs.cash'', 1, ''T|%s'')',
      'upd', 'update public.budget_fs_line set source_ref = source_ref where line_key = ''setup'' and budget_version_id in (select id from public.budget_version where name = ''T FS open'')'),
    'fs_month', jsonb_build_object('w', '["admin","finance"]'::jsonb, 'r', '["admin","finance","cost_accounting","management","ppic","purchasing","sales"]'::jsonb,
      'ins', 'insert into public.fs_month (month, basis, fs_line_code, amount, source_kind, rule_id, line_key) values (''2026-09-01'', ''actual'', ''bs.cash'', 1, ''tb_month'', ''t'', ''T|%s'')',
      'upd', 'update public.fs_month set source_ref = source_ref where line_key = ''setup'''),
    'nwc_month', jsonb_build_object('w', '["admin","finance"]'::jsonb, 'r', '["admin","finance","cost_accounting","management","ppic","purchasing","sales"]'::jsonb,
      'ins', 'insert into public.nwc_month (month, basis, trade_receivables, inventories, trade_payables, nwc, days_in_month, rule_id, line_key) values (''2026-09-01'', ''actual'', 1, 1, 1, 1, 30, ''t'', ''T|%s'')',
      'upd', 'update public.nwc_month set dso = dso where line_key = ''setup'''),
    'cashflow_month', jsonb_build_object('w', '["admin","finance"]'::jsonb, 'r', '["admin","finance","cost_accounting","management","ppic","purchasing","sales"]'::jsonb,
      'ins', 'insert into public.cashflow_month (month, basis, line_code, amount, rule_id, line_key) values (''2026-09-01'', ''actual'', ''cf.net'', 1, ''t'', ''T|%s'')',
      'upd', 'update public.cashflow_month set computed = computed where line_key = ''setup'''),
    'fs_check_month', jsonb_build_object('w', '["admin","finance"]'::jsonb, 'r', '["admin","finance","cost_accounting","management","ppic","purchasing","sales"]'::jsonb,
      'ins', 'insert into public.fs_check_month (month, basis, code, label, status, rule_id, line_key) values (''2026-09-01'', ''actual'', ''F01'', ''t'', ''LULUS'', ''t'', ''T|%s'')',
      'upd', 'update public.fs_check_month set note = note where line_key = ''setup''')
  );
begin
  insert into public.app_user (email, role) select 't-' || x || '@x.test', x from unnest(roles) x;
  insert into public.budget_version (name, status) values ('T FS open', 'locked') returning id into bv;
  insert into public.budget_version (name, status) values ('T FS done', 'locked') returning id into bv_done;
  insert into public.tb_month (month, account, balance_close, line_key) values ('2026-09-01', '1101-001', 1, 'setup');
  insert into public.history_fs_line (month, fs_line_code, amount, line_key) values ('2026-01-01', 'bs.cash', 1, 'setup');
  insert into public.budget_fs_line (budget_version_id, month, fs_line_code, amount, line_key) values (bv, '2026-09-01', 'bs.cash', 1, 'setup');
  insert into public.budget_fs_line (budget_version_id, month, fs_line_code, amount, line_key) values (bv_done, '2026-09-01', 'bs.cash', 1, 'setup');
  update public.budget_version set fs_imported_at = now() where id = bv_done;
  insert into public.fs_month (month, basis, fs_line_code, amount, source_kind, rule_id, line_key) values ('2026-09-01', 'actual', 'bs.cash', 1, 'tb_month', 't', 'setup');
  insert into public.nwc_month (month, basis, trade_receivables, inventories, trade_payables, nwc, days_in_month, rule_id, line_key) values ('2026-09-01', 'actual', 1, 1, 1, 1, 30, 't', 'setup');
  insert into public.cashflow_month (month, basis, line_code, amount, rule_id, line_key) values ('2026-09-01', 'actual', 'cf.net', 1, 't', 'setup');
  insert into public.fs_check_month (month, basis, code, label, status, rule_id, line_key) values ('2026-09-01', 'actual', 'F01', 't', 'LULUS', 't', 'setup');

  foreach r in array roles loop
    perform set_config('request.jwt.claims', json_build_object('email', 't-' || r || '@x.test', 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    for t in select key as tbl, value as s from jsonb_each(spec) loop
      -- insert
      begin
        execute replace(format(t.s ->> 'ins', r), '''BV''', quote_literal(bv));
        denied := false; err := null;
      exception when others then denied := true; err := sqlstate || ' ' || sqlerrm;
      end;
      insert into rls_result values (denied = not ((t.s -> 'w') ? r), format('%s insert %s', r, t.tbl), coalesce('denied: ' || err, 'allowed'));
      -- update (RLS hides rows: a writer must update ≥ 1 row, others 0 rows or an error)
      begin
        execute t.s ->> 'upd';
        get diagnostics n = row_count;
        denied := n = 0; err := 'rows ' || n;
      exception when others then denied := true; err := sqlstate || ' ' || sqlerrm;
      end;
      insert into rls_result values (denied = not ((t.s -> 'w') ? r), format('%s update %s', r, t.tbl), err);
      -- select
      execute format('select count(*) from public.%I', t.tbl) into n;
      insert into rls_result values ((n > 0) = ((t.s -> 'r') = '"all"'::jsonb or (t.s -> 'r') ? r), format('%s select %s', r, t.tbl), 'rows ' || n);
    end loop;
    execute 'reset role';
  end loop;

  -- BP FS lock: lines of a version whose FS sheet is imported cannot change, even for Finance/Admin
  perform set_config('request.jwt.claims', json_build_object('email', 't-finance@x.test', 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  begin
    update public.budget_fs_line set amount = 2 where budget_version_id = bv_done;
    insert into rls_result values (false, 'budget_fs_line locked after fs_imported_at', 'allowed');
  exception when others then
    insert into rls_result values (sqlstate = '42501', 'budget_fs_line locked after fs_imported_at', sqlstate || ' ' || sqlerrm);
  end;
  -- flag b8_fs exists and is off by default
  execute 'reset role';
  insert into rls_result values ((select value from public.app_setting where key = 'b8_fs') = 'false'::jsonb, 'b8_fs default off', '');
  -- apply_changes accepts the FS tables
  insert into rls_result values ('fs_month' = any(public.upload_tables()) and 'tb_month' = any(public.upload_tables()), 'upload_tables has FS tables', '');
end $$;

do $$
declare f text; n_ok int; n_bad int;
begin
  select count(*) filter (where ok), count(*) filter (where not ok) into n_ok, n_bad from rls_result;
  select string_agg(check_name || ' (' || detail || ')', E'\n  ' order by check_name) into f from rls_result where not ok;
  if n_bad > 0 then
    raise exception E'RLS FS: % passed, % FAILED:\n  %', n_ok, n_bad, f;
  end if;
  raise notice 'RLS FS: all % checks passed', n_ok;
end $$;

rollback;
