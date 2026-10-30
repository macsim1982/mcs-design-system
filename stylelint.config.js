/**
 * CSS rules. Rationale for each rule: docs/engineering/CODING_STANDARDS.md, section 6, and
 * docs/architecture/CSS_ARCHITECTURE.md.
 */

// Keywords that are not design decisions, plus forced-colors system colors.
const NON_DESIGN_VALUES = [
  'currentColor',
  'currentcolor',
  'transparent',
  'inherit',
  'initial',
  'unset',
  'revert',
  'revert-layer',
  'none',
  'auto',
  '/^-?[0-9]$/',
  '/^(Canvas|CanvasText|LinkText|VisitedText|ActiveText|ButtonFace|ButtonText|ButtonBorder|Field|FieldText|Highlight|HighlightText|SelectedItem|SelectedItemText|Mark|MarkText|GrayText|AccentColor|AccentColorText)$/',
  // States are derived from tokens with color-mix() (docs/architecture/TOKENS.md, section 5.4).
  '/^color-mix\\(/',
];

const KEBAB = '[a-z0-9]+(?:-[a-z0-9]+)*';

/** @type {import('stylelint').Config} */
export default {
  // Generated output is never linted (also ignored by Git).
  ignoreFiles: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/playwright-report/**'],
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-plugin-use-baseline', 'stylelint-declaration-strict-value'],
  rules: {
    // Naming: mcs-<block>[__<part>]; public custom properties --mcs-*, private ones --_*.
    'selector-class-pattern': [
      `^mcs-${KEBAB}(?:__${KEBAB})?$`,
      {
        message: 'Classes follow mcs-<block>[__<part>] (docs/architecture/CSS_ARCHITECTURE.md §5)',
      },
    ],
    'custom-property-pattern': [
      `^(?:mcs-${KEBAB}|_${KEBAB})$`,
      { message: 'Custom properties are --mcs-* (public) or --_* (private)' },
    ],

    // Specificity budget: layers decide precedence, not selector weight.
    'selector-max-specificity': '0,3,0',
    'selector-max-id': 0,
    // A type may only qualify a class through :where() (zero-specificity guard selectors, see
    // docs/architecture/CSS_ARCHITECTURE.md §6): `:where(button).mcs-button` is fine,
    // `button.mcs-button` is not. selector-no-qualifying-type cannot tell the two apart.
    'selector-no-qualifying-type': null,
    'selector-disallowed-list': [
      ['/(^|[\\s>+~(,])[a-z][a-z0-9-]*\\.mcs-/'],
      { message: 'Wrap element types in :where() to keep zero specificity (guard selector)' },
    ],
    'selector-max-compound-selectors': 3,
    'max-nesting-depth': [
      2,
      { ignore: ['pseudo-classes'], ignoreAtRules: ['media', 'container', 'supports', 'layer'] },
    ],
    'declaration-no-important': true,

    // Logical properties only (right-to-left support without dedicated code).
    'property-disallowed-list': [
      [
        'margin-left',
        'margin-right',
        'padding-left',
        'padding-right',
        'left',
        'right',
        'border-left',
        'border-right',
        'border-top-left-radius',
        'border-top-right-radius',
        'border-bottom-left-radius',
        'border-bottom-right-radius',
      ],
      { message: 'Use the logical property instead (margin-inline-start, inset-inline-end…)' },
    ],
    'declaration-property-value-disallowed-list': {
      'text-align': ['left', 'right'],
      float: ['left', 'right'],
      clear: ['left', 'right'],
    },

    // Dark mode lives in tokens (light-dark()), never in component CSS.
    'media-feature-name-disallowed-list': [
      ['prefers-color-scheme'],
      { message: 'Dark mode is handled by tokens (docs/architecture/THEMING.md)' },
    ],

    // Browser policy: Baseline widely available; level-B features are listed explicitly and mirror
    // the platform feature register (docs/architecture/ARCHITECTURE.md, section 6).
    'plugin/use-baseline': [
      true,
      {
        available: 'widely',
        ignoreFunctions: ['light-dark'],
        ignoreSelectors: ['state', 'popover-open'],
        // Ignored by browsers that do not support them: graceful by design.
        ignoreAtRules: ['starting-style'],
        ignoreProperties: { 'transition-behavior': [] },
      },
    ],

    // Design values come from tokens only.
    'scale-unlimited/declaration-strict-value': [
      ['/color$/', 'fill', 'stroke', 'box-shadow', 'font-family', 'z-index'],
      {
        ignoreFunctions: false,
        ignoreValues: NON_DESIGN_VALUES,
        disableFix: true,
      },
    ],
  },
  overrides: [
    {
      // Private apps (workbench, consumer apps) have their own class names.
      files: ['apps/**/*.css'],
      rules: {
        'selector-class-pattern': null,
        'custom-property-pattern': null,
      },
    },
  ],
};
