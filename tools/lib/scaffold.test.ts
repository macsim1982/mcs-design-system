import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  isComponentType,
  planComponent,
  renderTemplate,
  templateVariables,
  validateComponentName,
} from './scaffold.ts';

const TEMPLATES = join(import.meta.dirname, '..', 'templates', 'component');

describe('scaffold', () => {
  it('validates component names', () => {
    expect(validateComponentName('text-field')).toBeUndefined();
    expect(validateComponentName('TextField')).toContain('kebab-case');
    expect(validateComponentName('internal')).toContain('réservé');
  });

  it('recognizes component types', () => {
    expect(isComponentType('C')).toBe(true);
    expect(isComponentType('D')).toBe(false);
  });

  it('builds naming variables', () => {
    expect(templateVariables('text-field', 'B')).toEqual({
      name: 'text-field',
      Name: 'TextField',
      camelName: 'textField',
      tag: 'mcs-text-field',
      type: 'B',
    });
  });

  it('plans no element for a type A component', () => {
    const targets = planComponent('button', 'A').map((file) => file.target);
    expect(targets).toContain('packages/web/src/components/button/button.css');
    expect(targets).toContain('packages/react/src/button.tsx');
    expect(targets.some((target) => target.endsWith('.element.ts'))).toBe(false);
  });

  it('plans an element and the element templates for type C', () => {
    const files = planComponent('tabs', 'C');
    expect(files.map((file) => file.target)).toContain(
      'packages/web/src/components/tabs/tabs.element.ts',
    );
    expect(files.map((file) => file.template)).toEqual(
      expect.arrayContaining(['element.css.tpl', 'react-element.tsx.tpl']),
    );
  });

  it('only references templates that exist', () => {
    const available = new Set(readdirSync(TEMPLATES));
    for (const type of ['A', 'B', 'C'] as const) {
      for (const file of planComponent('x', type)) expect(available).toContain(file.template);
    }
  });

  it('renders every template without leftover placeholders', () => {
    const variables = templateVariables('text-field', 'B');
    for (const template of readdirSync(TEMPLATES)) {
      const output = renderTemplate(readFileSync(join(TEMPLATES, template), 'utf8'), variables);
      expect(output).not.toMatch(/__[A-Za-z]+__/u);
    }
  });

  it('throws on unknown placeholders', () => {
    expect(() => renderTemplate('__missing__', {})).toThrow('inconnue');
  });
});
