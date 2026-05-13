import "./latch-icon";
import { applyShadowStyles } from "../lib/shadow-styles";
import type { LatchUserState, ServiceEntry } from "../lib/types";
import { emptyUserState, loadUserState, recordServiceOpen, saveUserState } from "../lib/user-state";

const appStyles = `
  :host {
    --latch-page: #f6f7f8;
    --latch-surface: #ffffff;
    --latch-tint: #f8fafc;
    --latch-fill: #eef0f2;
    --latch-line: #e1e4e8;
    --latch-ink: #1d1d1f;
    --latch-strong: #34363a;
    --latch-muted: #6f7379;
    --latch-subtle: #9aa0a8;
    --latch-brand: #1677ff;
    --latch-brand-hover: #0f65d8;
    --latch-focus-ring: rgba(22, 119, 255, 0.22);
    --latch-danger: #b42318;
    background: var(--latch-page);
    color: var(--latch-ink);
    display: block;
    min-block-size: 100dvh;
    font-family:
      "SF Pro Text",
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
    letter-spacing: 0;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  button {
    color: inherit;
    font: inherit;
    letter-spacing: inherit;
  }

  .top-bar {
    align-items: center;
    background: rgba(255, 255, 255, 0.72);
    border-block-end: 1px solid rgba(225, 228, 232, 0.78);
    color: #666b73;
    display: flex;
    font-size: 0.82rem;
    font-weight: 620;
    gap: 8px;
    justify-content: center;
    min-block-size: 34px;
    padding-inline: 16px;
  }

  .top-bar latch-icon {
    --icon-size: 0.82rem;
  }

  .app {
    display: block;
    inline-size: 100%;
    min-block-size: 100dvh;
  }

  .launcher-shell {
    display: grid;
    gap: 20px;
    inline-size: min(560px, calc(100vw - 48px));
    margin-inline: auto;
    padding-block: clamp(54px, 8vw, 88px);
  }

  .app-header {
    align-items: center;
    display: flex;
    gap: 16px;
    justify-content: space-between;
  }

  .brand-lockup {
    align-items: center;
    display: flex;
    gap: 12px;
    min-inline-size: 0;
  }

  .brand-mark {
    block-size: 42px;
    border-radius: 13px;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 1px 2px rgba(15, 23, 42, 0.08);
    display: block;
    flex: 0 0 auto;
    inline-size: 42px;
  }

  .header-copy {
    display: grid;
    gap: 5px;
    min-inline-size: 0;
  }

  .app-title {
    color: var(--latch-ink);
    font-size: clamp(1.72rem, 4vw, 2.15rem);
    font-weight: 740;
    letter-spacing: 0;
    line-height: 1.04;
    margin: 0;
    text-wrap: balance;
  }

  .app-subtitle {
    color: var(--latch-muted);
    font-size: 0.92rem;
    line-height: 1.3;
    margin: 0;
  }

  .settings-link {
    align-items: center;
    background: #ffffff;
    border: 1px solid var(--latch-line);
    border-radius: 9px;
    color: var(--latch-ink);
    display: inline-flex;
    font-size: 0.82rem;
    font-weight: 650;
    gap: 7px;
    min-block-size: 32px;
    padding-inline: 11px;
    text-decoration: none;
    transition:
      background-color 160ms ease,
      box-shadow 160ms ease,
      transform 160ms ease;
  }

  .settings-link:hover,
  .settings-link:focus-visible {
    background: var(--latch-tint);
    outline: 0;
  }

  .settings-link:focus-visible {
    box-shadow: 0 0 0 4px var(--latch-focus-ring);
  }

  .settings-link:active {
    transform: translateY(1px);
  }

  .settings-link latch-icon {
    --icon-size: 0.86rem;
  }

  .service-list {
    background: var(--latch-surface);
    border: 1px solid var(--latch-line);
    border-radius: 14px;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    display: grid;
    inline-size: 100%;
    overflow: hidden;
  }

  .service-row {
    align-items: center;
    background: transparent;
    border: 0;
    border-block-start: 1px solid var(--latch-line);
    cursor: pointer;
    display: grid;
    gap: 14px;
    grid-template-columns: 40px minmax(0, 1fr) auto;
    inline-size: 100%;
    min-block-size: 68px;
    padding: 12px 16px;
    text-align: start;
    transition:
      background-color 160ms ease,
      box-shadow 160ms ease,
      transform 160ms ease;
  }

  .service-row:first-child {
    border-block-start: 0;
  }

  .service-row[data-active="true"] {
    background: rgba(22, 119, 255, 0.035);
  }

  .service-row:hover,
  .service-row:focus-visible {
    background: var(--latch-tint);
    outline: 0;
  }

  .service-row:focus-visible {
    box-shadow: inset 0 0 0 2px var(--latch-focus-ring);
  }

  .service-row:active {
    transform: translateY(1px);
  }

  .icon-box {
    align-items: center;
    background: var(--latch-fill);
    border-radius: 12px;
    color: var(--latch-strong);
    display: grid;
    block-size: 40px;
    inline-size: 40px;
    place-items: center;
  }

  .icon-box latch-icon {
    --icon-size: 1rem;
  }

  .service-copy {
    display: grid;
    gap: 3px;
    min-inline-size: 0;
  }

  .service-name {
    color: var(--latch-ink);
    display: block;
    font-size: 0.94rem;
    font-weight: 660;
    line-height: 1.15;
    overflow-wrap: anywhere;
  }

  .service-host {
    color: var(--latch-muted);
    display: block;
    font-size: 0.86rem;
    line-height: 1.25;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .service-accessory {
    align-items: center;
    color: var(--latch-subtle);
    display: flex;
    gap: 10px;
    justify-content: end;
    min-inline-size: 0;
  }

  .shortcut-badge {
    align-items: center;
    background: #f1f2f4;
    border: 1px solid #e2e3e6;
    border-radius: 999px;
    color: #62666d;
    display: inline-grid;
    font-size: 0.68rem;
    font-variant-numeric: tabular-nums;
    font-weight: 650;
    min-block-size: 21px;
    min-inline-size: 25px;
    padding-inline: 7px;
    place-items: center;
    text-transform: uppercase;
  }

  .external-icon {
    --icon-size: 0.9rem;
    color: var(--latch-strong);
    opacity: 0.74;
    transition:
      opacity 160ms ease,
      transform 160ms ease;
  }

  .service-row:hover .external-icon,
  .service-row:focus-visible .external-icon {
    opacity: 1;
    transform: translate(1px, -1px);
  }

  .state-panel {
    align-items: center;
    background: var(--latch-surface);
    border: 1px solid var(--latch-line);
    border-radius: 14px;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    display: grid;
    gap: 14px;
    grid-template-columns: 40px minmax(0, 1fr) auto;
    min-block-size: 76px;
    padding: 16px;
  }

  .state-icon {
    align-items: center;
    background: var(--latch-fill);
    border-radius: 12px;
    color: var(--latch-strong);
    display: grid;
    block-size: 40px;
    inline-size: 40px;
    place-items: center;
  }

  .state-icon latch-icon {
    --icon-size: 1rem;
  }

  .state-copy {
    display: grid;
    gap: 3px;
    min-inline-size: 0;
  }

  .state-title {
    color: var(--latch-ink);
    font-size: 0.94rem;
    font-weight: 650;
    line-height: 1.2;
  }

  .state-message {
    color: var(--latch-muted);
    font-size: 0.86rem;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }

  .error .state-icon {
    background: #fef3f2;
    color: var(--latch-danger);
  }

  .retry-button {
    background: #ffffff;
    border: 1px solid var(--latch-line);
    border-radius: 9px;
    color: var(--latch-ink);
    cursor: pointer;
    font-size: 0.82rem;
    font-weight: 650;
    min-block-size: 32px;
    padding-inline: 11px;
    transition:
      background-color 160ms ease,
      box-shadow 160ms ease,
      transform 160ms ease;
  }

  .retry-button:hover,
  .retry-button:focus-visible {
    background: var(--latch-tint);
    outline: 0;
  }

  .retry-button:focus-visible {
    box-shadow: 0 0 0 4px var(--latch-focus-ring);
  }

  .retry-button:active {
    transform: translateY(1px);
  }

  .loading-row {
    align-items: center;
    border-block-start: 1px solid var(--latch-line);
    display: grid;
    gap: 14px;
    grid-template-columns: 40px minmax(0, 1fr) 28px;
    min-block-size: 68px;
    padding: 12px 16px;
  }

  .loading-row:first-child {
    border-block-start: 0;
  }

  .loading-icon,
  .loading-line,
  .loading-pill {
    animation: shimmer 1200ms ease-in-out infinite;
    background: linear-gradient(90deg, #ebedf0 0%, #f7f8fa 48%, #ebedf0 100%);
    background-size: 220% 100%;
  }

  .loading-icon {
    block-size: 40px;
    border-radius: 12px;
    inline-size: 40px;
  }

  .loading-copy {
    display: grid;
    gap: 8px;
  }

  .loading-line {
    block-size: 10px;
    border-radius: 999px;
    inline-size: min(220px, 72%);
  }

  .loading-line.short {
    inline-size: min(170px, 54%);
  }

  .loading-pill {
    block-size: 21px;
    border-radius: 999px;
    inline-size: 28px;
  }

  .sr-only {
    block-size: 1px;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    inline-size: 1px;
    margin: -1px;
    overflow: hidden;
    position: absolute;
    white-space: nowrap;
  }

  @keyframes shimmer {
    from {
      background-position: 120% 0;
    }
    to {
      background-position: -120% 0;
    }
  }

  @media (max-width: 640px) {
    .top-bar {
      min-block-size: 34px;
    }

    .launcher-shell {
      gap: 18px;
      inline-size: calc(100vw - 24px);
      padding-block: 32px;
    }

    .app-header {
      align-items: start;
      flex-direction: column;
    }

    .brand-mark {
      block-size: 38px;
      inline-size: 38px;
    }

    .service-row,
    .loading-row {
      gap: 12px;
      grid-template-columns: 38px minmax(0, 1fr) auto;
      min-block-size: 64px;
      padding: 11px 13px;
    }

    .icon-box,
    .state-icon,
    .loading-icon {
      block-size: 38px;
      inline-size: 38px;
    }

    .state-panel {
      align-items: start;
      grid-template-columns: 38px minmax(0, 1fr);
      padding: 14px;
    }

    .retry-button {
      grid-column: 2;
      justify-self: start;
    }
  }

  @media (max-width: 460px) {
    .launcher-shell {
      inline-size: calc(100vw - 20px);
      padding-block-start: 26px;
    }

    .shortcut-badge {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      scroll-behavior: auto !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

export class LatchApp extends HTMLElement {
  #root: ShadowRoot;
  #services: ServiceEntry[] = [];
  #state: LatchUserState = emptyUserState();
  #status: "loading" | "ready" | "error" = "loading";
  #errorMessage = "";
  #selectedIndex = 0;

  #boundKeydown = (event: KeyboardEvent) => this.#onDocumentKeydown(event);

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open", delegatesFocus: true });
    applyShadowStyles(this.#root, appStyles);
  }

  connectedCallback(): void {
    this.#state = loadUserState();
    document.addEventListener("keydown", this.#boundKeydown);
    this.#render();
    void this.#loadServices();
  }

  disconnectedCallback(): void {
    document.removeEventListener("keydown", this.#boundKeydown);
  }

  async #loadServices(): Promise<void> {
    this.#status = "loading";
    this.#errorMessage = "";
    this.#render();

    const servicesSrc = this.getAttribute("services-src") ?? "/services.json";

    try {
      const response = await fetch(servicesSrc, {
        cache: "no-store",
        credentials: "same-origin"
      });

      if (!response.ok) {
        throw new Error(`Failed to load services (${response.status}).`);
      }

      const payload = (await response.json()) as unknown;
      if (!isServicePayload(payload)) {
        throw new Error("Service payload must be a valid service array.");
      }

      this.#services = payload;
      this.#status = "ready";
      this.#errorMessage = "";
    } catch (error) {
      this.#status = "error";
      this.#errorMessage = error instanceof Error ? error.message : "Failed to load services.";
    }

    this.#render();
  }

  #render(): void {
    this.#selectedIndex = clamp(this.#selectedIndex, 0, Math.max(this.#services.length - 1, 0));
    this.#root.querySelector(".app")?.remove();

    const app = document.createElement("main");
    app.className = "app";
    app.setAttribute("aria-label", "Latch service launcher");
    app.innerHTML = this.#renderContent();

    this.#root.append(app);
    this.#bindEvents();
  }

  #renderContent(): string {
    const hostLabel = getHostLabel(window.location.hostname, this.#services);
    const countLabel =
      this.#status === "ready"
        ? `${this.#services.length} ${this.#services.length === 1 ? "service" : "services"}`
        : "";

    return `
      <div class="top-bar">
        <latch-icon name="link" aria-hidden="true"></latch-icon>
        <span>${escapeHtml(hostLabel)}</span>
      </div>
      <div class="launcher-shell">
        <header class="app-header">
          <div class="brand-lockup">
            <img class="brand-mark" src="/icon.svg" alt="" width="42" height="42" />
            <div class="header-copy">
              <h1 class="app-title">Latch</h1>
              ${countLabel ? `<p class="app-subtitle">${escapeHtml(countLabel)}</p>` : ""}
            </div>
          </div>
          <a class="settings-link" href="/settings">
            <latch-icon name="shield" aria-hidden="true"></latch-icon>
            <span>Settings</span>
          </a>
        </header>
        ${this.#renderBody()}
      </div>
    `;
  }

  #renderBody(): string {
    if (this.#status === "loading") {
      return this.#renderLoading();
    }

    if (this.#status === "error") {
      return `
        <div class="state-panel error" role="alert">
          <span class="state-icon" aria-hidden="true">
            <latch-icon name="alert"></latch-icon>
          </span>
          <span class="state-copy">
            <span class="state-title">Could not load services</span>
            <span class="state-message">${escapeHtml(this.#errorMessage)}</span>
          </span>
          <button class="retry-button" type="button" data-action="retry-services">Retry</button>
        </div>
      `;
    }

    if (this.#services.length === 0) {
      return `
        <div class="state-panel">
          <span class="state-icon" aria-hidden="true">
            <latch-icon name="service"></latch-icon>
          </span>
          <span class="state-copy">
            <span class="state-title">No services</span>
            <span class="state-message">No services configured</span>
          </span>
        </div>
      `;
    }

    return `
      <nav class="service-list" aria-label="Services">
        ${this.#services.map((service, index) => this.#renderService(service, index)).join("")}
      </nav>
    `;
  }

  #renderLoading(): string {
    return `
      <div class="service-list" role="status" aria-live="polite" aria-label="Loading services">
        <span class="sr-only">Loading services</span>
        ${Array.from({ length: 4 }, () => this.#renderLoadingRow()).join("")}
      </div>
    `;
  }

  #renderLoadingRow(): string {
    return `
      <div class="loading-row" aria-hidden="true">
        <span class="loading-icon"></span>
        <span class="loading-copy">
          <span class="loading-line"></span>
          <span class="loading-line short"></span>
        </span>
        <span class="loading-pill"></span>
      </div>
    `;
  }

  #renderService(service: ServiceEntry, index: number): string {
    const selected = index === this.#selectedIndex;
    const host = new URL(service.url).hostname;
    const shortcut = service.shortcut
      ? `<span class="shortcut-badge" aria-hidden="true">${escapeHtml(service.shortcut)}</span>`
      : "";

    return `
      <button
        class="service-row"
        part="item"
        type="button"
        data-action="open-service"
        data-service-id="${escapeAttribute(service.id)}"
        data-service-index="${index}"
        data-active="${selected ? "true" : "false"}"
        aria-label="Open ${escapeAttribute(service.name)} (${escapeAttribute(host)})"
      >
        <span class="icon-box" aria-hidden="true">
          <latch-icon name="${escapeAttribute(service.icon ?? "service")}"></latch-icon>
        </span>
        <span class="service-copy">
          <span class="service-name" part="label">${escapeHtml(service.name)}</span>
          <span class="service-host">${escapeHtml(host)}</span>
        </span>
        <span class="service-accessory" aria-hidden="true">
          ${shortcut}
          <latch-icon class="external-icon" name="external"></latch-icon>
        </span>
      </button>
    `;
  }

  #bindEvents(): void {
    for (const element of this.#root.querySelectorAll<HTMLButtonElement>(
      "[data-action='open-service']"
    )) {
      element.addEventListener("click", () => {
        const service = this.#findService(element.dataset.serviceId);
        if (service) {
          this.#openService(service);
        }
      });

      element.addEventListener("focus", () => {
        const index = Number(element.dataset.serviceIndex);
        if (Number.isInteger(index)) {
          this.#selectedIndex = clamp(index, 0, Math.max(this.#services.length - 1, 0));
          this.#syncActiveService();
        }
      });
    }

    this.#root
      .querySelector<HTMLButtonElement>("[data-action='retry-services']")
      ?.addEventListener("click", () => {
        void this.#loadServices();
      });
  }

  #onDocumentKeydown(event: KeyboardEvent): void {
    if (this.#status !== "ready") {
      return;
    }

    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    if (/^[1-9]$/.test(event.key)) {
      const service = this.#services.find((entry) => entry.shortcut === event.key);
      if (service) {
        event.preventDefault();
        this.#openService(service);
      }
      return;
    }

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      this.#moveSelection(1);
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      this.#moveSelection(-1);
      return;
    }

    if (event.key === "Enter") {
      this.#openSelectedService(event);
    }
  }

  #moveSelection(delta: number): void {
    if (this.#services.length === 0) {
      this.#selectedIndex = 0;
      return;
    }

    this.#selectedIndex = clamp(this.#selectedIndex + delta, 0, this.#services.length - 1);
    this.#render();
    this.#focusSelectedCard();
  }

  #openSelectedService(event?: KeyboardEvent): void {
    const service = this.#services[this.#selectedIndex];
    if (service) {
      event?.preventDefault();
      this.#openService(service);
    }
  }

  #openService(service: ServiceEntry): void {
    this.#state = recordServiceOpen(this.#state, service.id);
    saveUserState(this.#state);
    window.open(service.url, "_blank", "noopener,noreferrer");
  }

  #findService(serviceId: string | undefined): ServiceEntry | undefined {
    if (!serviceId) {
      return undefined;
    }

    return this.#services.find((service) => service.id === serviceId);
  }

  #focusSelectedCard(): void {
    queueMicrotask(() => {
      this.#root.querySelector<HTMLButtonElement>("[data-active='true']")?.focus();
    });
  }

  #syncActiveService(): void {
    for (const element of this.#root.querySelectorAll<HTMLButtonElement>(
      "[data-action='open-service']"
    )) {
      element.dataset.active =
        Number(element.dataset.serviceIndex) === this.#selectedIndex ? "true" : "false";
    }
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getHostLabel(hostname: string, services: ServiceEntry[]): string {
  if (isLocalHostname(hostname)) {
    return getCommonDomainLabel(services) ?? "Latch";
  }

  return hostname || "Latch";
}

function isLocalHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function getCommonDomainLabel(services: ServiceEntry[]): string | undefined {
  const domains = new Set(services.map((service) => getBaseDomain(new URL(service.url).hostname)));

  if (domains.size !== 1) {
    return undefined;
  }

  return [...domains][0];
}

function getBaseDomain(hostname: string): string {
  const parts = hostname.split(".").filter(Boolean);
  return parts.length > 1 ? parts.slice(-2).join(".") : hostname;
}

function isServicePayload(payload: unknown): payload is ServiceEntry[] {
  return (
    Array.isArray(payload) &&
    payload.every(
      (service) =>
        service &&
        typeof service === "object" &&
        typeof (service as Partial<ServiceEntry>).id === "string" &&
        typeof (service as Partial<ServiceEntry>).name === "string" &&
        typeof (service as Partial<ServiceEntry>).url === "string" &&
        (service as Partial<ServiceEntry>).url?.startsWith("https://")
    )
  );
}

if (!customElements.get("latch-app")) {
  customElements.define("latch-app", LatchApp);
}
