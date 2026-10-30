/**
 * Deterministic component scaffolding (docs/architecture/COMPONENT_ARCHITECTURE.md, section 3).
 * Boilerplate comes from templates, not from hand (or model) writing: implementers only fill in
 * the parts that carry decisions.
 */

export type ComponentType = 'A' | 'B' | 'C';

export interface ScaffoldFile {
  readonly target: string;
  readonly template: string;
}

const NAME = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;
const RESERVED = new Set(['internal', 'foundations', 'contracts', 'elements', 'index']);

export function isComponentType(value: string): value is ComponentType {
  return value === 'A' || value === 'B' || value === 'C';
}

/** Returns an error message, or undefined when the name is valid. */
export function validateComponentName(name: string): string | undefined {
  if (!NAME.test(name))
    return `Nom invalide "${name}" : kebab-case anglais attendu (ex. text-field).`;
  if (RESERVED.has(name)) return `Nom réservé : "${name}".`;
  return undefined;
}

function pascalCase(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function templateVariables(name: string, type: ComponentType): Record<string, string> {
  const pascal = pascalCase(name);
  return {
    name,
    Name: pascal,
    camelName: pascal.charAt(0).toLowerCase() + pascal.slice(1),
    tag: `mcs-${name}`,
    type,
  };
}

/** Files to create for a component, with the template used for each one. */
export function planComponent(name: string, type: ComponentType): ScaffoldFile[] {
  const dir = `packages/web/src/components/${name}`;
  const behavior = type !== 'A';
  return [
    { target: `${dir}/${name}.contract.ts`, template: 'contract.ts.tpl' },
    { target: `${dir}/${name}.css`, template: behavior ? 'element.css.tpl' : 'native.css.tpl' },
    ...(behavior ? [{ target: `${dir}/${name}.element.ts`, template: 'element.ts.tpl' }] : []),
    { target: `${dir}/${name}.fixtures.ts`, template: 'fixtures.ts.tpl' },
    { target: `${dir}/${name}.browser.test.ts`, template: 'browser.test.ts.tpl' },
    { target: `${dir}/README.md`, template: 'README.md.tpl' },
    {
      target: `packages/react/src/${name}.tsx`,
      template: behavior ? 'react-element.tsx.tpl' : 'react-native.tsx.tpl',
    },
  ];
}

/** Replaces `__key__` placeholders. Throws if a placeholder has no value. */
export function renderTemplate(
  template: string,
  variables: Readonly<Record<string, string>>,
): string {
  return template.replace(/__([A-Za-z]+)__/gu, (placeholder: string, key: string) => {
    const value = variables[key];
    if (value === undefined) throw new Error(`Variable de gabarit inconnue : ${placeholder}.`);
    return value;
  });
}
