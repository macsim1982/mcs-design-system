/**
 * <__Name__>: React template for a type A component. Server Component compatible: no hooks, no
 * 'use client'. Renders the contract anatomy, nothing else (docs/architecture/FRAMEWORKS.md, §4).
 */
import type { ComponentProps } from 'react';

import type { __Name__Props as ContractProps } from '@mcs-ds/web/contracts';

export interface __Name__Props extends ContractProps, Omit<ComponentProps<'TODO'>, keyof ContractProps> {}

export function __Name__(props: __Name__Props) {
  // TODO(react): map contract props to data-* attributes on the native root element.
  return null;
}
