#!/usr/bin/env python3
"""
Synthesize the Sep-26 upload fixtures for Fase 1 (PLAN v1 Fase 1; open-questions B-011).

    python3 -I scripts/make_upload_fixtures.py           # write fixtures/uploads/2026-09/
    python3 -I scripts/make_upload_fixtures.py --check   # rebuild to a temp dir and fail if fixtures/uploads differs (CI)

The source files the PLAN names for Fase 1 (Accurate GL per voucher, Inventory Valuation, LK Sep-26, CoGM R1) are not
in reference/. Every number those files would carry for September is, however, pasted into WP Sep26_4 (blue input
cells with a "Sumber" note). This script rebuilds upload files from those cells (fixtures/month-2026-09/cells.csv,
itself a copy of the WP), in the column layout the parsers accept (Accurate labels / BMG templates). Each row names
the WP cell it comes from in a "Sumber WP" column, which the parsers ignore.

Rules:
- Numbers are copied as the decimal strings in cells.csv. The only arithmetic: GL 5101-016 split into the voucher
  groups of BIAYA BERSAMA bagian 8 (remainder = balance − tagged vouchers), the second tali asih journal
  (bagian 9 total − MJ26090010), the FCC Sales by Item split (KW 2 at NRV, the rest on FG-001; WP holds only the sum),
  and Average Price = card value ÷ card qty (REKON MATERIAL), rounded to 4 decimals. Each is noted in README.md.
- Output is deterministic: CSV with \\n line ends; xlsx written by openpyxl, then re-zipped uncompressed with fixed
  timestamps and fixed document properties, so the bytes only change when a value changes.
"""
from __future__ import annotations

import csv
import datetime as dt
import filecmp
import io
import json
import os
import re
import shutil
import sys
import tempfile
import zipfile
from decimal import ROUND_HALF_UP, Decimal

import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CELLS = os.path.join(ROOT, "fixtures", "month-2026-09", "cells.csv")
MASTER = os.path.join(ROOT, "fixtures", "master")
OUT_REL = os.path.join("fixtures", "uploads", "2026-09")
FIXED = dt.datetime(2026, 10, 1, 0, 0, 0)
ZIP_TIME = (2026, 10, 1, 0, 0, 0)


# ----------------------------------------------------------------------------------------------- WP cells

class Cells:
    def __init__(self, path: str):
        self.v: dict[tuple[str, str], tuple[str, str]] = {}
        with open(path, encoding="utf-8", newline="") as f:
            for r in csv.DictReader(f):
                self.v[(r["sheet"], r["cell"])] = (r["type"], r["value"])

    def get(self, sheet: str, ref: str) -> str | None:
        x = self.v.get((sheet, ref))
        return None if x is None else x[1]

    def num(self, sheet: str, ref: str) -> str:
        x = self.v.get((sheet, ref))
        if x is None:
            return "0"
        if x[0] != "n":
            raise ValueError(f"{sheet}!{ref} is not a number: {x[1]!r}")
        return x[1]

    def text(self, sheet: str, ref: str) -> str:
        return (self.get(sheet, ref) or "").strip()

    def rows(self, sheet: str) -> int:
        return max(int(re.match(r"[A-Z]+(\d+)", c).group(1)) for (s, c) in self.v if s == sheet)

    def find_row(self, sheet: str, label: str, start: int = 1, end: int | None = None, col: str = "A") -> int:
        """First row in [start, end] whose column `col` text starts with `label` (case-insensitive)."""
        end = end or self.rows(sheet)
        for r in range(start, end + 1):
            if self.text(sheet, f"{col}{r}").lower().startswith(label.lower()):
                return r
        raise KeyError(f"{sheet}: '{label}' not found in {col}{start}:{col}{end}")


def D(s: str | None) -> Decimal:
    return Decimal(s or "0")


def q(x: Decimal, places: str) -> str:
    return format(x.quantize(Decimal(places), rounding=ROUND_HALF_UP), "f")


def plain(x: Decimal) -> str:
    s = format(x, "f")
    return s.rstrip("0").rstrip(".") if "." in s else s


