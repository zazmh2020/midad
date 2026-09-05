import { describe, it, expect } from 'vitest';
import { ORG_MODULES, isOrgModule, moduleEnabled } from './modules';

describe('org modules', () => {
  it('validates module keys', () => {
    expect(isOrgModule('operations')).toBe(true);
    expect(isOrgModule('education')).toBe(true);
    expect(isOrgModule('nonsense')).toBe(false);
  });
  it('treats a module as enabled unless it is in the disabled list', () => {
    expect(moduleEnabled([], 'operations')).toBe(true);
    expect(moduleEnabled(['operations'], 'operations')).toBe(false);
    expect(moduleEnabled(['documents'], 'operations')).toBe(true);
    expect(moduleEnabled(null, 'education')).toBe(true);
    expect(moduleEnabled(undefined, 'education')).toBe(true);
  });
  it('exposes the canonical module list', () => {
    expect(ORG_MODULES).toContain('operations');
    expect(ORG_MODULES.length).toBeGreaterThanOrEqual(8);
  });
});
