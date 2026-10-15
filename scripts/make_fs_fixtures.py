#!/usr/bin/env python3
"""
Synthesize the Fase 1b trial balance fixture (PRD v2 §6.1 `tb_month`): fixtures/uploads-fs/2026-08/tb_month.xlsx.

    python3 -I scripts/make_fs_fixtures.py           # write fixtures/uploads-fs/
    python3 -I scripts/make_fs_fixtures.py --check   # rebuild to a temp dir and fail if fixtures/uploads-fs differs (CI)

No Accurate TB/LK is in reference/. The BP v1 workbook carries the GL balances per account for Jan–Agu 2026 (sheets
"BS/PL Actual MTM - Aug 26", extracted to fixtures/budget-v1/coa_mtm.json). This script turns them into an Accurate
style "Neraca Saldo" for August: balances debit-positive (BS: closing balance; liabilities, equity and income are
credit balances in the MTM sheets and are negated), P&L: opening = Σ Jan–Jul, movement = Agu, closing = Σ Jan–Agu.
Postable accounts only (group headers without an Accurate code are left out). Deterministic output (same writer as
make_upload_fixtures.py).
"""
from __future__ import annotations

import filecmp
import importlib.util
import json
import os
import shutil
import sys
import tempfile
from decimal import Decimal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "fixtures", "uploads-fs")

_spec = importlib.util.spec_from_file_location("muf", os.path.join(ROOT, "scripts", "make_upload_fixtures.py"))
muf = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(muf)  # reuse the deterministic xlsx writer


def credit_side(account: str) -> bool:
    return account[:1] in ("2", "3", "4", "7")


def tb_rows() -> list[list]:
    with open(os.path.join(ROOT, "fixtures", "budget-v1", "coa_mtm.json"), encoding="utf-8") as f:
        accounts = json.load(f)["accounts"]
    rows = []
    for a in accounts:
        if not a["kode"] and not a["mapping"]:
            continue  # group header
        sign = Decimal(-1) if credit_side(a["account"]) else Decimal(1)
        v = {m: Decimal(x) * sign for m, x in a["values"].items()}
        if a["sheet"].startswith("PL"):
            close = sum((x for m, x in v.items() if m <= "2026-08"), Decimal(0))
            mv = v.get("2026-08", Decimal(0))
        else:
            close = v.get("2026-08", Decimal(0))
            mv = close - v.get("2026-07", Decimal(0))
        opening = close - mv
        debit, credit = (mv, Decimal(0)) if mv >= 0 else (Decimal(0), -mv)
        rows.append([a["account"], a["name"], muf.plain(opening), muf.plain(debit), muf.plain(credit), muf.plain(close),
                     f"{a['sheet']} baris {a['r']}"])
    return rows


def build(root: str) -> dict:
    d = os.path.join(root, "2026-08")
    os.makedirs(d, exist_ok=True)
    rows = tb_rows()
    muf.write_xlsx(os.path.join(d, "tb_month.xlsx"), [(
        "Neraca Saldo",
        [["PT Boga Makmur Gracia"], ["Neraca Saldo"], ["Periode 01 Agu 2026 s/d 31 Agu 2026"], []],
        ["No. Akun", "Nama Akun", "Saldo Awal", "Debit", "Kredit", "Saldo Akhir", "Sumber"],
        rows,
    )])
    return {"tb_month": len(rows)}


def main(argv: list[str]) -> int:
    if "--check" in argv:
        tmp = tempfile.mkdtemp()
        try:
            build(tmp)
            cmp = filecmp.dircmp(OUT, tmp)
            diffs = []

            def walk(c, p=""):
                diffs.extend(p + x for x in c.left_only + c.right_only + c.diff_files)
                for n, s in c.subdirs.items():
                    walk(s, p + n + "/")
            walk(cmp)
            diffs = [x for x in diffs if not x.endswith("README.md")]
            if diffs:
                print("fixtures/uploads-fs differ from a fresh build:\n  " + "\n  ".join(diffs))
                return 1
            print("fixtures/uploads-fs match a fresh build")
            return 0
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
    print(json.dumps(build(OUT)))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