def master(name: str) -> list[dict]:
    with open(os.path.join(MASTER, f"{name}.json"), encoding="utf-8") as f:
        return json.load(f)["rows"]


# ----------------------------------------------------------------------------------------------- writers

def write_csv(path: str, header: list[str], rows: list[list]) -> None:
    with open(path, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(header)
        for r in rows:
            w.writerow(["" if v is None else v for v in r])


def xl_value(v):
    """Numbers go into xlsx as numbers (the double of the decimal string, like Excel), text as text."""
    if isinstance(v, Decimal):
        return float(v)
    if isinstance(v, str) and re.fullmatch(r"-?\d+(\.\d+)?", v):
        return float(v)
    return v


def write_xlsx(path: str, sheets: list[tuple[str, list[list], list[str], list[list]]]) -> None:
    """sheets: (name, preamble rows, header, rows). Re-zipped deterministically (stored, fixed timestamps)."""
    wb = openpyxl.Workbook()
    wb.remove(wb.active)
    for name, pre, header, rows in sheets:
        ws = wb.create_sheet(name)
        for r in pre:
            ws.append(r)
        ws.append(header)
        for r in rows:
            ws.append([xl_value(v) for v in r])
    wb.properties.creator = "scripts/make_upload_fixtures.py"
    wb.properties.lastModifiedBy = None
    wb.properties.created = FIXED
    wb.properties.modified = FIXED
    buf = io.BytesIO()
    wb.save(buf)
    src = zipfile.ZipFile(io.BytesIO(buf.getvalue()))
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_STORED) as dst:
        for name in sorted(src.namelist()):
            info = zipfile.ZipInfo(name, date_time=ZIP_TIME)
            info.compress_type = zipfile.ZIP_STORED
            info.external_attr = 0o644 << 16
            data = src.read(name)
            if name == "docProps/core.xml":  # openpyxl stamps "modified" with the save time
                data = re.sub(rb"(<dcterms:modified[^>]*>)[^<]*", rb"\g<1>2026-10-01T00:00:00Z", data)
            dst.writestr(info, data)


# ----------------------------------------------------------------------------------------------- GL + tags

BB = "BIAYA BERSAMA"
ACCURATE_PRE = [["PT Boga Makmur Gracia"], ["Buku Besar (Rincian per Akun)"], ["Periode 01 Sep 2026 s/d 30 Sep 2026"], []]


def vouchers(cell_text: str) -> str:
    """'GL Accurate Sep 2026: MJ26090052' → 'MJ26090052'; keeps comma-separated lists; 'periode …' notes dropped."""
    s = re.sub(r"^GL Accurate Sep 2026:\s*", "", cell_text).strip()
    return s.split(";")[0].strip()


TAG_ROWS = {  # BIAYA BERSAMA bagian 8 row → tag (rows 144–155)
    144: "reklas_opex", 145: "reklas_opex", 146: "reklas_opex", 147: "reklas_opex",
    148: "thr_swap", 149: "thr_swap", 150: "tali_asih_cutoff", 151: "tali_asih_cutoff",
    152: "ongkir_singkong", 153: "ongkir_singkong", 154: "pisau_urschel", 155: "pisau_urschel",
}


def target_pool(text: str) -> tuple[str, str | None]:
    t = text.lower()
    if t.startswith("material fcc"):
        return "MATERIAL", "FCC"
    if t.startswith("thr"):
        return "THR", None
    m = re.match(r"grup ([a-e])\b", t)
    if m:
        return m.group(1).upper(), None
    raise ValueError(f"unknown pool text {text!r}")


