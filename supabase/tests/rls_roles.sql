-- Role test at the database level (PRD v1 §2, prompt rule 5; B1 inputs from Fase 1). Impersonates test users through JWT claims, checks every
-- role × table write rule, the read rules, the standard-version guards, uploads, flags, audit and the login allow-list.
-- Always rolls back. Fails (non-zero exit with psql -v ON_ERROR_STOP=1) when any expectation is not met.
--   psql "$LOCAL_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_roles.sql
-- Local only (supabase start / PG16 + _stub_supabase.sql). Never run against the remote project.
begin;

create temporary table rls_result (ok boolean, check_name text, detail text) on commit drop;
grant all on rls_result to authenticated, anon;

do $$
declare
  roles text[] := array['admin','finance','cost_accounting','ppic','production','warehouse','engineering','purchasing','sales','management'];
  r text;
  t record;
  n int;
  allowed boolean;
  denied boolean;
  err text;
  bv uuid;
  draft uuid;
  tv uuid;
  -- master table write rules (must match 20261015000200_master.sql)
  writers jsonb := '{
    "others_group": ["admin","finance"], "sku": ["admin","finance"], "material_item": ["admin","finance"],
    "coa_pool_map": ["admin","finance"], "payroll_group": ["admin","finance"], "assumption": ["admin","finance"],
    "budget_version": ["admin","finance"], "budget_line": ["admin","finance"], "budget_pool_map": ["admin","finance"],
    "std_version": ["admin","finance","ppic"], "bom_line": ["admin","finance","ppic"], "output_mix": ["admin","finance","ppic"],
    "routing": ["admin","finance","ppic"], "rate_card": ["admin","finance","ppic"], "capacity": ["admin","ppic"],
    "product": ["admin","finance"],
    "gl_month": ["admin","finance"], "gl_voucher_tag": ["admin","finance"], "payroll_month": ["admin","finance"],
    "payroll_journal": ["admin","finance"], "inventory_valuation": ["admin","finance"], "sales_by_item": ["admin","finance"],
    "average_price": ["admin","finance"], "fs_control": ["admin","finance"],
    "cogm_card": ["admin","cost_accounting"], "cogm_material": ["admin","cost_accounting"], "driver_month": ["admin","cost_accounting"]}'::jsonb;
  -- B1 inputs (must match 20261015000500_b1_inputs.sql): read by the WP preparers only
  input_readers text[] := array['admin','finance','cost_accounting'];
  ins text;
  upd text;
  up_fin uuid;
  up_ppic uuid;
  up_sales uuid;
