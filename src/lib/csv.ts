/** بناء سطر CSV آمن: تهريب الاقتباس/الفواصل + تحييد حقن الصيغ. */
export function csvRow(cells: (string | number | null | undefined)[]): string {
  return cells.map((c) => {
    let s = c == null ? '' : String(c);
    // تحييد الصيغ: أي خلية تبدأ بمحرّف تنفيذي في Excel/Sheets تُسبَق باقتباس مفرد
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',');
}

/** نصّ CSV كامل مع BOM (ليقرأ Excel العربية). */
export function csvBody(rows: string[]): string {
  return '﻿' + rows.join('\r\n');
}