def gl_and_tags(c: Cells) -> tuple[list[list], list[list]]:
    names = {c.text(BB, f"A{r}"): c.text(BB, f"B{r}") for r in range(7, 23)}
    balance = {c.text(BB, f"A{r}"): D(c.num(BB, f"C{r}")) for r in range(7, 23)}
    tags, gl = [], []
    tagged: dict[str, Decimal] = {}
    for r, tag in TAG_ROWS.items():
        amt = D(c.num(BB, f"C{r}"))
        if amt == 0:
            continue  # "Tidak ada transaksi"
        acct, desc, pool_text, src = c.text(BB, f"A{r}"), c.text(BB, f"B{r}"), c.text(BB, f"D{r}"), c.text(BB, f"F{r}")
        pool, line = target_pool(pool_text)
        v = vouchers(src)
        tags.append([v, acct, plain(amt), tag, pool, line, desc, f"BIAYA BERSAMA!A{r}:F{r}"])
        # GL rows behind the reclass-out lines (amount < 0 = the voucher booked on that account this month)
        if acct.startswith("5101-") and amt < 0 and tag in ("ongkir_singkong", "pisau_urschel"):
            tagged[acct] = tagged.get(acct, Decimal(0)) - amt
            gl.append(["2026-09-30", v, desc, acct, names[acct], plain(-amt), "0", f"BIAYA BERSAMA!C{r}, F{r}"])
    # opex accounts reclassed into the plant (bagian 8, positive lines on 6xxx accounts)
    for r in (144, 145, 146, 147, 148):
        acct, desc = c.text(BB, f"A{r}"), c.text(BB, f"B{r}")
        gl.append(["2026-09-30", vouchers(c.text(BB, f"F{r}")), desc, acct, None, plain(D(c.num(BB, f"C{r}"))), "0",
                   f"BIAYA BERSAMA!C{r}, F{r}"])
    # 5101-002 per journal (bagian 9); the tali asih total is two journals (MJ26090010 = cut-off line 150)
    upah, staf, tali = D(c.num(BB, "C164")), D(c.num(BB, "C165")), D(c.num(BB, "C166"))
    tali_out = -D(c.num(BB, "C150"))
    gl += [
        ["2026-09-30", "MJ26090061", "Upah harian (jurnal upah langsung)", "5101-002", names["5101-002"], plain(upah), "0", "BIAYA BERSAMA!C164, F164"],
        ["2026-09-30", "MJ26090065", "Gaji staf pabrik (jurnal COGS)", "5101-002", names["5101-002"], plain(staf), "0", "BIAYA BERSAMA!C165, F165"],
        ["2026-09-30", "MJ26090010", "Tali asih bulan jasa Agustus", "5101-002", names["5101-002"], plain(tali_out), "0", "BIAYA BERSAMA!C150, F150"],
        ["2026-09-30", "MJ26090026", "Tali asih bulan jasa September", "5101-002", names["5101-002"], plain(tali - tali_out), "0",
         "BIAYA BERSAMA!C166 − C150 (sintetis: sisa jurnal tali asih)"],
        ["2026-09-30", "MJ26090028", "THR kantor yang dibukukan di HPP", "5101-003", names["5101-003"], plain(balance["5101-003"]), "0",
         "BIAYA BERSAMA!C8, C149, F149"],
    ]
    for acct, bal in balance.items():
        if acct in ("5101-002", "5101-003") or bal == 0:
            continue
        rest = bal - tagged.get(acct, Decimal(0))
        if rest != 0:
            note = "saldo mutasi Sep-26" if acct not in tagged else "sisa mutasi setelah voucher bagian 8 (sintetis)"
            gl.append(["2026-09-30", f"SALDO-{acct}", note, acct, names[acct], plain(rest), "0",
                       f"BIAYA BERSAMA!C{[r for r in range(7, 23) if c.text(BB, f'A{r}') == acct][0]}"])
    gl.sort(key=lambda r: (r[3], r[1]))
    return gl, tags


# ----------------------------------------------------------------------------------------------- payroll

def payroll(c: Cells) -> tuple[list[list], list[list]]:
    rekap = []
    for r in range(28, 42):
        rekap.append([c.text(BB, f"A{r}"), c.text(BB, f"B{r}"), plain(D(c.num(BB, f"C{r}"))), f"BIAYA BERSAMA!A{r}:C{r}"])
    tali_out = -D(c.num(BB, "C150"))
    jurnal = [
        ["Upah harian", "MJ26090061", plain(D(c.num(BB, "C164"))), "BIAYA BERSAMA!C164"],
        ["Gaji staf", "MJ26090065", plain(D(c.num(BB, "C165"))), "BIAYA BERSAMA!C165"],
        ["Tali asih", "MJ26090010", plain(tali_out), "BIAYA BERSAMA!C150"],
        ["Tali asih", "MJ26090026", plain(D(c.num(BB, "C166")) - tali_out), "BIAYA BERSAMA!C166 − C150"],
    ]
    return rekap, jurnal


