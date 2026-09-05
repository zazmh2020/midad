import { describe, it, expect } from 'vitest';
import { csvRow, csvBody } from './csv';

describe('csvRow', () => {
  it('passes normal values through unchanged', () => {
    expect(csvRow(['عبدالله سلمان', '0501234567', 5])).toBe('عبدالله سلمان,0501234567,5');
  });

  it('quotes values containing commas, quotes or newlines', () => {
    expect(csvRow(['a,b'])).toBe('"a,b"');
    expect(csvRow(['say "hi"'])).toBe('"say ""hi"""');
    expect(csvRow(['line1\nline2'])).toBe('"line1\nline2"');
  });

  it('neutralizes formula-injection triggers (=, +, -, @)', () => {
    expect(csvRow(['=SUM(A1)'])).toBe("'=SUM(A1)");
    expect(csvRow(['+1234'])).toBe("'+1234");
    expect(csvRow(['-cmd'])).toBe("'-cmd");
    expect(csvRow(['@SUM(A1)'])).toBe("'@SUM(A1)");
  });

  it('neutralizes AND quotes a formula value that also contains quotes', () => {
    // yields: "'=HYPERLINK(""http://evil"")"  — safe as text, quotes escaped
    expect(csvRow(['=HYPERLINK("http://evil")'])).toBe('"\'=HYPERLINK(""http://evil"")"');
  });

  it('does not prefix values that merely contain = later', () => {
    expect(csvRow(['a=b'])).toBe('a=b');
  });

  it('handles null/undefined as empty cells', () => {
    expect(csvRow([null, undefined, ''])).toBe(',,');
  });
});

describe('csvBody', () => {
  it('prepends a UTF-8 BOM and joins rows with CRLF', () => {
    const body = csvBody(['a,b', 'c,d']);
    expect(body.charCodeAt(0)).toBe(0xfeff);
    expect(body.slice(1)).toBe('a,b\r\nc,d');
  });
});
