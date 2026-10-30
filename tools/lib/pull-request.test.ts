import { describe, expect, it } from 'vitest';

import { parseChangeset } from './changesets.ts';
import {
  checkPullRequestBody,
  countApprovals,
  isBotPullRequest,
  isBreakingChange,
  REQUIRED_SECTIONS,
  requiredApprovals,
} from './pull-request.ts';

const filledBody = REQUIRED_SECTIONS.map((title) => `## ${title}\n\nAucun.\n`).join('\n');

describe('pull request checks', () => {
  describe('checkPullRequestBody', () => {
    it('accepts a body where every required section has content', () => {
      expect(checkPullRequestBody(filledBody)).toEqual([]);
    });

    it('reports missing sections', () => {
      expect(checkPullRequestBody('## Contexte et objectif\n\nTexte.')).toHaveLength(
        REQUIRED_SECTIONS.length - 1,
      );
    });

    it('treats comments and unchecked boxes as empty', () => {
      const body = filledBody.replace(
        "## Impact sur l'API publique\n\nAucun.",
        "## Impact sur l'API publique\n\n<!-- Cochez une case. -->\n- [ ] Aucun\n- [ ] Ajout",
      );
      expect(checkPullRequestBody(body)).toEqual([
        expect.stringContaining("Impact sur l'API publique"),
      ]);
    });

    it('accepts a checked box as content', () => {
      const body = filledBody.replace(
        "## Impact sur l'API publique\n\nAucun.",
        "## Impact sur l'API publique\n\n- [x] Aucun\n- [ ] Ajout",
      );
      expect(checkPullRequestBody(body)).toEqual([]);
    });
  });

  it('recognizes bot pull requests', () => {
    expect(isBotPullRequest('renovate[bot]', 'renovate/eslint')).toBe(true);
    expect(isBotPullRequest('mcs-release-bot[bot]', 'chore/merge-back-1-4-1')).toBe(true);
    expect(isBotPullRequest('someone', 'changeset-release/main')).toBe(true);
    expect(isBotPullRequest('someone', 'feature/x')).toBe(false);
  });

  it('detects breaking changes from the title or the changesets', () => {
    const major = parseChangeset('m', "---\n'@mcs-ds/web': major\n---\n\nfeat!: x\n");
    expect(isBreakingChange('feat(button)!: rename variant', [])).toBe(true);
    expect(isBreakingChange('feat(button): add state', [major])).toBe(true);
    expect(isBreakingChange('feat(button): add state', [])).toBe(false);
  });

  it('reads the required approvals for breaking changes', () => {
    expect(requiredApprovals(undefined)).toBe(2);
    expect(requiredApprovals('')).toBe(2);
    expect(requiredApprovals('0')).toBe(0);
    expect(() => requiredApprovals('two')).toThrow('invalide');
    expect(() => requiredApprovals('-1')).toThrow('invalide');
  });

  it('counts the latest decisive review of each reviewer', () => {
    expect(
      countApprovals([
        { user: 'ana', state: 'APPROVED', submittedAt: '2026-10-01T10:00:00Z' },
        { user: 'ana', state: 'CHANGES_REQUESTED', submittedAt: '2026-10-02T10:00:00Z' },
        { user: 'bob', state: 'CHANGES_REQUESTED', submittedAt: '2026-10-01T10:00:00Z' },
        { user: 'bob', state: 'APPROVED', submittedAt: '2026-10-03T10:00:00Z' },
        { user: 'bob', state: 'COMMENTED', submittedAt: '2026-10-04T10:00:00Z' },
        { user: 'eve', state: 'APPROVED', submittedAt: '2026-10-03T10:00:00Z' },
      ]),
    ).toBe(2);
  });
});
