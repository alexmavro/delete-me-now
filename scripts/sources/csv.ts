/**
 * Tiny CSV parser. RFC-4180 quoted-field aware (handles `"a,b","c""d"`).
 * Returns header-keyed records. No streaming, fine for the broker
 * registries which are <10k rows.
 *
 * We don't pull a CSV dep here because the package gets bundled into
 * scripts only — but staying zero-dep on the build side keeps the
 * runtime trust boundary clean (no transitive supply-chain surface in
 * the import path).
 */

export type CsvRow = Record<string, string>;

export function parseCsv(text: string): CsvRow[] {
  const rows = splitRows(text);
  if (rows.length === 0) return [];
  const headers = rows[0].map(normalize);
  const out: CsvRow[] = [];
  // Surface column-count mismatches at most once — a single bad row from
  // unbalanced quotes typically misaligns every subsequent row, so flooding
  // the log helps no-one. Curator gets a single line saying "look at row N".
  let mismatchWarned = false;
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i];
    if (cells.length === 1 && cells[0] === '') continue; // skip blank lines
    if (cells.length !== headers.length) {
      // Skip the misaligned row entirely. Filling shifted cells would emit
      // a row with `email` populated from the `country` column etc., which
      // is worse than dropping it. Warn once so the curator notices but
      // doesn't drown in N copies of the same diagnosis.
      if (!mismatchWarned) {
        console.warn(
          `parseCsv: row ${i + 1} has ${cells.length} cells, expected ${headers.length} — column data may have shifted (CSV quoting / missing column?). Skipping misaligned rows.`,
        );
        mismatchWarned = true;
      }
      continue;
    }
    const rec: CsvRow = {};
    for (let j = 0; j < headers.length; j++) {
      rec[headers[j]] = (cells[j] ?? '').trim();
    }
    out.push(rec);
  }
  return out;
}

function normalize(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '');
}

// Tail-flush behaviour: a file ending mid-cell is preserved as a final
// partial row (so we don't lose the last broker if the AG's CSV omits
// its trailing newline); a file ending with a clean newline produces
// no phantom empty trailing row because the loop only flushes when
// `cell !== '' || row.length > 0`.
function splitRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuote) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } // escaped quote
        else inQuote = false;
      } else {
        cell += c;
      }
    } else if (c === '"') {
      inQuote = true;
    } else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++; // CRLF
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += c;
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}