# ----------------------------------------------------------------------------------------------- inventory valuation

RM = "REKON MATERIAL"
RP = "REKON PERSEDIAAN"


def inventory(c: Cells) -> list[list]:
    rows = []
    for r in range(7, 61):
        note = c.text(RM, f"O{r}")
        m = re.search(r"Inventory Valuation (BB-\d+)", note)
        if not m or note.startswith("tidak ada"):
            continue
        usage = D(c.num(RM, f"L{r}"))
        rows.append([m.group(1), c.text(RM, f"A{r}"), "1106-001", None, plain(D(c.num(RM, f"I{r}"))), None,
                     plain(D(c.num(RM, f"J{r}"))), None, None, None, plain(-usage), None, plain(D(c.num(RM, f"K{r}"))),
                     f"REKON MATERIAL!I{r}:L{r}, O{r}"])
    end = c.find_row(RP, "Total", 55)
    for r in range(55, end):
        code = c.text(RP, f"A{r}")
        if not code:
            continue
        name = c.text(RP, f"B{r}")
        rows.append([code, None if name.startswith("(nama tidak tercantum") else name, c.text(RP, f"C{r}"),
                     plain(D(c.num(RP, f"E{r}"))), plain(D(c.num(RP, f"F{r}"))), None, None, None, None, None, None,
                     plain(D(c.num(RP, f"G{r}"))), plain(D(c.num(RP, f"H{r}"))), f"REKON PERSEDIAAN!A{r}:H{r}"])
    return rows


# ----------------------------------------------------------------------------------------------- sales, prices

def lampiran(c: Cells, sheet: str, title: str) -> tuple[int, int]:
    """Rows of a LAMPIRAN block: (first data row, last data row)."""
    start = c.find_row(sheet, title) + 2
    end = start
    while c.text(sheet, f"A{end + 1}") and not c.text(sheet, f"A{end + 1}").startswith(("Total", "LAMPIRAN")):
        end += 1
    return start, end


def lamp_a(c: Cells, sheet: str, label: str) -> str:
    s, e = lampiran(c, sheet, "LAMPIRAN A")
    return c.num(sheet, f"C{c.find_row(sheet, label, s, e)}")


def lamp_a_row(c: Cells, sheet: str, label: str) -> int:
    s, e = lampiran(c, sheet, "LAMPIRAN A")
    return c.find_row(sheet, label, s, e)


def sales(c: Cells) -> list[list]:
    nrv = D(c.num("FCC", "C209"))
    kw2_kg = D(c.num("FCC", "C208"))
    kw2_amt = (kw2_kg * nrv).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    fcc_total = D(c.num("FCC", "C211"))
    rows = [
        ["FG-001", "Keripik Singkong Tanpa Bumbu", c.num("FCC", "C203"), "kg", plain(fcc_total - kw2_amt), "IFM",
         "FCC!C203, C211 − baris FG-015 (sintetis: WP hanya mencatat jumlah FG-001 + 2nd Grade Tawar)"],
        ["FG-015", "2nd Grade Tawar", c.num("FCC", "C208"), "kg", q(kw2_amt, "0.01"), "KGS",
         "FCC!C208 × C209 (sintetis: kg × NRV KW 2)"],
        ["WIP-139", "Keripik Ubi Ungu (QKSP)", lamp_a(c, "UU", "Penjualan"), "kg", lamp_a(c, "UU", "Pendapatan"), "KGS",
         f"UU!C{lamp_a_row(c, 'UU', 'Penjualan')}, C{lamp_a_row(c, 'UU', 'Pendapatan')}"],
        ["WIP-138", "Keripik Ubi Orange (QKSO)", lamp_a(c, "UO", "Penjualan"), "kg", lamp_a(c, "UO", "Pendapatan"), "KGS",
         f"UO!C{lamp_a_row(c, 'UO', 'Penjualan')}, C{lamp_a_row(c, 'UO', 'Pendapatan')}"],
    ]
    groups = {g["code"]: g for g in master("others_group")}
    for s in master("sku"):
        grp = "maklon" if groups[s["others_group_code"]]["main_line"] == "maklon" else "retail"
        if s["wp_sheet"] == "KOPERASI":
            col = koperasi_col(c, s["name"])
            qty, amt = D(c.num("KOPERASI", f"{col}135")), D(c.num("KOPERASI", f"{col}136"))
            src = f"KOPERASI!{col}135:{col}136"
        else:
            sh = s["wp_sheet"]
            qty, amt = D(lamp_a(c, sh, "Penjualan menurut Sales By Item")), D(lamp_a(c, sh, "Pendapatan"))
            src = f"{sh}!C{lamp_a_row(c, sh, 'Penjualan menurut Sales By Item')}, C{lamp_a_row(c, sh, 'Pendapatan')}"
        if qty == 0 and amt == 0:
            continue
        rows.append([s["code"], s["name"], plain(qty), s["fg_unit"], plain(amt), grp, src])
    no_card = D(c.num("LAIN-LAIN", "H92"))
    rows.append([None, "Produk lain tanpa kartu bulan ini", None, None, plain(no_card), "retail",
                 "LAIN-LAIN!H92 (sintetis: satu baris untuk produk tanpa kartu)"])
    return rows


