/**
 * __Name__ contract: the single source of truth for this component's public API.
 * Rules: docs/architecture/COMPONENT_ARCHITECTURE.md, sections 4 and 12.
 * Only the architect agent (or a maintainer) changes a contract after review.
 */
import { defineContract } from '../../internal/contract.ts';

export const __camelName__ = defineContract({
  name: '__name__',
  type: '__type__',
  status: 'experimental',
  since: '0.0.0',
  summary: 'TODO(contract): one sentence describing when to use this component.',
  a11y: {
    pattern: 'TODO(contract): APG pattern name',
    apg: 'https://www.w3.org/WAI/ARIA/apg/patterns/',
  },
  anatomy: {
    // Type A: root: { class: 'mcs-__name__', elements: ['TODO'] }
    // Types B and C: root: { tag: '__tag__' }, plus parts with their roles.
  },
  props: {},
  states: {},
  events: {},
  keyboard: {},
  hooks: {},
} as const);
