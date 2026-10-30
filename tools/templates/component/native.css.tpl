/*
 * __Name__ (type A: styled native element).
 * Rules: docs/architecture/CSS_ARCHITECTURE.md. Values come from tokens only.
 * Guard selector: keep the element list in sync with anatomy.root.elements in the contract.
 */
@layer mcs.components {
  :where(TODO-native-element).mcs-__name__ {
    /* TODO(css): base styles, then one &[data-<prop>='<value>'] block per contract value. */
  }

  @media (forced-colors: active) {
    .mcs-__name__ {
      /* TODO(css): make states that rely on background color visible. */
    }
  }
}
