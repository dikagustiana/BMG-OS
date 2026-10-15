import { describe, expect, it } from "vitest";
import { homeFor, MODULES, MODULE_KEYS, navFor, PAGES, parseFlags, userType } from "./modules";
import { can, ROLES } from "./roles";

describe("module flags", () => {
  it("every flag defaults to off; only boolean true turns a module on", () => {
    const f = parseFlags([{ key: "b1_ingest", value: true }, { key: "b2_costing", value: "true" }, { key: "x", value: true }]);
    expect(f.b1_ingest).toBe(true);
    expect(f.b2_costing).toBe(false);
    expect(Object.keys(f).sort()).toEqual([...MODULE_KEYS].sort());
    expect(Object.values(parseFlags([])).every((v) => v === false)).toBe(true);
  });

  it("registry covers every key exactly once", () => {
    expect(MODULES.map((m) => m.key).sort()).toEqual([...MODULE_KEYS].sort());
  });
});

describe("navigation per user type (PRD v2 §7)", () => {
  const all = parseFlags(MODULE_KEYS.map((key) => ({ key, value: true })));
  const off = parseFlags([]);
  it("four user types plus admin", () => {
    expect(ROLES.map((r) => `${r}:${userType(r)}`)).toEqual([
      "admin:admin", "finance:penyusun", "cost_accounting:penyusun", "ppic:perencana", "production:pabrik", "warehouse:pabrik",
      "engineering:pabrik", "purchasing:perencana", "sales:perencana", "management:direksi",
    ]);
  });
  it("Direksi menu order; management needs b6_management", () => {
    expect(navFor("management", all).map((p) => p.label)).toEqual([
      "Kinerja", "Biaya per kg", "Lain-lain & SKU", "Neraca & BP", "Modal kerja & kas", "Cek & kewajaran", "Rekonsiliasi", "Mingguan & outlook",
    ]);
    expect(navFor("management", { ...all, b6_management: false })).toEqual([]);
    expect(navFor("finance", { ...all, b6_management: false }).map((p) => p.key)).toContain("kinerja");
  });
  it("homes: Direksi Kinerja, pabrik Shift, perencana Rencana, penyusun Input, admin Pengaturan", () => {
    expect(["management", "production", "ppic", "finance", "admin"].map((r) => homeFor(r as never, all)?.key)).toEqual(["kinerja", "shift", "rencana", "input", "pengaturan"]);
  });
  it("modules off: no module pages; admin keeps Pengaturan and Audit", () => {
    expect(navFor("admin", off).map((p) => p.key)).toEqual(["pengaturan", "audit"]);
    expect(navFor("production", off)).toEqual([]);
    expect(homeFor("production", off)).toBeNull();
  });
  it("no page shows a table name or phase in its label", () => {
    for (const p of PAGES) expect(p.label).not.toMatch(/_|fase|phase/i);
  });
});

describe("roles (PRD §2)", () => {
  it("has the ten roles", () => {
    expect(ROLES).toHaveLength(10);
  });
  it("write areas", () => {
    expect(can("admin", "module_flags")).toBe(true);
    expect(can("finance", "module_flags")).toBe(false);
    expect(can("finance", "release")).toBe(true);
    expect(can("cost_accounting", "release")).toBe(false);
    expect(can("ppic", "std_draft")).toBe(true);
    expect(can("ppic", "std_approve")).toBe(false);
    expect(can("production", "day_lock")).toBe(true);
    expect(can("management", "upload_finance")).toBe(false);
    for (const r of ROLES) expect(can(r, "users")).toBe(r === "admin");
  });
});
