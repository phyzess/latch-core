export const handDrawnTheme = `
  :host {
    --latch-paper: #fdfbf7;
    --latch-surface: #fffefb;
    --latch-note: #fff9c4;
    --latch-muted-surface: #f0eadf;
    --latch-pencil: #2d2d2d;
    --latch-pencil-soft: #5f584f;
    --latch-pencil-muted: #786f64;
    --latch-erased: #e5e0d8;
    --latch-marker: #ff4d4d;
    --latch-marker-dark: #d83232;
    --latch-pen: #2d5da1;
    --latch-success: #2f7d4a;
    --latch-danger: #b42318;
    --latch-focus: rgba(45, 93, 161, 0.22);
    --latch-radius-lg: 255px 18px 225px 20px / 18px 225px 20px 255px;
    --latch-radius-md: 22px 255px 20px 225px / 225px 20px 255px 18px;
    --latch-radius-sm: 14px 210px 18px 190px / 190px 16px 210px 18px;
    --latch-shadow: 5px 5px 0 0 var(--latch-pencil);
    --latch-shadow-soft: 3px 3px 0 0 rgba(45, 45, 45, 0.14);
    --latch-shadow-pressed: 2px 2px 0 0 var(--latch-pencil);
    background-color: var(--latch-paper);
    background-image: radial-gradient(var(--latch-erased) 1px, transparent 1px);
    background-size: 24px 24px;
    color: var(--latch-pencil);
    display: block;
    font-family:
      "Patrick Hand",
      "Kalam",
      "Segoe Print",
      "Comic Sans MS",
      cursive;
    letter-spacing: 0;
    min-block-size: 100dvh;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  button,
  input,
  textarea,
  select {
    color: inherit;
    font: inherit;
    letter-spacing: inherit;
  }

  button,
  a,
  input,
  textarea,
  select {
    -webkit-tap-highlight-color: transparent;
  }

  ::selection {
    background: rgba(255, 77, 77, 0.24);
  }
`;
