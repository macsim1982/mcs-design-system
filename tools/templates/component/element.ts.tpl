/**
 * <__tag__>: behavior element (light DOM).
 * Rules: docs/architecture/COMPONENT_ARCHITECTURE.md, section 6. In short:
 * - never move, wrap or remove author-provided children;
 * - live state goes through ElementInternals and :state(); attributes are initial configuration;
 * - tolerate children that arrive after connectedCallback (streaming);
 * - every listener uses the AbortSignal provided by the base helper.
 */
import { defineElement, McsElement } from '../../internal/element.ts';
import { __camelName__ } from './__name__.contract.ts';

export class Mcs__Name__Element extends McsElement {
  static readonly contract = __camelName__;

  protected override setup(signal: AbortSignal): void {
    // TODO(elements): attach controllers (roving focus, typeahead, dismiss…) using `signal`.
    void signal;
  }
}

defineElement('__tag__', Mcs__Name__Element);

declare global {
  interface HTMLElementTagNameMap {
    '__tag__': Mcs__Name__Element;
  }
}
