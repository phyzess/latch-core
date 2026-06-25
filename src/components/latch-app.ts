import "./latch-icon";
import { handDrawnTheme } from "../lib/hand-drawn-theme";
import { bindServiceIconFallbacks } from "../lib/icon-fallbacks";
import { applyShadowStyles } from "../lib/shadow-styles";
import {
  buildServiceSections,
  getServiceDisplayName,
  getServiceHostname,
  getVisibleServices
} from "../lib/service-list";
import type { LatchUserState, ServiceEntry } from "../lib/types";
import {
  emptyUserState,
  isFavorite,
  loadUserState,
  recordServiceOpen,
  saveUserState,
  toggleFavorite
} from "../lib/user-state";

type AppServiceEntry = Omit<ServiceEntry, "name"> & {
  name?: string;
};

type RenderOptions = {
  focusSearch?: boolean;
  focusSelected?: boolean;
};

const appStyles = `
  ${handDrawnTheme}

  .app {
    display: block;
    inline-size: 100%;
    min-block-size: 100dvh;
  }

  .launcher-shell {
    display: grid;
    gap: 22px;
    inline-size: min(620px, calc(100vw - 48px));
    margin-inline: auto;
    padding-block: clamp(46px, 7vw, 76px);
  }

  .app-header {
    align-items: start;
    display: grid;
    gap: 18px;
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .brand-lockup {
    align-items: center;
    display: flex;
    gap: 14px;
    min-inline-size: 0;
  }

  .brand-mark {
    background: var(--latch-note);
    block-size: 48px;
    border: 3px solid var(--latch-pencil);
    border-radius: var(--latch-radius-sm);
    box-shadow: var(--latch-shadow);
    display: block;
    flex: 0 0 auto;
    inline-size: 48px;
    padding: 5px;
    transform: rotate(-2deg);
  }

  .header-copy {
    display: grid;
    gap: 4px;
    min-inline-size: 0;
  }

  .app-title {
    color: var(--latch-pencil);
    font-family:
      "Kalam",
      "Patrick Hand",
      "Segoe Print",
      cursive;
    font-size: clamp(2.55rem, 6vw, 3.5rem);
    font-weight: 700;
    line-height: 0.9;
    margin: 0;
    text-wrap: balance;
  }

  .app-subtitle {
    color: var(--latch-pencil-muted);
    font-size: 1.08rem;
    line-height: 1.2;
    margin: 0;
  }

  .settings-link,
  .retry-button,
  .state-action,
  .clear-search-button {
    align-items: center;
    background: var(--latch-surface);
    border: 3px solid var(--latch-pencil);
    border-radius: var(--latch-radius-sm);
    box-shadow: var(--latch-shadow);
    color: var(--latch-pencil);
    cursor: pointer;
    display: inline-flex;
    font-size: 1rem;
    font-weight: 700;
    gap: 7px;
    min-block-size: 40px;
    padding-inline: 14px;
    text-decoration: none;
    transition:
      background-color 120ms ease,
      box-shadow 120ms ease,
      color 120ms ease,
      transform 120ms ease;
  }

  .settings-link {
    justify-self: end;
    transform: rotate(1deg);
  }

  .settings-link:hover,
  .settings-link:focus-visible,
  .retry-button:hover,
  .retry-button:focus-visible,
  .state-action:hover,
  .state-action:focus-visible,
  .clear-search-button:hover,
  .clear-search-button:focus-visible {
    background: var(--latch-marker);
    color: #ffffff;
    outline: 0;
    transform: translate(2px, 2px) rotate(0deg);
    box-shadow: var(--latch-shadow-pressed);
  }

  .settings-link:focus-visible,
  .retry-button:focus-visible,
  .state-action:focus-visible,
  .clear-search-button:focus-visible,
  .search-input:focus-visible,
  .service-open:focus-visible,
  .favorite-button:focus-visible {
    outline: 0;
    box-shadow:
      var(--latch-shadow-pressed),
      0 0 0 5px var(--latch-focus);
  }

  .settings-link:active,
  .retry-button:active,
  .state-action:active,
  .clear-search-button:active {
    box-shadow: none;
    transform: translate(5px, 5px) rotate(0deg);
  }

  .settings-link latch-icon,
  .retry-button latch-icon,
  .state-action latch-icon,
  .clear-search-button latch-icon {
    --icon-size: 0.9rem;
  }

  .search-panel {
    background: var(--latch-surface);
    border: 3px solid var(--latch-pencil);
    border-radius: var(--latch-radius-lg);
    box-shadow: var(--latch-shadow);
    display: grid;
    gap: 12px;
    grid-template-columns: 24px minmax(0, 1fr) auto;
    min-block-size: 58px;
    padding: 10px 12px 10px 16px;
    transform: rotate(-0.5deg);
  }

  .search-panel latch-icon {
    --icon-size: 1.05rem;
    align-self: center;
    color: var(--latch-pencil-soft);
  }

  .search-input {
    background: transparent;
    border: 0;
    color: var(--latch-pencil);
    font-size: 1.18rem;
    inline-size: 100%;
    min-inline-size: 0;
    outline: 0;
  }

  .search-input::placeholder {
    color: rgba(45, 45, 45, 0.46);
  }

  .search-hint {
    align-self: center;
    color: var(--latch-pencil-muted);
    font-size: 0.88rem;
    white-space: nowrap;
  }

  .search-clear {
    align-items: center;
    background: var(--latch-muted-surface);
    border: 2px dashed var(--latch-pencil);
    border-radius: var(--latch-radius-sm);
    color: var(--latch-pencil);
    cursor: pointer;
    display: inline-grid;
    font-size: 1rem;
    font-weight: 700;
    min-block-size: 32px;
    min-inline-size: 38px;
    place-items: center;
    transition:
      background-color 120ms ease,
      transform 120ms ease;
  }

  .search-clear:hover,
  .search-clear:focus-visible {
    background: var(--latch-note);
    outline: 0;
    transform: rotate(-2deg);
  }

  .service-list {
    display: grid;
    gap: 18px;
  }

  .service-group {
    display: grid;
    gap: 8px;
  }

  .group-title {
    align-self: start;
    background: var(--latch-note);
    border: 2px solid var(--latch-pencil);
    border-radius: var(--latch-radius-sm);
    box-shadow: var(--latch-shadow-soft);
    color: var(--latch-pencil-soft);
    font-size: 0.96rem;
    font-weight: 700;
    justify-self: start;
    line-height: 1.1;
    padding: 5px 11px;
    transform: rotate(-1deg);
  }

  .service-stack {
    background: var(--latch-surface);
    border: 3px solid var(--latch-pencil);
    border-radius: var(--latch-radius-lg);
    box-shadow: var(--latch-shadow);
    display: grid;
    inline-size: 100%;
    overflow: hidden;
    transform: rotate(0.35deg);
  }

  .service-group:nth-child(2n) .service-stack {
    transform: rotate(-0.25deg);
  }

  .service-row {
    align-items: stretch;
    background: transparent;
    border-block-start: 2px dashed rgba(45, 45, 45, 0.32);
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    min-block-size: 72px;
    transition:
      background-color 140ms ease,
      transform 140ms ease;
  }

  .service-row:first-child {
    border-block-start: 0;
  }

  .service-row[data-active="true"] {
    background: rgba(255, 249, 196, 0.72);
  }

  .service-row[data-favorite="true"] {
    background-image: linear-gradient(90deg, rgba(255, 77, 77, 0.1), transparent 38%);
  }

  .service-row:hover {
    background-color: rgba(240, 234, 223, 0.58);
  }

  .service-open {
    align-items: center;
    background: transparent;
    border: 0;
    cursor: pointer;
    display: grid;
    gap: 14px;
    grid-template-columns: 42px minmax(0, 1fr) auto;
    inline-size: 100%;
    min-block-size: 72px;
    padding: 12px 10px 12px 16px;
    text-align: start;
    transition:
      color 140ms ease,
      transform 140ms ease;
  }

  .service-open:active {
    transform: translate(2px, 2px);
  }

  .icon-box {
    align-items: center;
    background: var(--latch-muted-surface);
    border: 2px solid var(--latch-pencil);
    border-radius: var(--latch-radius-sm);
    color: var(--latch-pencil-soft);
    display: grid;
    block-size: 42px;
    box-shadow: 2px 2px 0 0 rgba(45, 45, 45, 0.2);
    inline-size: 42px;
    place-items: center;
    transform: rotate(-1deg);
  }

  .service-row:nth-child(2n) .icon-box {
    transform: rotate(1deg);
  }

  .icon-box latch-icon {
    --icon-size: 1.08rem;
  }

  .icon-box latch-icon[hidden] {
    display: none;
  }

  .service-icon-image {
    block-size: 25px;
    border-radius: 7px;
    display: block;
    inline-size: 25px;
    object-fit: contain;
  }

  .service-icon-image[hidden] {
    display: none;
  }

  .service-copy {
    display: grid;
    gap: 3px;
    min-inline-size: 0;
  }

  .service-name {
    color: var(--latch-pencil);
    display: block;
    font-size: 1.18rem;
    font-weight: 700;
    line-height: 1.05;
    overflow-wrap: anywhere;
  }

  .service-host {
    color: var(--latch-pencil-muted);
    display: block;
    font-size: 0.98rem;
    line-height: 1.12;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .service-accessory {
    align-items: center;
    color: var(--latch-pencil-muted);
    display: flex;
    gap: 9px;
    justify-content: end;
    min-inline-size: 0;
  }

  .shortcut-badge {
    align-items: center;
    background: var(--latch-note);
    border: 2px solid var(--latch-pencil);
    border-radius: var(--latch-radius-sm);
    box-shadow: 2px 2px 0 0 rgba(45, 45, 45, 0.16);
    color: var(--latch-pencil);
    display: inline-grid;
    font-size: 0.78rem;
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    line-height: 1;
    min-block-size: 26px;
    min-inline-size: 30px;
    padding-inline: 7px;
    place-items: center;
    text-transform: uppercase;
    transform: rotate(-1deg);
  }

  .external-icon {
    --icon-size: 0.95rem;
    color: var(--latch-pencil-soft);
    opacity: 0.84;
    transition:
      opacity 140ms ease,
      transform 140ms ease;
  }

  .service-open:hover .external-icon,
  .service-open:focus-visible .external-icon {
    opacity: 1;
    transform: translate(1px, -1px) rotate(4deg);
  }

  .favorite-button {
    align-self: center;
    background: var(--latch-surface);
    border: 2px dashed var(--latch-pencil);
    border-radius: var(--latch-radius-sm);
    box-shadow: 2px 2px 0 0 rgba(45, 45, 45, 0.18);
    color: var(--latch-pencil-soft);
    cursor: pointer;
    display: inline-grid;
    margin-inline-end: 14px;
    min-block-size: 38px;
    min-inline-size: 38px;
    place-items: center;
    transition:
      background-color 120ms ease,
      box-shadow 120ms ease,
      color 120ms ease,
      transform 120ms ease;
  }

  .favorite-button latch-icon {
    --icon-size: 1rem;
  }

  .favorite-button:hover,
  .favorite-button:focus-visible {
    background: var(--latch-note);
    color: var(--latch-marker-dark);
    transform: rotate(-4deg);
  }

  .favorite-button[aria-pressed="true"] {
    background: var(--latch-marker);
    border-style: solid;
    color: #ffffff;
  }

  .favorite-button:active {
    box-shadow: none;
    transform: translate(2px, 2px) rotate(-4deg);
  }

  .state-panel {
    align-items: center;
    background: var(--latch-surface);
    border: 3px solid var(--latch-pencil);
    border-radius: var(--latch-radius-lg);
    box-shadow: var(--latch-shadow);
    display: grid;
    gap: 15px;
    grid-template-columns: 42px minmax(0, 1fr) auto;
    min-block-size: 88px;
    padding: 18px;
    transform: rotate(-0.4deg);
  }

  .state-icon {
    align-items: center;
    background: var(--latch-muted-surface);
    border: 2px solid var(--latch-pencil);
    border-radius: var(--latch-radius-sm);
    color: var(--latch-pencil-soft);
    display: grid;
    block-size: 42px;
    inline-size: 42px;
    place-items: center;
  }

  .state-icon latch-icon {
    --icon-size: 1.08rem;
  }

  .state-copy {
    display: grid;
    gap: 3px;
    min-inline-size: 0;
  }

  .state-title {
    color: var(--latch-pencil);
    font-size: 1.18rem;
    font-weight: 700;
    line-height: 1.1;
  }

  .state-message {
    color: var(--latch-pencil-muted);
    font-size: 0.98rem;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  .error .state-icon {
    background: #ffe3e3;
    color: var(--latch-danger);
  }

  .loading-row {
    align-items: center;
    border-block-start: 2px dashed rgba(45, 45, 45, 0.28);
    display: grid;
    gap: 14px;
    grid-template-columns: 42px minmax(0, 1fr) 34px;
    min-block-size: 72px;
    padding: 13px 16px;
  }

  .loading-row:first-child {
    border-block-start: 0;
  }

  .loading-icon,
  .loading-line,
  .loading-pill {
    animation: shimmer 1200ms ease-in-out infinite;
    background: linear-gradient(90deg, #eee6d8 0%, #fff9eb 48%, #eee6d8 100%);
    background-size: 220% 100%;
    border: 2px solid rgba(45, 45, 45, 0.32);
  }

  .loading-icon {
    block-size: 42px;
    border-radius: var(--latch-radius-sm);
    inline-size: 42px;
  }

  .loading-copy {
    display: grid;
    gap: 8px;
  }

  .loading-line {
    block-size: 12px;
    border-radius: var(--latch-radius-sm);
    inline-size: min(230px, 72%);
  }

  .loading-line.short {
    inline-size: min(170px, 54%);
  }

  .loading-pill {
    block-size: 26px;
    border-radius: var(--latch-radius-sm);
    inline-size: 34px;
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
    .launcher-shell {
      gap: 18px;
      inline-size: calc(100vw - 24px);
      padding-block: 30px 48px;
    }

    .app-header {
      grid-template-columns: 1fr;
    }

    .settings-link {
      justify-self: start;
    }

    .brand-mark {
      block-size: 44px;
      inline-size: 44px;
    }

    .app-title {
      font-size: clamp(2.35rem, 12vw, 3.1rem);
    }

    .search-panel {
      grid-template-columns: 22px minmax(0, 1fr) auto;
      padding-inline: 13px;
    }

    .search-hint {
      display: none;
    }

    .service-open,
    .loading-row {
      gap: 12px;
      grid-template-columns: 40px minmax(0, 1fr) auto;
      min-block-size: 68px;
      padding: 11px 8px 11px 13px;
    }

    .service-row {
      min-block-size: 68px;
    }

    .icon-box,
    .state-icon,
    .loading-icon {
      block-size: 40px;
      inline-size: 40px;
    }

    .favorite-button {
      margin-inline-end: 10px;
      min-block-size: 36px;
      min-inline-size: 36px;
    }

    .state-panel {
      align-items: start;
      grid-template-columns: 40px minmax(0, 1fr);
      padding: 16px;
    }

    .retry-button,
    .state-action,
    .clear-search-button {
      grid-column: 2;
      justify-self: start;
    }
  }

  @media (max-width: 460px) {
    .launcher-shell {
      inline-size: calc(100vw - 20px);
      padding-block-start: 24px;
    }

    .shortcut-badge {
      display: none;
    }

    .service-open {
      grid-template-columns: 40px minmax(0, 1fr);
    }

    .service-accessory {
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
  #services: AppServiceEntry[] = [];
  #state: LatchUserState = emptyUserState();
  #status: "loading" | "ready" | "error" = "loading";
  #errorMessage = "";
  #query = "";
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

  #render(options: RenderOptions = {}): void {
    const visibleServices = this.#getVisibleServices();
    this.#selectedIndex = clamp(this.#selectedIndex, 0, Math.max(visibleServices.length - 1, 0));
    this.#root.querySelector(".app")?.remove();

    const app = document.createElement("main");
    app.className = "app";
    app.setAttribute("aria-label", "Latch service launcher");
    app.innerHTML = this.#renderContent();

    this.#root.append(app);
    this.#bindEvents();

    if (options.focusSearch) {
      this.#focusSearch();
    } else if (options.focusSelected) {
      this.#focusSelectedCard();
    }
  }

  #renderContent(): string {
    const visibleCount = this.#getVisibleServices().length;
    const countLabel =
      this.#status === "ready"
        ? this.#query
          ? `${visibleCount} of ${this.#services.length} services`
          : `${this.#services.length} ${this.#services.length === 1 ? "service" : "services"}`
        : "";

    return `
      <div class="launcher-shell">
        <header class="app-header">
          <div class="brand-lockup">
            <img class="brand-mark" src="/icon.svg" alt="" width="48" height="48" />
            <div class="header-copy">
              <h1 class="app-title">Latch</h1>
              ${countLabel ? `<p class="app-subtitle">${escapeHtml(countLabel)}</p>` : ""}
            </div>
          </div>
          <a class="settings-link" href="/settings">
            <latch-icon name="command" aria-hidden="true"></latch-icon>
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
            <span class="state-title">No services yet</span>
            <span class="state-message">Add your first private link from settings.</span>
          </span>
          <a class="state-action" href="/settings">
            <latch-icon name="command" aria-hidden="true"></latch-icon>
            <span>Open settings</span>
          </a>
        </div>
      `;
    }

    return `
      ${this.#renderSearch()}
      ${this.#renderServices()}
    `;
  }

  #renderSearch(): string {
    const clearButton = this.#query
      ? `<button class="search-clear" type="button" data-action="clear-search" aria-label="Clear search">Clear</button>`
      : `<span class="search-hint" aria-hidden="true">Find</span>`;

    return `
      <form class="search-panel" role="search" data-action="search-form">
        <latch-icon name="search" aria-hidden="true"></latch-icon>
        <input
          class="search-input"
          data-field="service-search"
          type="search"
          autocomplete="off"
          spellcheck="false"
          placeholder="Search names, hosts, tags"
          value="${escapeAttribute(this.#query)}"
          aria-label="Search services"
        />
        ${clearButton}
      </form>
    `;
  }

  #renderServices(): string {
    const sections = buildServiceSections(this.#services, this.#state, this.#query);
    if (sections.length === 0) {
      return `
        <div class="state-panel" role="status">
          <span class="state-icon" aria-hidden="true">
            <latch-icon name="search"></latch-icon>
          </span>
          <span class="state-copy">
            <span class="state-title">No matching services</span>
            <span class="state-message">Try a service name, alias, host, group, or tag.</span>
          </span>
          <button class="clear-search-button" type="button" data-action="clear-search">Clear search</button>
        </div>
      `;
    }

    let index = 0;
    return `
      <nav class="service-list" aria-label="Services">
        ${sections
          .map((section) => {
            const services = section.services
              .map((service) => this.#renderService(service, index++))
              .join("");
            return `
              <section class="service-group">
                ${section.title ? `<h2 class="group-title">${escapeHtml(section.title)}</h2>` : ""}
                <div class="service-stack">${services}</div>
              </section>
            `;
          })
          .join("")}
      </nav>
    `;
  }

  #renderLoading(): string {
    return `
      <div class="service-list" role="status" aria-live="polite" aria-label="Loading services">
        <span class="sr-only">Loading services</span>
        <section class="service-group">
          <div class="service-stack">
            ${Array.from({ length: 4 }, () => this.#renderLoadingRow()).join("")}
          </div>
        </section>
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

  #renderService(service: AppServiceEntry, index: number): string {
    const selected = index === this.#selectedIndex;
    const favorite = isFavorite(this.#state, service.id);
    const host = getServiceHostname(service);
    const name = getServiceDisplayName(service);
    const shortcut = service.shortcut
      ? `<span class="shortcut-badge" aria-hidden="true">${escapeHtml(service.shortcut)}</span>`
      : "";
    const favoriteLabel = favorite ? `Remove ${name} from favorites` : `Add ${name} to favorites`;

    return `
      <div class="service-row" data-active="${selected ? "true" : "false"}" data-favorite="${favorite ? "true" : "false"}">
        <button
          class="service-open"
          part="item"
          type="button"
          data-action="open-service"
          data-service-id="${escapeAttribute(service.id)}"
          data-service-index="${index}"
          aria-label="Open ${escapeAttribute(name)} (${escapeAttribute(host)})"
        >
          <span class="icon-box" aria-hidden="true">
            ${renderServiceIcon(service)}
          </span>
          <span class="service-copy">
            <span class="service-name" part="label">${escapeHtml(name)}</span>
            <span class="service-host">${escapeHtml(host)}</span>
          </span>
          <span class="service-accessory" aria-hidden="true">
            ${shortcut}
            <latch-icon class="external-icon" name="external"></latch-icon>
          </span>
        </button>
        <button
          class="favorite-button"
          type="button"
          data-action="toggle-favorite"
          data-service-id="${escapeAttribute(service.id)}"
          aria-label="${escapeAttribute(favoriteLabel)}"
          aria-pressed="${favorite ? "true" : "false"}"
        >
          <latch-icon name="star" aria-hidden="true"></latch-icon>
        </button>
      </div>
    `;
  }

  #bindEvents(): void {
    this.#root
      .querySelector<HTMLFormElement>("[data-action='search-form']")
      ?.addEventListener("submit", (event) => {
        event.preventDefault();
        this.#openSelectedService();
      });

    this.#root
      .querySelector<HTMLInputElement>("[data-field='service-search']")
      ?.addEventListener("input", (event) => {
        this.#query = (event.currentTarget as HTMLInputElement).value;
        this.#selectedIndex = 0;
        this.#render({ focusSearch: true });
      });

    this.#root
      .querySelector<HTMLInputElement>("[data-field='service-search']")
      ?.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowRight") {
          event.preventDefault();
          this.#moveSelection(1);
          return;
        }

        if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
          event.preventDefault();
          this.#moveSelection(-1);
          return;
        }

        if (event.key === "Escape" && this.#query) {
          event.preventDefault();
          this.#clearSearch(true);
        }
      });

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
          this.#selectedIndex = clamp(index, 0, Math.max(this.#getVisibleServices().length - 1, 0));
          this.#syncActiveService();
        }
      });
    }

    for (const element of this.#root.querySelectorAll<HTMLButtonElement>(
      "[data-action='toggle-favorite']"
    )) {
      element.addEventListener("click", () => {
        const service = this.#findService(element.dataset.serviceId);
        if (service) {
          this.#toggleFavorite(service);
        }
      });
    }

    this.#root
      .querySelector<HTMLButtonElement>("[data-action='retry-services']")
      ?.addEventListener("click", () => {
        void this.#loadServices();
      });

    for (const element of this.#root.querySelectorAll<HTMLButtonElement>(
      "[data-action='clear-search']"
    )) {
      element.addEventListener("click", () => this.#clearSearch(true));
    }

    this.#bindIconFallbacks();
  }

  #bindIconFallbacks(): void {
    bindServiceIconFallbacks(this.#root);
  }

  #onDocumentKeydown(event: KeyboardEvent): void {
    if (this.#status !== "ready") {
      return;
    }

    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    if (isTextEntryEvent(event)) {
      return;
    }

    if (event.key === "/" && this.#services.length > 0) {
      event.preventDefault();
      this.#focusSearch();
      return;
    }

    if (/^[a-z0-9]$/i.test(event.key)) {
      const service = this.#services.find(
        (entry) => entry.shortcut?.toLowerCase() === event.key.toLowerCase()
      );
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
      return;
    }

    if (event.key === "Escape" && this.#query) {
      event.preventDefault();
      this.#clearSearch();
    }
  }

  #moveSelection(delta: number): void {
    const visibleServices = this.#getVisibleServices();
    if (visibleServices.length === 0) {
      this.#selectedIndex = 0;
      return;
    }

    this.#selectedIndex = clamp(this.#selectedIndex + delta, 0, visibleServices.length - 1);
    this.#render({ focusSelected: true });
  }

  #openSelectedService(event?: KeyboardEvent): void {
    const service = this.#getVisibleServices()[this.#selectedIndex];
    if (service) {
      event?.preventDefault();
      this.#openService(service);
    }
  }

  #openService(service: AppServiceEntry): void {
    this.#state = recordServiceOpen(this.#state, service.id);
    saveUserState(this.#state);
    this.#render();
    window.open(service.url, "_blank", "noopener,noreferrer");
  }

  #toggleFavorite(service: AppServiceEntry): void {
    this.#state = toggleFavorite(this.#state, service.id);
    saveUserState(this.#state);
    this.#selectedIndex = clamp(
      this.#selectedIndex,
      0,
      Math.max(this.#getVisibleServices().length - 1, 0)
    );
    this.#render({ focusSelected: true });
  }

  #clearSearch(focusSearch = false): void {
    this.#query = "";
    this.#selectedIndex = 0;
    this.#render({ focusSearch });
  }

  #getVisibleServices(): AppServiceEntry[] {
    if (this.#status !== "ready") {
      return [];
    }

    return getVisibleServices(this.#services, this.#state, this.#query);
  }

  #findService(serviceId: string | undefined): AppServiceEntry | undefined {
    if (!serviceId) {
      return undefined;
    }

    return this.#services.find((service) => service.id === serviceId);
  }

  #focusSearch(): void {
    queueMicrotask(() => {
      const input = this.#root.querySelector<HTMLInputElement>("[data-field='service-search']");
      if (!input) {
        return;
      }

      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    });
  }

  #focusSelectedCard(): void {
    queueMicrotask(() => {
      this.#root
        .querySelector<HTMLButtonElement>(".service-row[data-active='true'] .service-open")
        ?.focus();
    });
  }

  #syncActiveService(): void {
    for (const element of this.#root.querySelectorAll<HTMLElement>(".service-row")) {
      const openButton = element.querySelector<HTMLButtonElement>("[data-action='open-service']");
      element.dataset.active =
        Number(openButton?.dataset.serviceIndex) === this.#selectedIndex ? "true" : "false";
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

function renderServiceIcon(service: AppServiceEntry): string {
  const fallbackIcon = escapeAttribute(service.icon ?? "service");
  if (service.icon || !service.iconUrl) {
    return `<latch-icon name="${fallbackIcon}"></latch-icon>`;
  }

  return `
    <img class="service-icon-image" src="${escapeAttribute(service.iconUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer" />
    <latch-icon name="${fallbackIcon}" hidden></latch-icon>
  `;
}

function isTextEntryEvent(event: KeyboardEvent): boolean {
  const target = event.composedPath()[0];
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

function isServicePayload(payload: unknown): payload is AppServiceEntry[] {
  return (
    Array.isArray(payload) &&
    payload.every(
      (service) =>
        service &&
        typeof service === "object" &&
        typeof (service as Partial<AppServiceEntry>).id === "string" &&
        (typeof (service as Partial<AppServiceEntry>).name === "undefined" ||
          typeof (service as Partial<AppServiceEntry>).name === "string") &&
        typeof (service as Partial<AppServiceEntry>).url === "string" &&
        (service as Partial<AppServiceEntry>).url?.startsWith("https://") &&
        (typeof (service as Partial<AppServiceEntry>).icon !== "string" ||
          /^[a-z0-9-]+$/i.test((service as Partial<AppServiceEntry>).icon ?? "")) &&
        (typeof (service as Partial<AppServiceEntry>).iconUrl !== "string" ||
          (service as Partial<AppServiceEntry>).iconUrl?.startsWith("https://")) &&
        (typeof (service as Partial<AppServiceEntry>).shortcut !== "string" ||
          /^[a-z0-9]$/i.test((service as Partial<AppServiceEntry>).shortcut ?? "")) &&
        (typeof (service as Partial<AppServiceEntry>).group === "undefined" ||
          typeof (service as Partial<AppServiceEntry>).group === "string") &&
        (typeof (service as Partial<AppServiceEntry>).pinned === "undefined" ||
          typeof (service as Partial<AppServiceEntry>).pinned === "boolean") &&
        isOptionalStringArray((service as Partial<AppServiceEntry>).aliases) &&
        isOptionalStringArray((service as Partial<AppServiceEntry>).tags)
    )
  );
}

function isOptionalStringArray(value: unknown): boolean {
  return (
    typeof value === "undefined" ||
    (Array.isArray(value) && value.every((item) => typeof item === "string"))
  );
}

if (!customElements.get("latch-app")) {
  customElements.define("latch-app", LatchApp);
}