def koperasi_col(c: Cells, sku_name: str) -> str:
    for col in "BCDEFGHIJKL":
        if c.text("KOPERASI", f"{col}121") == sku_name:
            return col
    raise KeyError(f"KOPERASI column for {sku_name!r}")


def average_prices(c: Cells) -> list[list]:
    rows = []
    for r in range(7, 61):
        qty, val = D(c.num(RM, f"C{r}")), D(c.num(RM, f"H{r}"))
        if qty == 0 or val == 0:
            continue
        rows.append([c.text(RM, f"A{r}"), c.text(RM, f"B{r}"), q(val / qty, "0.0001"), f"REKON MATERIAL!H{r} ÷ C{r}"])
    return rows


# ----------------------------------------------------------------------------------------------- CoGM card (template)

PRODUCT_A = [  # LAMPIRAN A label → row_kind (FCC/UU/UO)
    ("WIP awal (curah)", "wip_open"), ("Produksi bulan ini", "input"), ("WIP akhir (curah)", "wip_close"),
    ("KW 2", "kw2"), ("Keripik waste", "waste"),
]
PRODUCT_D = [("Man-hour", "man_hour"), ("Pemakaian listrik", "kwh")]


def card(c: Cells) -> tuple[list[list], list[list], list[list]]:
    qty, mat, drv = [], [], []
    machine_col = {"FCC": "C", "UU": "D", "UO": "E"}
    for p in ("FCC", "UU", "UO"):
        for label, kind in PRODUCT_A:
            r = lamp_a_row(c, p, label)
            qty.append([p, kind, c.num(p, f"C{r}"), "kg", f"{p}!C{r}"])
        r = c.find_row(p, "Premium ke barang jadi")
        qty.append([p, "premium", c.num(p, f"B{r}"), "kg", f"{p}!B{r}"])
        s, e = lampiran(c, p, "LAMPIRAN B")
        for r in range(s, e + 1):
            mat.append([p, c.text(p, f"A{r}"), c.text(p, f"B{r}"), c.num(p, f"D{r}"), c.text(p, f"E{r}"),
                        c.num(p, f"F{r}"), c.num(p, f"G{r}"), f"{p}!A{r}:G{r}"])
        for label, drv_kind in PRODUCT_D:
            r = lamp_a_row(c, p, label)
            drv.append([p, drv_kind, c.num(p, f"C{r}"), "tidak", f"{p}!C{r}"])
        r = lamp_a_row(c, p, "Kg ")
        drv.append([p, "kg_peeled", c.num(p, f"C{r}"), "tidak", f"{p}!C{r}"])
        # D11 / Q16: UU machine hours are derived from its kWh share (BIAYA BERSAMA D171 = 27,15), not measured
        drv.append([p, "machine_hour", c.num(BB, f"{machine_col[p]}171"), "ya" if p == "UU" else "tidak", f"BIAYA BERSAMA!{machine_col[p]}171"])
    drv.append(["PABRIK", "hours_paid", c.num(BB, "C105"), "tidak", "BIAYA BERSAMA!C105 (jam operator Unit I dibayar)"])
    drv.append(["LAIN", "machine_hour", c.num(BB, "F171"), "tidak", "BIAYA BERSAMA!F171 (Ubi putih ACE)"])
    # Lain-lain: one line per SKU sheet (line = SKU code); KOPERASI per column
    for s in master("sku"):
        sh, code = s["wp_sheet"], s["code"]
        if sh == "KOPERASI":
            col = koperasi_col(c, s["name"])
            out = D(c.num("KOPERASI", f"{col}122"))
            if out == 0:
                continue
            qty.append([code, "output", plain(out), "kg", f"KOPERASI!{col}122"])
            drv.append([code, "man_hour", c.num("KOPERASI", f"{col}125"), "tidak", f"KOPERASI!{col}125"])
            for r in range(143, 168):
                qv, vv = D(c.num("KOPERASI", f"{col}{r}")), D(c.num("KOPERASI", f"{col}{r + 27}"))
                if qv == 0 and vv == 0:
                    continue
                mat.append([code, c.text("KOPERASI", f"A{r}"), c.text("KOPERASI", f"N{r}"), plain(qv), None, None, plain(vv),
                            f"KOPERASI!{col}{r}, {col}{r + 27}"])
            continue
        out_kg = D(lamp_a(c, sh, "Output produksi"))
        if out_kg == 0:
            continue
        s_a, e_a = lampiran(c, sh, "LAMPIRAN A")
        seen: set[str] = set()
        for r in range(s_a, e_a + 1):
            label, unit = c.text(sh, f"A{r}"), c.text(sh, f"B{r}")
            kind = "output" if label.startswith("Output produksi") else "sample" if label.startswith("Sampel") else None
            if kind:  # first row = kg (kartu E7/E10), second = FG units (kartu E6/E9; kg for Ubi putih ACE)
                kind = f"{kind}_fg" if kind in seen else kind
                seen.add(kind.removesuffix("_fg"))
                qty.append([code, kind, c.num(sh, f"C{r}"), unit, f"{sh}!C{r}"])
            elif label.startswith("Man-hour"):
                drv.append([code, "man_hour", c.num(sh, f"C{r}"), "tidak", f"{sh}!C{r}"])
            elif label.startswith("Pemakaian listrik"):
                drv.append([code, "kwh", c.num(sh, f"C{r}"), "tidak", f"{sh}!C{r}"])
            elif label.startswith("Jam mesin"):
                drv.append([code, "machine_hour", c.num(sh, f"C{r}"), "tidak", f"{sh}!C{r}"])
        for label, kind in (("Input FCC premium", "input_fcc_premium"), ("Input KW 2 FCC", "input_kw2_fcc"), ("Input KW 2 ubi", "input_kw2_ubi")):
            r = c.find_row(sh, label)
            if D(c.num(sh, f"B{r}")) != 0:
                qty.append([code, kind, c.num(sh, f"B{r}"), "kg", f"{sh}!B{r}"])
        s_b, e_b = lampiran(c, sh, "LAMPIRAN B")
        for r in range(s_b, e_b + 1):
            mat.append([code, c.text(sh, f"A{r}"), c.text(sh, f"B{r}"), c.num(sh, f"C{r}"), c.text(sh, f"D{r}"),
                        c.num(sh, f"E{r}"), c.num(sh, f"F{r}"), f"{sh}!A{r}:F{r}"])
    return qty, mat, drv


