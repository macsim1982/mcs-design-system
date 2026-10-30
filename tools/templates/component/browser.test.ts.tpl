/**
 * __Name__ behavior and accessibility in real browsers (docs/engineering/TESTING_STRATEGY.md).
 */
import { describe, expect, it } from 'vitest';

import { expectNoAxeViolations, renderFixture } from '../../internal/testing.ts';
import { __camelName__ } from './__name__.contract.ts';
import { defaultFixture } from './__name__.fixtures.ts';

describe('__name__', () => {
  describe('contract', () => {
    it('declares its accessibility pattern', () => {
      expect(__camelName__.a11y.pattern).not.toContain('TODO');
    });
  });

  describe('accessibility', () => {
    it('has no axe violations in its default state', async () => {
      const root = renderFixture(defaultFixture);
      await expectNoAxeViolations(root);
    });
  });
});
