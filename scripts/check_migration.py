#!/usr/bin/env python3
"""
Gate D item 4 (CLAUDE.md "Database"): a migration may only contain additive, idempotent statements.

    python3 -I scripts/check_migration.py supabase/migrations/<file>.sql [...]

Splits each file into top-level statements (respecting $$-quoted bodies, quotes and comments) and accepts only:
  create table|index|unique index|schema|extension … if not exists · create or replace function|trigger|view ·
  alter table … enable row level security · alter table … add column if not exists ·
  insert … on conflict … do nothing · do $$ … $$ blocks whose body only creates guarded policies / triggers / indexes /
  constraints / enables RLS.
Rejects drop, truncate, delete, update, grant, revoke, alter role, disable row level security anywhere outside
function bodies. Exit 1 on any violation.
"""
from __future__ import annotations

import re
import sys

FORBIDDEN_IN_DO = re.compile(r"\b(drop|truncate|grant|revoke|disable\s+row\s+level\s+security|alter\s+role)\b|\bdelete\s+from\b|\bupdate\s+\w", re.I)


def statements(sql: str) -> list[str]:
    out, buf, i, n = [], [], 0, len(sql)
    while i < n:
        ch = sql[i]
        if sql.startswith("--", i):
            j = sql.find("\n", i)
            i = n if j < 0 else j + 1
            continue
        if sql.startswith("/*", i):
            j = sql.find("*/", i + 2)
            i = n if j < 0 else j + 2
            continue
        m = re.match(r"\$[A-Za-z_]*\$", sql[i:])
        if m:
            tag = m.group(0)
            j = sql.find(tag, i + len(tag))
            j = n if j < 0 else j + len(tag)
            buf.append(sql[i:j])
            i = j
            continue
        if ch == "'":
            j = i + 1
            while j < n:
                if sql[j] == "'" and sql[j + 1:j + 2] == "'":
                    j += 2
                    continue
                if sql[j] == "'":
                    break
                j += 1
            buf.append(sql[i:j + 1])
            i = j + 1
            continue
        if ch == ";":
            s = "".join(buf).strip()
            if s:
                out.append(s)
            buf = []
            i += 1
            continue
        buf.append(ch)
        i += 1
    s = "".join(buf).strip()
    if s:
        out.append(s)
    return out


def allowed(stmt: str) -> str | None:
    s = re.sub(r"\s+", " ", stmt).strip()
    low = s.lower()
    if re.match(r"create (table|schema|extension) if not exists\b", low):
        return None
    if re.match(r"create (unique )?index if not exists\b", low):
        return None
    if re.match(r"create or replace (function|trigger|view)\b", low):
        return None
    if re.match(r"alter table [\w.\"]+ enable row level security$", low):
        return None
    if re.match(r"alter table [\w.\"]+ add column if not exists\b", low):
        return None
    if low.startswith("insert into ") and re.search(r"on conflict( \([^)]*\))? do nothing$", low):
        return None
    if low.startswith("do $"):
        for lit in re.findall(r"'((?:[^']|'')*)'", s):  # dynamic SQL in literals (execute '…' / format('…'))
            if re.match(r"\s*(drop|truncate|grant|revoke|alter\s+role|delete\s+from|update\s+[\w.%\"]+\s+set)\b", lit, re.I) \
                    or re.search(r"disable\s+row\s+level\s+security", lit, re.I):
                return f"do-block executes '{lit[:40]}'"
        body = re.sub(r"'(?:[^']|'')*'", "''", s)  # ignore text in string literals (messages, policy names)
        bad = FORBIDDEN_IN_DO.search(body)
        if bad:
            return f"do-block contains '{bad.group(0)}'"
        creates = re.findall(r"\bcreate\s+(policy|trigger|index|unique index|table|or replace trigger)\b", body, re.I)
        if re.search(r"\bcreate\s+policy\b", body, re.I) and not re.search(r"if not exists \(select 1 from pg_policies", body, re.I):
            return "do-block creates a policy without a pg_policies guard"
        if re.search(r"\bcreate\s+index\b(?!\s+if not exists)", body, re.I) and not re.search(r"create index if not exists", body, re.I):
            return "do-block creates an index without if not exists"
        _ = creates
        return None
    return f"statement not allowed: {s[:90]}"


def main(paths: list[str]) -> int:
    bad = 0
    for p in paths:
        with open(p, encoding="utf-8") as f:
            stmts = statements(f.read())
        problems = [(i + 1, r) for i, st in enumerate(stmts) if (r := allowed(st))]
        print(f"{p}: {len(stmts)} statements, {len(problems)} violations")
        for i, r in problems:
            print(f"  #{i}: {r}")
        bad += len(problems)
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
