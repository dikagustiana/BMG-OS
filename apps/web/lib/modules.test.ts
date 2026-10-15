import { describe, expect, it } from "vitest";
import { MODULES, MODULE_KEYS, navFor, parseFlags, type ModuleDef } from "./modules";
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

  it("nav shows only modules that are on and pages the role may see", () => {
    const mods: ModuleDef[] = [
      { key: "b1_ingest", label: "B1", phase: "", description: "", nav: [{ href: "/m/[month]/input", label: "Input", roles: ["finance"] }] },
      { key: "b2_costing", label: "B2", phase: "", description: "", nav: [{ href: "/m/[month]/pool", label: "Pool", roles: "all" }] },
    ];
    const off = parseFlags([]);
    expect(navFor("finance", off, mods)).toEqual([]);
    const on = parseFlags([{ key: "b1_ingest", value: true }, { key: "b2_costing", value: true }]);
    expect(navFor("finance", on, mods).map((n) => n.label)).toEqual(["Input", "Pool"]);
    expect(navFor("management", on, mods).map((n) => n.label)).toEqual(["Pool"]);
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
