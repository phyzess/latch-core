import "./latch-icon";
import { DEFAULT_SERVICE_CONFIG_YAML } from "../lib/default-service-config";
import { applyShadowStyles } from "../lib/shadow-styles";
import {
  ConfigValidationError,
  parseServiceConfigSource,
  type ServiceEntry
} from "../lib/service-config";

type SessionResponse = {
  configured: boolean;
  email: string;
  isAdmin: boolean;
};

type RevisionSummary = {
  id: string;
  savedAt: string;
  savedBy: string;
  serviceCount: number;
};

type ConfigResponse = {
  configured: boolean;
  raw: string;
  revisions: RevisionSummary[];
  services: ServiceEntry[];
};

const settingsStyles = `
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
    --latch-danger: #b42318;
    --latch-success: #147a4b;
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

  button,
  textarea,
  select {
    color: inherit;
    font: inherit;
    letter-spacing: inherit;
  }

  .settings-shell {
    display: grid;
    gap: 18px;
    inline-size: min(920px, calc(100vw - 48px));
    margin-inline: auto;
    padding-block: clamp(34px, 6vw, 68px);
  }

  .top-row,
  .header-actions,
  .action-row {
    align-items: center;
    display: flex;
    gap: 10px;
  }

  .top-row {
    justify-content: space-between;
  }

  .brand-link {
    align-items: center;
    color: var(--latch-ink);
    display: inline-flex;
    font-size: 0.9rem;
    font-weight: 680;
    gap: 8px;
    text-decoration: none;
  }

  .brand-link latch-icon {
    --icon-size: 0.92rem;
  }

  .header {
    display: grid;
    gap: 6px;
  }

  .title {
    font-size: clamp(1.72rem, 4vw, 2.1rem);
    font-weight: 740;
    line-height: 1.04;
    margin: 0;
  }

  .subtitle,
  .meta-text {
    color: var(--latch-muted);
    font-size: 0.9rem;
    line-height: 1.35;
    margin: 0;
  }

  .workspace {
    display: grid;
    gap: 16px;
    grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
  }

  .panel,
  .state-panel {
    background: var(--latch-surface);
    border: 1px solid var(--latch-line);
    border-radius: 14px;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  }

  .editor-panel {
    display: grid;
    gap: 12px;
    padding: 14px;
  }

  .config-editor {
    background: #101418;
    border: 1px solid #242b33;
    border-radius: 10px;
    color: #f7fafc;
    font-family:
      "SF Mono",
      "Roboto Mono",
      ui-monospace,
      monospace;
    font-size: 0.86rem;
    line-height: 1.55;
    min-block-size: 520px;
    padding: 14px;
    resize: vertical;
    tab-size: 2;
    white-space: pre;
    width: 100%;
  }

  .config-editor:focus {
    border-color: rgba(22, 119, 255, 0.74);
    box-shadow: 0 0 0 4px rgba(22, 119, 255, 0.18);
    outline: 0;
  }

  .side-column {
    display: grid;
    gap: 16px;
  }

  .panel-section {
    display: grid;
    gap: 12px;
    padding: 14px;
  }

  .panel-title {
    color: var(--latch-strong);
    font-size: 0.83rem;
    font-weight: 720;
    letter-spacing: 0;
    margin: 0;
    text-transform: uppercase;
  }

  .preview-list,
  .revision-list,
  .message-list {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
  }

  .preview-item {
    align-items: center;
    border: 1px solid var(--latch-line);
    border-radius: 10px;
    display: grid;
    gap: 10px;
    grid-template-columns: 34px minmax(0, 1fr);
    min-block-size: 54px;
    padding: 9px 10px;
  }

  .icon-box {
    align-items: center;
    background: var(--latch-fill);
    border-radius: 9px;
    color: var(--latch-strong);
    display: grid;
    block-size: 34px;
    inline-size: 34px;
    place-items: center;
  }

  .icon-box latch-icon {
    --icon-size: 0.92rem;
  }

  .item-copy {
    display: grid;
    gap: 2px;
    min-inline-size: 0;
  }

  .item-name {
    color: var(--latch-ink);
    font-size: 0.9rem;
    font-weight: 660;
    overflow-wrap: anywhere;
  }

  .item-meta {
    color: var(--latch-muted);
    font-size: 0.8rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .message {
    border-radius: 10px;
    font-size: 0.84rem;
    line-height: 1.38;
    padding: 10px 11px;
  }

  .message.error {
    background: #fff5f5;
    border: 1px solid #ffd6d2;
    color: var(--latch-danger);
  }

  .message.success {
    background: #effbf4;
    border: 1px solid #cdeeda;
    color: var(--latch-success);
  }

  .message.neutral {
    background: var(--latch-tint);
    border: 1px solid var(--latch-line);
    color: var(--latch-muted);
  }

  .message-list {
    padding-inline-start: 18px;
  }

  .button {
    align-items: center;
    background: #ffffff;
    border: 1px solid var(--latch-line);
    border-radius: 9px;
    cursor: pointer;
    display: inline-flex;
    font-size: 0.84rem;
    font-weight: 670;
    gap: 7px;
    justify-content: center;
    min-block-size: 34px;
    padding-inline: 12px;
    text-decoration: none;
    transition:
      background-color 160ms ease,
      box-shadow 160ms ease,
      transform 160ms ease;
  }

  .button.primary {
    background: var(--latch-brand);
    border-color: var(--latch-brand);
    color: #ffffff;
  }

  .button:hover,
  .button:focus-visible,
  .revision-select:focus-visible {
    box-shadow: 0 0 0 4px rgba(22, 119, 255, 0.16);
    outline: 0;
  }

  .button:not(:disabled):active {
    transform: translateY(1px);
  }

  .button:disabled {
    cursor: not-allowed;
    opacity: 0.48;
  }

  .button latch-icon {
    --icon-size: 0.9rem;
  }

  .revision-select {
    background: #ffffff;
    border: 1px solid var(--latch-line);
    border-radius: 9px;
    min-block-size: 34px;
    min-inline-size: 0;
    padding-inline: 10px;
    width: 100%;
  }

  .state-panel {
    align-items: center;
    display: grid;
    gap: 14px;
    grid-template-columns: 40px minmax(0, 1fr);
    min-block-size: 80px;
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

  @media (max-width: 820px) {
    .settings-shell {
      inline-size: calc(100vw - 24px);
      padding-block: 24px;
    }

    .top-row {
      align-items: start;
      flex-direction: column;
    }

    .workspace {
      grid-template-columns: 1fr;
    }

    .config-editor {
      min-block-size: 420px;
    }
  }
`;