begin
  -- setup (as the migration owner)
  insert into public.app_user (email, role) select 't-' || x || '@x.test', x from unnest(roles) x;
  insert into public.app_user (email, role, active) values ('t-gone@x.test', 'finance', false);
  select id into bv from public.budget_version where name = 'BP Okt-26 v1';
  insert into public.std_version (code, effective_from) values ('TEST_DRAFT', '2026-10-05') returning id into draft;
  insert into public.bom_line (std_version_id, product, material_category, qty_per_kg_input) values (draft, 'FCC', 'setup', 1);
  insert into public.output_mix (std_version_id, product, premium_pct) values (draft, 'FCC', 0.93);
  insert into public.routing (std_version_id, product, dept) values (draft, 'FCC', 'setup');
  insert into public.rate_card (std_version_id, pool, driver) values (draft, 'A', 'man_hour');
  insert into public.capacity (week_start, dept) values ('2026-10-05', 'setup');
  insert into public.budget_line (budget_version_id, month, component, driver_code) values (bv, '2026-10-01', 'setup', 'ALL|setup|2026-10');
  insert into public.budget_pool_map (budget_version_id, bp_row_code, pool) values (bv, 'setup', 'A');
  foreach r in array roles loop
    insert into public.std_version (code, effective_from) values ('TD_' || r, '2026-10-05');
  end loop;
  insert into public.gl_month (month, account, net, line_key) values ('2026-09-01', '5101-006', 1, 'setup');
  insert into public.gl_voucher_tag (month, voucher, account, amount, tag, target_pool, line_key) values ('2026-09-01', 'V', '6500-001', 1, 'reklas_opex', 'E', 'setup');
  insert into public.payroll_month (month, payroll_group_code, amount, line_key) values ('2026-09-01', 'SUPPORT_QC', 1, 'setup');
  insert into public.payroll_journal (month, kind, amount, line_key) values ('2026-09-01', 'gaji_staf', 1, 'setup');
  insert into public.inventory_valuation (month, item_code, line_key) values ('2026-09-01', 'BB-SETUP', 'setup');
  insert into public.sales_by_item (month, item_name, amount, line_key) values ('2026-09-01', 'setup', 1, 'setup');
  insert into public.average_price (month, item_name, price, line_key) values ('2026-09-01', 'setup', 1, 'setup');
  insert into public.cogm_card (month, line, row_kind, qty, line_key) values ('2026-09-01', 'FCC', 'input', 1, 'setup');
  insert into public.cogm_material (month, line, item_name, value_card, line_key) values ('2026-09-01', 'FCC', 'setup', 1, 'setup');
  insert into public.driver_month (month, line, driver, value, line_key) values ('2026-09-01', 'FCC', 'kwh', 1, 'setup');
  insert into public.fs_control (month, key, amount, line_key) values ('2026-09-01', 'cogs', 1, 'setup');

  ---------------------------------------------------------------- master tables: insert / update per role
  foreach r in array roles loop
    select id into tv from public.std_version where code = 'TD_' || r;
    perform set_config('request.jwt.claims', json_build_object('email', 't-' || r || '@x.test', 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    for t in select key as tbl, value as w from jsonb_each(writers) loop
      allowed := t.w ? r;
      ins := case t.tbl
        when 'product'         then null
        when 'others_group'    then format('insert into public.others_group (code, name) values (%L, ''t'')', 'T_' || r)
        when 'sku'             then format('insert into public.sku (code, others_group_code, name) values (%L, ''CEMCEM_ORI'', ''t'')', 'T-' || r)
        when 'material_item'   then format('insert into public.material_item (name, category) values (%L, ''other'')', 'T ' || r)
        when 'coa_pool_map'    then format('insert into public.coa_pool_map (account, effective_from, pool) values (%L, ''2026-10-01'', ''NONE'')', 'T-' || r)
        when 'payroll_group'   then format('insert into public.payroll_group (code, name, dept, kind, pool) values (%L, ''t'', ''t'', ''support'', ''B'')', 'T_' || r)
        when 'assumption'      then format('insert into public.assumption (key, effective_from) values (%L, ''2026-10-01'')', 't_' || r)
        when 'budget_version'  then format('insert into public.budget_version (name) values (%L)', 'T ' || r)
        when 'budget_line'     then format('insert into public.budget_line (budget_version_id, month, component, driver_code) values (%L, ''2026-10-01'', ''t'', %L)', bv, 'T|' || r)
        when 'budget_pool_map' then format('insert into public.budget_pool_map (budget_version_id, bp_row_code, pool) values (%L, %L, ''A'')', bv, 'T ' || r)
        when 'std_version'     then format('insert into public.std_version (code, effective_from) values (%L, ''2026-10-05'')', 'T_' || r)
        when 'bom_line'        then format('insert into public.bom_line (std_version_id, product, material_category, qty_per_kg_input) values (%L, ''FCC'', ''t'', 1)', tv)
        when 'output_mix'      then format('insert into public.output_mix (std_version_id, product, premium_pct) values (%L, ''FCC'', 0.9)', tv)
        when 'routing'         then format('insert into public.routing (std_version_id, product, dept) values (%L, ''FCC'', ''t'')', tv)
        when 'rate_card'       then format('insert into public.rate_card (std_version_id, pool, driver) values (%L, ''A'', ''man_hour'')', tv)
        when 'capacity'        then format('insert into public.capacity (week_start, dept) values (''2026-10-05'', %L)', 't_' || r)
        when 'gl_month'            then format('insert into public.gl_month (month, account, net, line_key) values (''2026-09-01'', ''5101-006'', 1, %L)', 'T|' || r)
        when 'gl_voucher_tag'      then format('insert into public.gl_voucher_tag (month, voucher, account, amount, tag, target_pool, line_key) values (''2026-09-01'', ''V'', ''6500-001'', 1, ''reklas_opex'', ''E'', %L)', 'T|' || r)
        when 'payroll_month'       then format('insert into public.payroll_month (month, payroll_group_code, amount, line_key) values (''2026-09-01'', ''SUPPORT_QC'', 1, %L)', 'T|' || r)
        when 'payroll_journal'     then format('insert into public.payroll_journal (month, kind, amount, line_key) values (''2026-09-01'', ''gaji_staf'', 1, %L)', 'T|' || r)
        when 'inventory_valuation' then format('insert into public.inventory_valuation (month, item_code, line_key) values (''2026-09-01'', ''BB-T'', %L)', 'T|' || r)
        when 'sales_by_item'       then format('insert into public.sales_by_item (month, item_name, amount, line_key) values (''2026-09-01'', ''t'', 1, %L)', 'T|' || r)
        when 'average_price'       then format('insert into public.average_price (month, item_name, price, line_key) values (''2026-09-01'', ''t'', 1, %L)', 'T|' || r)
        when 'cogm_card'           then format('insert into public.cogm_card (month, line, row_kind, qty, line_key) values (''2026-09-01'', ''FCC'', ''input'', 1, %L)', 'T|' || r)
        when 'cogm_material'       then format('insert into public.cogm_material (month, line, item_name, value_card, line_key) values (''2026-09-01'', ''FCC'', ''t'', 1, %L)', 'T|' || r)
        when 'driver_month'        then format('insert into public.driver_month (month, line, driver, value, line_key) values (''2026-09-01'', ''FCC'', ''kwh'', 1, %L)', 'T|' || r)
        when 'fs_control'          then format('insert into public.fs_control (month, key, amount, line_key) values (''2026-09-01'', ''cogs'', 1, %L)', 'T|' || r)
      end;
      if ins is not null then
        begin
          execute ins;
          denied := false; err := null;
        exception when others then
          denied := true; err := sqlstate || ' ' || sqlerrm;
        end;
        insert into rls_result values (denied = not allowed, format('%s insert %s', r, t.tbl),
          case when denied then 'denied: ' || err else 'allowed' end);
      end if;
      upd := case t.tbl
        when 'product'         then 'update public.product set sort_order = sort_order where code = ''FCC'''
        when 'others_group'    then 'update public.others_group set sort_order = sort_order where code = ''CEMCEM_ORI'''
        when 'sku'             then 'update public.sku set sort_order = sort_order where code = ''FG-180'''
        when 'material_item'   then 'update public.material_item set sort_order = sort_order where name = ''CNG'''
        when 'coa_pool_map'    then 'update public.coa_pool_map set note = note where account = ''5101-006'' and effective_from = ''2026-10-01'''
        when 'payroll_group'   then 'update public.payroll_group set sort_order = sort_order where code = ''SUPPORT_QC'''
        when 'assumption'      then 'update public.assumption set note = note where key = ''nrv_kw2'''
        when 'budget_version'  then 'update public.budget_version set note = note where name = ''BP Okt-26 v1'''
        when 'budget_line'     then 'update public.budget_line set component = component where driver_code = ''ALL|setup|2026-10'''
        when 'budget_pool_map' then 'update public.budget_pool_map set pool = pool where bp_row_code = ''setup'''
        when 'std_version'     then 'update public.std_version set note = ''x'' where code = ''TEST_DRAFT'''
        when 'bom_line'        then 'update public.bom_line set band_low = 0.85 where material_category = ''setup'''
        when 'output_mix'      then format('update public.output_mix set kw2_pct = 0.03 where std_version_id = %L', draft)
        when 'routing'         then 'update public.routing set hours_per_ton = 1 where dept = ''setup'''
        when 'rate_card'       then format('update public.rate_card set rate_variable = 1 where std_version_id = %L', draft)
        when 'capacity'        then 'update public.capacity set headcount = 1 where dept = ''setup'''
        else format('update public.%I set line_key = line_key where line_key = ''setup''', t.tbl)
      end;
      begin
        execute upd;
        get diagnostics n = row_count;
        err := null;
      exception when others then
        n := -1; err := sqlstate || ' ' || sqlerrm;
      end;
      insert into rls_result values ((n > 0) = allowed, format('%s update %s', r, t.tbl), coalesce(err, 'rows=' || n));
      -- no hard delete for anyone (soft delete only)
      begin
        execute format('delete from public.%I where false or true', t.tbl);
        get diagnostics n = row_count;
      exception when others then n := 0; end;
      insert into rls_result values (n = 0, format('%s delete %s', r, t.tbl), 'rows=' || n);
    end loop;
    -- every active app user reads the master data
    select count(*) into n from public.product;
    insert into rls_result values (n = 3, format('%s read product', r), 'rows=' || n);
    select count(*) into n from public.coa_pool_map;
    insert into rls_result values (n >= 62, format('%s read coa_pool_map', r), 'rows=' || n);
    -- B1 inputs: only the WP preparers read them
    foreach ins in array array['gl_month','gl_voucher_tag','payroll_month','payroll_journal','inventory_valuation',
        'sales_by_item','average_price','cogm_card','cogm_material','driver_month','fs_control'] loop
      execute format('select count(*) from public.%I', ins) into n;
      insert into rls_result values ((n > 0) = (r = any(input_readers)), format('%s read %s', r, ins), 'rows=' || n);
    end loop;
    -- flags: only Admin changes them
    update public.app_setting set value = 'false' where key = 'b1_ingest';
    get diagnostics n = row_count;
    insert into rls_result values ((n = 1) = (r = 'admin'), format('%s update app_setting', r), 'rows=' || n);
    -- audit trail: read by admin / finance / cost_accounting; nobody writes it directly
    select count(*) into n from public.audit_log;
    insert into rls_result values ((n > 0) = (r in ('admin','finance','cost_accounting')), format('%s read audit_log', r), 'rows=' || n);
    begin
      insert into public.audit_log (table_name, op) values ('x', 'INSERT');
      insert into rls_result values (false, format('%s insert audit_log', r), 'allowed');
    exception when others then
      insert into rls_result values (true, format('%s insert audit_log', r), 'denied');
    end;
    -- uploads and rebuild requests: every role except management
    begin
      insert into public.upload (kind, period, file_name, sha256, uploaded_by) values ('gl_month', '2026-09-01', 'x.xlsx', 'abc', 't-' || r || '@x.test');
      denied := false;
    exception when others then denied := true; end;
    insert into rls_result values (denied = (r = 'management'), format('%s insert upload', r), case when denied then 'denied' else 'allowed' end);
    begin
      insert into public.rebuild_queue (kind, period, reason) values ('month', '2026-09-01', 'rls test');
      denied := false;
    exception when others then denied := true; end;
    insert into rls_result values (denied = (r = 'management'), format('%s insert rebuild_queue', r), case when denied then 'denied' else 'allowed' end);
    -- admin_set_password: Admin only
    begin
      perform public.admin_set_password('t-sales@x.test', 'a-long-password-1');
      denied := false;
    exception when others then denied := true; end;
    insert into rls_result values (denied = (r <> 'admin'), format('%s admin_set_password', r), case when denied then 'denied' else 'allowed' end);
    -- private schema is not reachable
    begin
      perform private.provision_login('t-sales@x.test', 'a-long-password-1');
      insert into rls_result values (false, format('%s private.provision_login', r), 'allowed');
    exception when others then
      insert into rls_result values (true, format('%s private.provision_login', r), 'denied');
    end;
    execute 'reset role';
  end loop;

  ---------------------------------------------------------------- uploads: the uploader (or Admin) moves the status
  perform set_config('request.jwt.claims', '{"email":"t-sales@x.test","role":"authenticated"}', true);
  execute 'set local role authenticated';
  update public.upload set status = 'rejected' where uploaded_by = 't-finance@x.test';
  get diagnostics n = row_count;
  insert into rls_result values (n = 0, 'sales update finance upload', 'rows=' || n);
  update public.upload set status = 'rejected' where uploaded_by = 't-sales@x.test';
  get diagnostics n = row_count;
  insert into rls_result values (n = 1, 'sales update own upload', 'rows=' || n);
  begin
    perform public.apply_changes('app_user', '[{"email":"x@x.test","role":"admin"}]'::jsonb, '[]'::jsonb, '{}'::text[]);
    insert into rls_result values (false, 'apply_changes on app_user', 'allowed');
  exception when others then
    insert into rls_result values (true, 'apply_changes on app_user', 'denied: ' || sqlerrm);
  end;
  begin
    perform public.apply_changes('budget_line', jsonb_build_array(jsonb_build_object('budget_version_id', bv, 'month', '2026-10-01', 'component', 's', 'driver_code', 'S|1')), '[]'::jsonb, '{}'::text[]);
    insert into rls_result values (false, 'sales apply_changes budget_line', 'allowed');
  exception when others then
    insert into rls_result values (true, 'sales apply_changes budget_line', 'denied');
  end;
  execute 'reset role';

  perform set_config('request.jwt.claims', '{"email":"t-finance@x.test","role":"authenticated"}', true);
  execute 'set local role authenticated';
  select (public.apply_changes('budget_line',
      jsonb_build_array(jsonb_build_object('budget_version_id', bv, 'month', '2026-10-01', 'component', 'f', 'driver_code', 'F|1')),
      '[]'::jsonb, '{}'::text[]) ->> 'inserted')::int into n;
  insert into rls_result values (n = 1, 'finance apply_changes insert budget_line', 'inserted=' || n);
  select (public.apply_changes('budget_line', '[]'::jsonb, '[]'::jsonb,
      array[(select id::text from public.budget_line where driver_code = 'F|1')]) ->> 'deleted')::int into n;
  insert into rls_result values (n = 1, 'finance apply_changes soft delete budget_line', 'deleted=' || n);
  select count(*) into n from public.budget_line where driver_code = 'F|1' and deleted_at is not null and deleted_by = 't-finance@x.test';
  insert into rls_result values (n = 1, 'soft delete stamps deleted_by', 'rows=' || n);
  execute 'reset role';

  ---------------------------------------------------------------- BP lock: lines frozen once the locked version is imported
  insert into public.budget_version (name, status) values ('T BP lock', 'locked') returning id into tv;
  perform set_config('request.jwt.claims', '{"email":"t-finance@x.test","role":"authenticated"}', true);
  execute 'set local role authenticated';
  insert into public.budget_line (budget_version_id, month, component, driver_code) values (tv, '2026-10-01', 'l', 'L|1');
  update public.budget_version set imported_at = now() where id = tv;
  get diagnostics n = row_count;
  insert into rls_result values (n = 1, 'finance imports into locked version (imported_at set)', 'rows=' || n);
  begin
    insert into public.budget_line (budget_version_id, month, component, driver_code) values (tv, '2026-10-01', 'l', 'L|2');
    insert into rls_result values (false, 'budget_line insert after import', 'allowed');
  exception when others then
    insert into rls_result values (sqlstate = '42501', 'budget_line insert after import', 'denied: ' || sqlerrm);
  end;
  begin
    update public.budget_line set component = 'x' where budget_version_id = tv;
    insert into rls_result values (false, 'budget_line update after import', 'allowed');
  exception when others then
    insert into rls_result values (true, 'budget_line update after import', 'denied');
  end;
  begin
    update public.budget_version set status = 'draft' where id = tv;
    insert into rls_result values (false, 'unlock imported budget version', 'allowed');
  exception when others then
    insert into rls_result values (true, 'unlock imported budget version', 'denied');
  end;
  execute 'reset role';

  ---------------------------------------------------------------- apply_upload: one transaction per upload, uploader or Admin only
  select id into up_fin from public.upload where uploaded_by = 't-finance@x.test';
  select id into up_ppic from public.upload where uploaded_by = 't-ppic@x.test';
  select id into up_sales from public.upload where uploaded_by = 't-sales@x.test';
  perform set_config('request.jwt.claims', '{"email":"t-ppic@x.test","role":"authenticated"}', true);
  execute 'set local role authenticated';
  begin
    perform public.apply_upload(up_fin, '[]'::jsonb);
    insert into rls_result values (false, 'ppic apply_upload of finance upload', 'allowed');
  exception when others then
    insert into rls_result values (sqlstate = '42501', 'ppic apply_upload of finance upload', 'denied: ' || sqlerrm);
  end;
  execute 'reset role';
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  execute 'set local role anon';
  begin
    perform public.apply_upload(up_fin, '[]'::jsonb);
    insert into rls_result values (false, 'anon apply_upload', 'allowed');
  exception when others then
    insert into rls_result values (true, 'anon apply_upload', 'denied: ' || sqlerrm);
  end;
  execute 'reset role';
  perform set_config('request.jwt.claims', '{"email":"t-sales@x.test","role":"authenticated"}', true);
  execute 'set local role authenticated';
  begin
    perform public.apply_upload(up_sales, '[]'::jsonb);  -- rejected above
    insert into rls_result values (false, 'apply_upload of rejected upload', 'allowed');
  exception when others then
    insert into rls_result values (true, 'apply_upload of rejected upload', 'denied: ' || sqlerrm);
  end;
  execute 'reset role';
  perform set_config('request.jwt.claims', '{"email":"t-finance@x.test","role":"authenticated"}', true);
  execute 'set local role authenticated';
  -- the second target is not an upload table: the whole call fails, the first target's insert does not survive
  begin
    perform public.apply_upload(up_fin, jsonb_build_array(
      jsonb_build_object('table', 'budget_line', 'inserts',
        jsonb_build_array(jsonb_build_object('budget_version_id', bv, 'month', '2026-10-01', 'component', 'u', 'driver_code', 'U|1'))),
      jsonb_build_object('table', 'app_user', 'inserts', '[{"email":"x@x.test","role":"admin"}]'::jsonb)));
    insert into rls_result values (false, 'apply_upload with a failing target', 'allowed');
  exception when others then
    insert into rls_result values (true, 'apply_upload with a failing target', 'denied: ' || sqlerrm);
  end;
  select count(*) into n from public.budget_line where driver_code = 'U|1';
  insert into rls_result values (n = 0, 'apply_upload failure keeps no target rows', 'rows=' || n);
  select count(*) into n from public.upload where id = up_fin and status = 'staged';
  insert into rls_result values (n = 1, 'apply_upload failure leaves upload staged', 'rows=' || n);
  select (public.apply_upload(up_fin, jsonb_build_array(
      jsonb_build_object('table', 'budget_line', 'inserts',
        jsonb_build_array(jsonb_build_object('budget_version_id', bv, 'month', '2026-10-01', 'component', 'u', 'driver_code', 'U|2')))))
    ->> 'inserted')::int into n;
  insert into rls_result values (n = 1, 'finance apply_upload own upload', 'inserted=' || n);
  select count(*) into n from public.upload where id = up_fin and status = 'committed' and inserted = 1 and committed_at is not null;
  insert into rls_result values (n = 1, 'apply_upload marks upload committed', 'rows=' || n);
  begin
    perform public.apply_upload(up_fin, '[]'::jsonb);
    insert into rls_result values (false, 'apply_upload of committed upload', 'allowed');
  exception when others then
    insert into rls_result values (true, 'apply_upload of committed upload', 'denied: ' || sqlerrm);
  end;
  execute 'reset role';
  perform set_config('request.jwt.claims', '{"email":"t-admin@x.test","role":"authenticated"}', true);
  execute 'set local role authenticated';
  select (public.apply_upload(up_ppic, '[]'::jsonb) ->> 'inserted')::int into n;
  select count(*) into n from public.upload where id = up_ppic and status = 'committed';
  insert into rls_result values (n = 1, 'admin apply_upload of another user upload', 'rows=' || n);
  execute 'reset role';

  ---------------------------------------------------------------- standard versions: PPIC drafts, Finance/Admin approve
  perform set_config('request.jwt.claims', '{"email":"t-ppic@x.test","role":"authenticated"}', true);
  execute 'set local role authenticated';
  begin
    update public.std_version set status = 'approved' where code = 'TEST_DRAFT';
    insert into rls_result values (false, 'ppic approve std_version', 'allowed');
  exception when others then
    insert into rls_result values (true, 'ppic approve std_version', 'denied: ' || sqlerrm);
  end;
  execute 'reset role';
  perform set_config('request.jwt.claims', '{"email":"t-finance@x.test","role":"authenticated"}', true);
  execute 'set local role authenticated';
  update public.std_version set status = 'approved' where code = 'TEST_DRAFT';
  select count(*) into n from public.std_version where code = 'TEST_DRAFT' and status = 'approved' and approved_by = 't-finance@x.test' and approved_at is not null;
  insert into rls_result values (n = 1, 'finance approve std_version stamps approver', 'rows=' || n);
  begin
    insert into public.bom_line (std_version_id, product, material_category, qty_per_kg_input) values (draft, 'FCC', 'late', 1);
    insert into rls_result values (false, 'bom_line insert into approved version', 'allowed');
  exception when others then
    insert into rls_result values (true, 'bom_line insert into approved version', 'denied: ' || sqlerrm);
  end;
  begin
    update public.routing set hours_per_ton = 2 where std_version_id = draft;
    insert into rls_result values (false, 'routing update in approved version', 'allowed');
  exception when others then
    insert into rls_result values (true, 'routing update in approved version', 'denied');
  end;
  begin
    update public.std_version set effective_from = '2026-11-02' where code = 'TEST_DRAFT';
    insert into rls_result values (false, 'approved std_version edit', 'allowed');
  exception when others then
    insert into rls_result values (true, 'approved std_version edit', 'denied');
  end;
  begin
    update public.std_version set status = 'draft' where code = 'TEST_DRAFT';
    insert into rls_result values (false, 'approved → draft', 'allowed');
  exception when others then
    insert into rls_result values (true, 'approved → draft', 'denied');
  end;
  update public.std_version set status = 'superseded' where code = 'TEST_DRAFT';
  get diagnostics n = row_count;
  insert into rls_result values (n = 1, 'finance supersede std_version', 'rows=' || n);
  execute 'reset role';

  ---------------------------------------------------------------- strangers, inactive users, anonymous
  perform set_config('request.jwt.claims', '{"email":"stranger@x.test","role":"authenticated"}', true);
  execute 'set local role authenticated';
  select count(*) into n from public.product;
  insert into rls_result values (n = 0, 'stranger read product', 'rows=' || n);
  select count(*) into n from public.app_setting;
  insert into rls_result values (n = 0, 'stranger read app_setting', 'rows=' || n);
  insert into rls_result values (public.module_enabled('b1_ingest') = false, 'module flag off by default', '');
  execute 'reset role';
  perform set_config('request.jwt.claims', '{"email":"t-gone@x.test","role":"authenticated"}', true);
  execute 'set local role authenticated';
  select count(*) into n from public.product;
  insert into rls_result values (n = 0, 'inactive user read product', 'rows=' || n);
  execute 'reset role';
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  execute 'set local role anon';
  select count(*) into n from public.product;
  insert into rls_result values (n = 0, 'anon read product', 'rows=' || n);
  select count(*) into n from public.app_user;
  insert into rls_result values (n = 0, 'anon read app_user', 'rows=' || n);
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);

  ---------------------------------------------------------------- stamps and audit
  select count(*) into n from public.audit_log where actor = 't-finance@x.test' and table_name = 'budget_line';
  insert into rls_result values (n >= 2, 'audit rows by finance on budget_line', 'rows=' || n);
  select count(*) into n from public.std_version where code = 'T_ppic' and created_by = 't-ppic@x.test';
  insert into rls_result values (n = 1, 'created_by stamped', 'rows=' || n);

  ---------------------------------------------------------------- login allow-list
  begin
    insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data)
    values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 't-finance@x.test', '{"provider":"email","providers":["email"]}');
    insert into rls_result values (false, 'self sign-up', 'allowed');
  exception when others then
    insert into rls_result values (true, 'self sign-up', 'denied');
  end;
  begin
    insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data)
    values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'nobody@x.test', '{"provider":"google","providers":["google"]}');
    insert into rls_result values (false, 'google sign-in of unlisted e-mail', 'allowed');
  exception when others then
    insert into rls_result values (true, 'google sign-in of unlisted e-mail', 'denied');
  end;
  insert into rls_result values (private.provision_login('t-finance@x.test', 'a-long-password-1') = 'created', 'provision login (SQL editor path)', '');
  insert into rls_result values (private.provision_login('t-finance@x.test', 'another-password-2') = 'updated', 'reset password (SQL editor path)', '');
  begin
    perform private.provision_login('nobody@x.test', 'a-long-password-1');
    insert into rls_result values (false, 'provision login for unlisted e-mail', 'allowed');
  exception when others then
    insert into rls_result values (true, 'provision login for unlisted e-mail', 'denied');
  end;
end $$;

-- report
do $$
declare f text; n_ok int; n_bad int;
begin
  select count(*) filter (where ok), count(*) filter (where not ok) into n_ok, n_bad from rls_result;
  select string_agg(check_name || ' (' || detail || ')', E'\n  ' order by check_name) into f from rls_result where not ok;
  if n_bad > 0 then
    raise exception E'RLS: % passed, % FAILED:\n  %', n_ok, n_bad, f;
  end if;
  raise notice 'RLS: all % checks passed', n_ok;
end $$;

rollback;