# ----------------------------------------------------------------------------------------------- LK control figures

FS_KEYS = ["revenue_4101_007", "material_usage", "conversion_16", "cogs", "inv_1106_001_close",
           "inv_1106_002_open", "inv_1106_002_close", "inv_1106_003_open", "inv_1106_003_close"]


def fs_control(c: Cells) -> list[list]:
    return [[k, c.text("RINGKASAN", f"A{58 + i}"), c.num("RINGKASAN", f"B{58 + i}"), f"RINGKASAN!B{58 + i}; {c.text('RINGKASAN', f'C{58 + i}')}"]
            for i, k in enumerate(FS_KEYS)]


# ----------------------------------------------------------------------------------------------- standard (example)

def std_example(c: Cells) -> list[tuple[str, list[list], list[str], list[list]]]:
    """A Sep-26-only example of the std_master template (not standard v1, which is Fase 5a: average Jul–Sep, Q6)."""
    pre = [["Template master standar BMG — contoh dari aktual Sep-26 (bukan standar v1)"], ["Kode versi", "STD-CONTOH-SEP26"],
           ["Berlaku mulai", "2026-10-05"], []]
    bom = []
    for p in ("FCC", "UU", "UO"):
        prod = D(c.num(p, f"C{lamp_a_row(c, p, 'Produksi bulan ini')}"))
        s, e = lampiran(c, p, "LAMPIRAN B")
        for r in range(s, e + 1):
            qv = D(c.num(p, f"D{r}"))
            if qv == 0:
                continue
            bom.append([p, c.text(p, f"A{r}"), c.text(p, f"E{r}"), q(qv / prod, "0.00000001"), "0.85", "1.15"])
    mix, routing = [], []
    for p in ("FCC", "UU", "UO"):
        prod = D(c.num(p, f"C{lamp_a_row(c, p, 'Produksi bulan ini')}"))
        k = {kind: D(c.num(p, f"C{lamp_a_row(c, p, label)}")) for label, kind in PRODUCT_A}
        total = k["wip_open"] + k["input"]
        prem = total - k["kw2"] - k["waste"] - k["wip_close"]
        mix.append([p, q(prem / total, "0.00000001"), q(k["kw2"] / total, "0.00000001"), q(k["waste"] / total, "0.00000001"),
                    q(k["wip_close"] / total, "0.00000001")])
        mh = D(c.num(p, f"C{lamp_a_row(c, p, 'Man-hour')}"))
        kwh = D(c.num(p, f"C{lamp_a_row(c, p, 'Pemakaian listrik')}"))
        mach = D(c.num(BB, {"FCC": "C171", "UU": "D171", "UO": "E171"}[p]))
        tons = prod / 1000
        routing.append([p, "Produksi", q(mh / tons, "0.0001"), q(mach / tons, "0.0001"), q(kwh / tons, "0.0001")])
    rates = []
    for r, pool, driver, drow in ((81, "A", "man_hour", 91), (82, "KUPAS", "kg_peeled", 92), (83, "B", "man_hour", 91),
                                  (84, "C", "kwh", 93), (85, "D", "kwh", 93), (86, "E", "material_value", 94)):
        base = D(c.num(BB, f"G{drow}"))
        var, fixed = D(c.num(BB, f"E{r}")), D(c.num(BB, f"D{r}"))
        rates.append([pool, driver, q(var / base, "0.0001"), q(fixed / base, "0.0001"), q(fixed, "0.01")])
    cap = [["2026-10-05", "Unit I", None, None, "6", None, q(D(c.num(BB, "C105")) * 7 / 30, "0.01")]]
    return [
        ("BOM", pre, ["Produk", "Kategori material", "Satuan", "Qty per kg input", "Pita bawah", "Pita atas"], bom),
        ("Mix", pre, ["Produk", "Premium %", "KW 2 %", "Waste %", "WIP %"], mix),
        ("Routing", pre, ["Produk", "Departemen", "Jam per ton", "Jam mesin per ton", "kWh per ton"], routing),
        ("Tarif", pre, ["Pool", "Driver", "Tarif variabel", "Tarif tetap", "Biaya tetap per bulan"], rates),
        ("Kapasitas", pre, ["Minggu mulai", "Departemen", "Headcount", "Jam shift", "Hari kerja", "Jam mesin", "Kapasitas normal (jam)"], cap),
    ]


