/*
 * __Name__ (behavior element): styles keyed on :state(), ARIA and native pseudo-classes.
 * Rules: docs/architecture/CSS_ARCHITECTURE.md. Values come from tokens only.
 */
@layer mcs.components {
  __tag__ {
    display: block;
  }

  /* Before upgrade: readable and stable, no layout shift once the element is defined. */
  __tag__:not(:defined) {
    /* TODO(css): pre-upgrade rendering. */
  }

  @media (forced-colors: active) {
    __tag__ {
      /* TODO(css): make states that rely on background color visible. */
    }
  }
}
