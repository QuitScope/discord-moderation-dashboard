import { describe, it, expect, beforeEach } from 'vitest';
import {
  listCases, getCaseById, addCase,
  listViolations, getViolationByKey, addViolation, updateViolationByKey, deleteViolationByKey,
  listTemplates, getTemplateByType, addTemplate,
  paginate,
  genMockId,
} from './mock-store';
import type { Case, Violation, EmbedTemplate } from './types';

describe('mock-store: cases', () => {
  it('lists seeded cases sorted newest first', () => {
    const cases = listCases();
    expect(cases.length).toBeGreaterThan(0);
    for (let i = 1; i < cases.length; i++) {
      expect(cases[i - 1].createdAt >= cases[i].createdAt).toBe(true);
    }
  });

  it('filters cases by userId', () => {
    const id = genMockId();
    const newCase: Case = {
      id, userId: 'user-filter-test', type: 'warning', points: 1,
      reasonKey: null, reasonText: 'test', evidence: [], status: 'final',
      createdById: 'demo-admin', createdAt: new Date().toISOString(),
      violationId: null, wasEscalated: false, appliedActions: null,
      expiresAt: null, triggerRoleId: null,
    };
    addCase(newCase);
    const filtered = listCases({ userId: 'user-filter-test' });
    expect(filtered).toEqual([newCase]);
    expect(getCaseById(id)).toEqual(newCase);
  });
});

describe('mock-store: violations', () => {
  it('creates, updates and deletes by key', () => {
    const v: Violation = {
      id: genMockId(), key: 'test-violation', name: 'Test', description: null,
      category: [], basePoints: 1, isInstantBan: false, escalateAfter: 2,
      escalatePoints: 1, autoTimeout: null, autoTempban: null,
      requireEvidence: false, ticketTemplate: null, active: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    addViolation(v);
    expect(getViolationByKey('test-violation')?.name).toBe('Test');

    const updated = updateViolationByKey('test-violation', { name: 'Renamed' });
    expect(updated?.name).toBe('Renamed');
    expect(getViolationByKey('test-violation')?.name).toBe('Renamed');

    const deleted = deleteViolationByKey('test-violation');
    expect(deleted?.key).toBe('test-violation');
    expect(getViolationByKey('test-violation')).toBeUndefined();
  });

  it('returns null when updating or deleting a missing key', () => {
    expect(updateViolationByKey('does-not-exist', { name: 'x' })).toBeNull();
    expect(deleteViolationByKey('does-not-exist')).toBeNull();
  });
});

describe('mock-store: templates', () => {
  it('lists templates sorted by type', () => {
    const t: EmbedTemplate = {
      id: 999, type: 'zzz-test', enabled: true, title: 'T', description: null,
      color: null, authorName: null, authorIcon: null, footerText: null,
      footerIcon: null, imageUrl: null, thumbnailUrl: null, timestamp: false,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    addTemplate(t);
    const all = listTemplates();
    expect(all[all.length - 1].type).toBe('zzz-test');
    expect(getTemplateByType('zzz-test')?.id).toBe(999);
  });
});

describe('paginate', () => {
  it('slices into pages of the given size and clamps out-of-range pages', () => {
    const items = Array.from({ length: 30 }, (_, i) => i);
    const page1 = paginate(items, 1, 10);
    expect(page1).toEqual({ data: items.slice(0, 10), total: 30, page: 1, pages: 3 });

    const page3 = paginate(items, 3, 10);
    expect(page3.data).toEqual(items.slice(20, 30));

    const clamped = paginate(items, 99, 10);
    expect(clamped.page).toBe(3);
    expect(clamped.data).toEqual(items.slice(20, 30));
  });

  it('handles an empty list', () => {
    expect(paginate([], 1, 10)).toEqual({ data: [], total: 0, page: 1, pages: 1 });
  });
});
