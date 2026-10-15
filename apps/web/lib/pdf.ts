import "server-only";
import PdfPrinter from "pdfmake";
import vfs from "pdfmake/build/vfs_fonts.js";
import type { Decimal } from "@bmg/engine";
import { num, pct } from "./fmt";

/**
 * PDF building blocks (pdfmake, A4 landscape, house number format). Reports are assembled by the phase that needs them
 * (monthly release: 3 pages — ringkasan, bridge, kontrol — in Fase 6; weekly plan: 1 page in Fase 5).
 */

type V = Decimal | null | undefined;

let printer: InstanceType<typeof PdfPrinter> | null = null;
function getPrinter() {
  if (!printer) {
    const f = (n: string) => Buffer.from(vfs[n], "base64");
    printer = new PdfPrinter({
      Roboto: { normal: f("Roboto-Regular.ttf"), bold: f("Roboto-Medium.ttf"), italics: f("Roboto-Italic.ttf"), bolditalics: f("Roboto-MediumItalic.ttf") },
    });
  }
  return printer;
}

export const n0 = (v: V) => num(v ?? null, 0);
export const p1 = (v: V) => (v === null || v === undefined ? "" : pct(v, 1));
const isNeg = (v: V) => !!v && v.isNegative() && !v.isZero();

/** A numeric cell: right-aligned, red only when negative. */
export const cellN = (v: V, f: (x: V) => string = n0) => {
  const text = f(v);
  return { text, alignment: "right", color: isNeg(v) && text.startsWith("-") ? "#c62828" : undefined };
};

const head = (cols: string[], textCols: Set<number>) =>
  cols.map((c, i) => ({ text: c, bold: true, fillColor: "#eef1f6", alignment: i === 0 || textCols.has(i) ? "left" : "right", fontSize: 7 }));

export function table(widths: (string | number)[], header: string[], body: unknown[][], fontSize = 7.5, textCols: number[] = []) {
  return {
    table: { headerRows: 1, widths, body: [head(header, new Set(textCols)), ...body] },
    layout: { hLineWidth: () => 0.4, vLineWidth: () => 0, hLineColor: () => "#d6dae2", paddingTop: () => 1.5, paddingBottom: () => 1.5 },
    fontSize,
    margin: [0, 2, 0, 8],
  };
}

export const h = (text: string) => ({ text, bold: true, fontSize: 9.5, color: "#12355b", margin: [0, 4, 0, 3] });

/** A4 landscape document with the house header/footer; `content` is a pdfmake content array. */
export async function renderPdf(meta: { title: string; status?: string; footer: string }, content: unknown[]): Promise<Buffer> {
  const def = {
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargins: [24, 34, 24, 26],
    defaultStyle: { font: "Roboto", fontSize: 8 },
    header: { columns: [{ text: meta.title, bold: true, fontSize: 9 }, { text: meta.status ?? "", alignment: "right", fontSize: 8 }], margin: [24, 14, 24, 0] },
    footer: (page: number, pages: number) => ({
      columns: [
        { text: `PT Boga Makmur Gracia · ${meta.footer}`, fontSize: 6.5, color: "#7a8396" },
        { text: `${page} / ${pages}`, alignment: "right", fontSize: 6.5, color: "#7a8396" },
      ],
      margin: [24, 6, 24, 0],
    }),
    content,
  };
  const doc = getPrinter().createPdfKitDocument(def);
  const chunks: Buffer[] = [];
  return await new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}
