import { describe, expect, it } from 'vitest';

import { isKebabCase, parseHeader, toSentence } from './conventional.ts';

describe('conventional', () => {
  describe('parseHeader', () => {
    it('parses type, scope and description', () => {
      expect(parseHeader('feat(button): add loading state')).toEqual({
        type: 'feat',
        scope: 'button',
        breaking: false,
        description: 'add loading state',
      });
    });

    it('detects a breaking change marker', () => {
      expect(parseHeader('feat(button)!: rename variant property')?.breaking).toBe(true);
    });

    it('accepts a header without scope', () => {
      expect(parseHeader('perf: reduce generated CSS size')?.scope).toBeUndefined();
    });

    it('rejects a footer used as a header', () => {
      expect(parseHeader('BREAKING CHANGE: rename variant property')).toBeUndefined();
    });

    it('rejects a header without space after the colon', () => {
      expect(parseHeader('fix(dialog):correct focus')).toBeUndefined();
    });
  });

  describe('isKebabCase', () => {
    it('accepts kebab-case and rejects other cases', () => {
      expect(isKebabCase('text-field')).toBe(true);
      expect(isKebabCase('textField')).toBe(false);
      expect(isKebabCase('text_field')).toBe(false);
    });
  });

  describe('toSentence', () => {
    it('capitalizes and adds a final period', () => {
      expect(toSentence('add loading state')).toBe('Add loading state.');
    });

    it('keeps existing final punctuation', () => {
      expect(toSentence('really?')).toBe('Really?');
    });
  });
});
