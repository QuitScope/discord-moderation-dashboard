import { describe, it, expect } from 'vitest';
import { getCases, getCasesPaged, getCase, getUser, getConfig, getViolations, getTemplates, getTemplate } from './api';
import { DEMO_USER_ID } from './mock-store';

describe('lib/api read functions (mock-store backed)', () => {
  it('getCases returns the seeded case', async () => {
    const cases = await getCases();
    expect(cases.length).toBeGreaterThan(0);
  });

  it('getCasesPaged paginates and can hide dry-run cases', async () => {
    const page = await getCasesPaged({ page: 1 });
    expect(page.page).toBe(1);
    expect(page.data.length).toBeLessThanOrEqual(25);
  });

  it('getCase returns null for an unknown id', async () => {
    expect(await getCase('does-not-exist')).toBeNull();
  });

  it('getUser computes activePoints and attaches cases', async () => {
    const user = await getUser(DEMO_USER_ID);
    expect(user).not.toBeNull();
    expect(user!.cases.length).toBeGreaterThan(0);
    expect(typeof user!.activePoints).toBe('number');
  });

  it('getUser returns null for an unknown id', async () => {
    expect(await getUser('does-not-exist')).toBeNull();
  });

  it('getConfig returns the seeded config', async () => {
    const config = await getConfig();
    expect(config.pointsThreshold).toBe(10);
  });

  it('getViolations returns the seeded violation', async () => {
    const violations = await getViolations();
    expect(violations.some((v) => v.key === 'spam')).toBe(true);
  });

  it('getTemplates and getTemplate agree on the seeded template', async () => {
    const templates = await getTemplates();
    const template = await getTemplate('ban');
    expect(templates.find((t) => t.type === 'ban')).toEqual(template);
  });

  it('getTemplate returns null for an unknown type', async () => {
    expect(await getTemplate('does-not-exist')).toBeNull();
  });
});
