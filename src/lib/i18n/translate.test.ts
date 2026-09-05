import { describe, it, expect } from 'vitest';
import { translate } from './dictionaries';

describe('translate', () => {
  it('returns the Arabic and English strings for a key', () => {
    expect(translate('ar', 'nav.login')).toBeTruthy();
    expect(translate('en', 'nav.login')).toBeTruthy();
    expect(translate('ar', 'nav.login')).not.toBe(translate('en', 'nav.login'));
  });

  it('interpolates {vars}', () => {
    const out = translate('en', 'task.count', { n: 3, org: 'Acme' });
    expect(out).toContain('3');
    expect(out).toContain('Acme');
    expect(out).not.toContain('{n}');
    expect(out).not.toContain('{org}');
  });

  it('falls back to the key when it is missing', () => {
    expect(translate('ar', 'this.key.does.not.exist')).toBe('this.key.does.not.exist');
  });
});
