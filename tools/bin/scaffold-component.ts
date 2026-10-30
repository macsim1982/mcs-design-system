/**
 * Generates a component skeleton from tools/templates/component:
 *   pnpm scaffold:component <name> --type <A|B|C>
 * Only available once @mcs-ds/web exists (phase 2, after the architecture is approved).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import {
  isComponentType,
  planComponent,
  renderTemplate,
  templateVariables,
  validateComponentName,
} from '../lib/scaffold.ts';

const TEMPLATES = join(import.meta.dirname, '..', 'templates', 'component');

function fail(message: string): void {
  console.error(`✖ ${message}`);
  process.exitCode = 1;
}

function scaffold(args: readonly string[]): void {
  const [name] = args;
  const typeIndex = args.indexOf('--type');
  const type = typeIndex === -1 ? undefined : args[typeIndex + 1];
  if (name === undefined || type === undefined || !isComponentType(type)) {
    fail('Usage : pnpm scaffold:component <nom> --type <A|B|C>');
    return;
  }
  const invalid = validateComponentName(name);
  if (invalid !== undefined) {
    fail(invalid);
    return;
  }
  if (!existsSync(join('packages', 'web', 'package.json'))) {
    fail(
      "@mcs-ds/web n'existe pas encore : créez d'abord le paquet (fondations du pilote, phase 2).",
    );
    return;
  }
  const files = planComponent(name, type);
  const existing = files.filter((file) => existsSync(file.target));
  if (existing.length > 0) {
    fail(`Fichiers déjà présents : ${existing.map((file) => file.target).join(', ')}`);
    return;
  }
  const variables = templateVariables(name, type);
  for (const file of files) {
    mkdirSync(dirname(file.target), { recursive: true });
    writeFileSync(
      file.target,
      renderTemplate(readFileSync(join(TEMPLATES, file.template), 'utf8'), variables),
    );
    console.log(`+ ${file.target}`);
  }
  console.log(
    'Étape suivante : compléter le contrat (TODO(contract)), puis suivre le skill new-component.',
  );
}

scaffold(process.argv.slice(2));