export class LatchSettings extends HTMLElement {
  #root: ShadowRoot;
  #status: "loading" | "ready" | "error" = "loading";
  #session: SessionResponse | undefined;
  #configured = false;
  #raw = DEFAULT_SERVICE_CONFIG_YAML;
  #draftServices: ServiceEntry[] = [];
  #revisions: RevisionSummary[] = [];
  #validationMessage = "";
  #validationDetails: string[] = [];
  #notice = "";
  #errorMessage = "";
  #isSaving = false;
  #selectedRevisionId = "";

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open", delegatesFocus: true });
    applyShadowStyles(this.#root, settingsStyles);
  }

  connectedCallback(): void {
    this.#render();
    void this.#load();
  }

  async #load(): Promise<void> {
    this.#status = "loading";
    this.#errorMessage = "";
    this.#notice = "";
    this.#render();

    try {
      this.#session = await fetchJson<SessionResponse>("/api/session");
      if (this.#session.isAdmin) {
        const config = await fetchJson<ConfigResponse>("/api/config");
        this.#applyConfig(config);
      }
      this.#status = "ready";
    } catch (error) {
      this.#status = "error";
      this.#errorMessage = error instanceof Error ? error.message : "Could not load settings.";
    }

    this.#validateDraft();
    this.#render();
  }

  async #save(): Promise<void> {
    this.#validateDraft();
    this.#notice = "";
    if (this.#validationMessage) {
      this.#syncDraftPanels();
      return;
    }

    this.#isSaving = true;
    this.#render();

    try {
      const config = await fetchJson<ConfigResponse>("/api/config", {
        body: JSON.stringify({ raw: this.#raw }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "PUT"
      });
      this.#applyConfig(config);
      this.#notice = "Saved";
    } catch (error) {
      this.#notice = "";
      this.#validationMessage = error instanceof Error ? error.message : "Could not save config.";
    }

    this.#isSaving = false;
    this.#render();
  }

  async #rollback(): Promise<void> {
    if (!this.#selectedRevisionId) {
      return;
    }

    this.#isSaving = true;
    this.#notice = "";
    this.#render();

    try {
      const config = await fetchJson<ConfigResponse>("/api/rollback", {
        body: JSON.stringify({ revisionId: this.#selectedRevisionId }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      this.#applyConfig(config);
      this.#notice = "Restored";
    } catch (error) {
      this.#validationMessage =
        error instanceof Error ? error.message : "Could not restore revision.";
    }

    this.#isSaving = false;
    this.#render();
  }

  #applyConfig(config: ConfigResponse): void {
    this.#configured = config.configured;
    this.#raw = config.raw;
    this.#draftServices = config.services;
    this.#revisions = config.revisions;
    this.#selectedRevisionId = this.#revisions[0]?.id ?? "";
    this.#validationMessage = "";
    this.#validationDetails = [];
  }

  #validateDraft(): void {
    try {
      this.#draftServices = parseServiceConfigSource(this.#raw, {
        mode: "private"
      });
      this.#validationMessage = "";
      this.#validationDetails = [];
    } catch (error) {
      this.#draftServices = [];
      if (error instanceof ConfigValidationError) {
        this.#validationMessage = error.message;
        this.#validationDetails = error.details;
      } else {
        this.#validationMessage =
          error instanceof Error ? error.message : "Invalid service config.";
        this.#validationDetails = [];
      }
    }
  }

  #render(): void {
    this.#root.querySelector(".settings-shell")?.remove();

    const shell = document.createElement("main");
    shell.className = "settings-shell";
    shell.setAttribute("aria-label", "Latch settings");
    shell.innerHTML = this.#renderContent();

    this.#root.append(shell);
    this.#bindEvents();
  }

  #renderContent(): string {
    return `
      <div class="top-row">
        <a class="brand-link" href="/">
          <latch-icon name="link" aria-hidden="true"></latch-icon>
          <span>Latch</span>
        </a>
        <div class="header-actions">
          <a class="button" href="/">
            <latch-icon name="external" aria-hidden="true"></latch-icon>
            <span>Launcher</span>
          </a>
          <button class="button" type="button" data-action="reload">
            <latch-icon name="refresh" aria-hidden="true"></latch-icon>
            <span>Reload</span>
          </button>
        </div>
      </div>
      <header class="header">
        <h1 class="title">Settings</h1>
        ${this.#session ? `<p class="subtitle">${escapeHtml(this.#session.email)}</p>` : ""}
      </header>
      ${this.#renderBody()}
    `;
  }

  #renderBody(): string {
    if (this.#status === "loading") {
      return this.#renderState("service", "Loading settings", "");
    }

    if (this.#status === "error") {
      return this.#renderState("alert", "Could not load settings", this.#errorMessage);
    }

    if (!this.#session?.isAdmin) {
      return this.#renderState("alert", "Access denied", "Admin access required");
    }

    return `
      <section class="workspace">
        <div class="panel editor-panel">
          <textarea class="config-editor" spellcheck="false" data-field="raw">${escapeHtml(
            this.#raw
          )}</textarea>
          <div class="action-row">
            <button class="button primary" type="button" data-action="save" ${
              this.#isSaving || this.#validationMessage ? "disabled" : ""
            }>
              <latch-icon name="save" aria-hidden="true"></latch-icon>
              <span>${this.#isSaving ? "Saving" : "Save"}</span>
            </button>
            <span class="meta-text">${this.#configured ? "Configured" : "Not configured"}</span>
          </div>
        </div>
        <aside class="side-column">
          <section class="panel panel-section">
            <h2 class="panel-title">Validation</h2>
            <div class="validation-slot">${this.#renderValidation()}</div>
          </section>
          <section class="panel panel-section">
            <h2 class="panel-title">Preview</h2>
            <div class="preview-slot">${this.#renderPreview()}</div>
          </section>
          <section class="panel panel-section">
            <h2 class="panel-title">Revisions</h2>
            ${this.#renderRevisions()}
          </section>
        </aside>
      </section>
    `;
  }

  #renderState(icon: string, title: string, message: string): string {
    return `
      <div class="state-panel" role="${icon === "alert" ? "alert" : "status"}">
        <span class="state-icon" aria-hidden="true">
          <latch-icon name="${escapeAttribute(icon)}"></latch-icon>
        </span>
        <span class="item-copy">
          <span class="item-name">${escapeHtml(title)}</span>
          ${message ? `<span class="item-meta">${escapeHtml(message)}</span>` : ""}
        </span>
      </div>
    `;
  }

  #renderValidation(): string {
    if (this.#validationMessage) {
      const details = this.#validationDetails.length
        ? `<ul class="message-list">${this.#validationDetails
            .map((detail) => `<li>${escapeHtml(detail)}</li>`)
            .join("")}</ul>`
        : "";
      return `
        <div class="message error">
          <strong>${escapeHtml(this.#validationMessage)}</strong>
          ${details}
        </div>
      `;
    }

    if (this.#notice) {
      return `<div class="message success">${escapeHtml(this.#notice)}</div>`;
    }

    return `<div class="message neutral">${this.#draftServices.length} services valid</div>`;
  }

  #renderPreview(): string {
    if (this.#draftServices.length === 0) {
      return `<div class="message neutral">No valid services</div>`;
    }

    return `
      <div class="preview-list">
        ${this.#draftServices.map((service) => this.#renderService(service)).join("")}
      </div>
    `;
  }

  #renderService(service: ServiceEntry): string {
    const host = new URL(service.url).hostname;
    return `
      <div class="preview-item">
        <span class="icon-box" aria-hidden="true">
          <latch-icon name="${escapeAttribute(service.icon ?? "service")}"></latch-icon>
        </span>
        <span class="item-copy">
          <span class="item-name">${escapeHtml(service.name)}</span>
          <span class="item-meta">${escapeHtml(host)}</span>
        </span>
      </div>
    `;
  }

  #renderRevisions(): string {
    if (this.#revisions.length === 0) {
      return `<div class="message neutral">No revisions</div>`;
    }

    return `
      <select class="revision-select" data-field="revision">
        ${this.#revisions
          .map(
            (revision) => `
              <option value="${escapeAttribute(revision.id)}" ${
                revision.id === this.#selectedRevisionId ? "selected" : ""
              }>
                ${escapeHtml(formatRevision(revision))}
              </option>
            `
          )
          .join("")}
      </select>
      <button class="button" type="button" data-action="rollback" ${this.#isSaving ? "disabled" : ""}>
        <latch-icon name="refresh" aria-hidden="true"></latch-icon>
        <span>Restore</span>
      </button>
    `;
  }

  #bindEvents(): void {
    this.#root
      .querySelector<HTMLButtonElement>("[data-action='reload']")
      ?.addEventListener("click", () => {
        void this.#load();
      });

    this.#root
      .querySelector<HTMLTextAreaElement>("[data-field='raw']")
      ?.addEventListener("input", (event) => {
        this.#raw = (event.currentTarget as HTMLTextAreaElement).value;
        this.#notice = "";
        this.#validateDraft();
        this.#syncDraftPanels();
      });

    this.#root
      .querySelector<HTMLButtonElement>("[data-action='save']")
      ?.addEventListener("click", () => {
        void this.#save();
      });

    (
      this.#root.querySelector("[data-field='revision']") as HTMLSelectElement | null
    )?.addEventListener("change", (event: Event) => {
      this.#selectedRevisionId = (event.currentTarget as HTMLSelectElement).value;
    });

    this.#root
      .querySelector<HTMLButtonElement>("[data-action='rollback']")
      ?.addEventListener("click", () => {
        void this.#rollback();
      });
  }

  #syncDraftPanels(): void {
    const validation = this.#root.querySelector(".validation-slot");
    if (validation) {
      validation.innerHTML = this.#renderValidation();
    }

    const preview = this.#root.querySelector(".preview-slot");
    if (preview) {
      preview.innerHTML = this.#renderPreview();
    }

    const save = this.#root.querySelector<HTMLButtonElement>("[data-action='save']");
    if (save) {
      save.disabled = this.#isSaving || Boolean(this.#validationMessage);
    }
  }
}

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    cache: "no-store",
    credentials: "same-origin",
    ...init
  });
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await response.json()) as unknown)
    : await response.text();

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, response.status));
  }

  return payload as T;
}

function getErrorMessage(payload: unknown, status: number): string {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof (payload as { error?: { message?: unknown } }).error?.message === "string"
  ) {
    const error = (payload as { error: { details?: unknown; message: string } }).error;
    const details = Array.isArray(error.details) ? error.details.join(" ") : "";
    return details ? `${error.message} ${details}` : error.message;
  }

  return typeof payload === "string" && payload ? payload : `Request failed (${status}).`;
}

function formatRevision(revision: RevisionSummary): string {
  return `${new Date(revision.savedAt).toLocaleString()} · ${revision.serviceCount} services`;
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

if (!customElements.get("latch-settings")) {
  customElements.define("latch-settings", LatchSettings);
}