# ----------------------------------------------------------------------------------------------- build

def build(root: str) -> dict:
    c = Cells(CELLS)
    out = os.path.join(root, OUT_REL)
    os.makedirs(out, exist_ok=True)
    gl, tags = gl_and_tags(c)
    write_xlsx(os.path.join(out, "gl_month.xlsx"), [("Buku Besar", ACCURATE_PRE,
        ["Tanggal", "No. Sumber", "Keterangan", "No. Akun", "Nama Akun", "Debit", "Kredit", "Sumber WP"], gl)])
    write_csv(os.path.join(out, "gl_voucher_tag.csv"),
              ["Voucher", "Akun", "Jumlah", "Tag", "Pool tujuan", "Lini", "Catatan", "Sumber WP"], tags)
    rekap, jurnal = payroll(c)
    write_xlsx(os.path.join(out, "payroll_month.xlsx"), [
        ("Rekap", [["Rekap payroll per kelompok — September 2026"], []], ["Kelompok", "Unit / Departemen", "Jumlah", "Sumber WP"], rekap),
        ("Jurnal", [["Jurnal 5101-002 — September 2026"], []], ["Jenis", "Voucher", "Jumlah", "Sumber WP"], jurnal),
    ])
    inv = inventory(c)
    write_xlsx(os.path.join(out, "inventory_valuation.xlsx"), [("Rincian Valuasi", [["Rincian Valuasi Persediaan"], ["1 Sep 2026 s/d 30 Sep 2026"], []],
        ["Kode Barang", "Nama Barang", "Akun", "Kts. Awal", "Nilai Awal", "Kts. Masuk", "Nilai Masuk", "Kts. Keluar",
         "Nilai Keluar", "Kts. Penyesuaian", "Nilai Penyesuaian", "Kts. Akhir", "Nilai Akhir", "Sumber WP"], inv)])
    sal = sales(c)
    write_xlsx(os.path.join(out, "sales_by_item.xlsx"), [("Sales By Item", [["Penjualan per Barang"], ["September 2026"], []],
        ["Kode Barang", "Nama Barang", "Kuantitas", "Satuan", "Jumlah", "Grup Pelanggan", "Sumber WP"], sal)])
    ap = average_prices(c)
    write_xlsx(os.path.join(out, "average_price.xlsx"), [("Average Price", [["Average Price September 2026"], []],
        ["Nama Barang", "Satuan", "Harga Rata-rata", "Sumber WP"], ap)])
    qty, mat, drv = card(c)
    write_xlsx(os.path.join(out, "cogm_card.xlsx"), [
        ("Kuantitas", [["Kartu CoGM — template BMG — September 2026"], []], ["Lini", "Jenis", "Qty", "Satuan", "Sumber WP"], qty),
        ("Material", [["Material per lini"], []], ["Lini", "Material", "Kelompok", "Qty", "Satuan", "Harga kartu", "Nilai kartu", "Sumber WP"], mat),
        ("Driver", [["Driver per lini"], []], ["Lini", "Driver", "Nilai", "Estimasi", "Sumber WP"], drv),
    ])
    fs = fs_control(c)
    write_csv(os.path.join(out, "fs_control.csv"), ["Kunci", "Pos", "Nilai", "Sumber WP"], fs)
    write_xlsx(os.path.join(out, "std_master.xlsx"), std_example(c))
    return {"gl_month": len(gl), "gl_voucher_tag": len(tags), "payroll_rekap": len(rekap), "payroll_jurnal": len(jurnal),
            "inventory_valuation": len(inv), "sales_by_item": len(sal), "average_price": len(ap),
            "cogm_card": {"kuantitas": len(qty), "material": len(mat), "driver": len(drv)}, "fs_control": len(fs)}


def main(argv: list[str]) -> int:
    if "--check" in argv:
        tmp = tempfile.mkdtemp()
        try:
            build(tmp)
            a, b = os.path.join(ROOT, OUT_REL), os.path.join(tmp, OUT_REL)
            cmp = filecmp.dircmp(a, b)
            diffs = [x for x in cmp.left_only + cmp.right_only + cmp.diff_files if x != "README.md"]
            diffs += [x for x in cmp.common_files if x != "README.md" and not filecmp.cmp(os.path.join(a, x), os.path.join(b, x), shallow=False)]
            if diffs:
                print("upload fixtures differ from a fresh build:\n  " + "\n  ".join(sorted(set(diffs))))
                return 1
            print("upload fixtures match a fresh build from fixtures/month-2026-09/cells.csv")
            return 0
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
    print(json.dumps(build(ROOT), indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
