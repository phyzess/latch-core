import "./latch-icon";
import { DEFAULT_SERVICE_CONFIG_YAML } from "../lib/default-service-config";
import { handDrawnTheme } from "../lib/hand-drawn-theme";
import { bindServiceIconFallbacks } from "../lib/icon-fallbacks";
import { applyShadowStyles } from "../lib/shadow-styles";
import { getServiceDisplayName, getServiceHostname } from "../lib/service-list";
import {
  ConfigValidationError,
  parseServiceConfigSource,
  type ServiceConfigEntry,
  type ServiceEntry
} from "../lib/service-config";

type PreviewServiceEntry = ServiceConfigEntry & {
  iconUrl?: string;
};

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
  ${handDrawnTheme}

  .settings-shell {
    display: grid;
    gap: 20px;
    inline-size: min(1040px, calc(100vw - 48px));
    margin-inline: auto;
    padding-block: clamp(30px, 5vw, 58px) clamp(46px, 7vw, 76px);
  }

  .top-row,
  .header-actions,
  .action-row,
  .revision-actions {
    align-items: center;
    display: flex;
    gap: 10px;
  }

  .top-row {
    justify-content: space-between;
  }

  .brand-link,
  .button {
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
    justify-content: center;
    min-block-size: 40px;
    padding-inline: 13px;
    text-decoration: none;
    transition:
      background-color 120ms ease,
      box-shadow 120ms ease,
      color 120ms ease,
      opacity 120ms ease,
      transform 120ms ease;
  }

  .brand-link {
    transform: rotate(-1deg);
  }

  .button.primary {
    background: var(--latch-marker);
    color: #ffffff;
  }

  .brand-link:hover,
  .brand-link:focus-visible,
  .button:not(:disabled):hover,
  .button:not(:disabled):focus-visible {
    background: var(--latch-pen);
    color: #ffffff;
    outline: 0;
    transform: translate(2px, 2px) rotate(0deg);
    box-shadow: var(--latch-shadow-pressed);
  }

  .button.primary:not(:disabled):hover,
  .button.primary:not(:disabled):focus-visible {
    background: var(--latch-marker-dark);
  }

  .brand-link:focus-visible,
  .button:focus-visible,
  .revision-select:focus-visible,
  .config-editor:focus-visible {
    outline: 0;
    box-shadow:
      var(--latch-shadow-pressed),
      0 0 0 5px var(--latch-focus);
  }

  .brand-link:active,
  .button:not(:disabled):active {
    box-shadow: none;
    transform: translate(5px, 5px) rotate(0deg);
  }

  .button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .brand-link latch-icon,
  .button latch-icon {
    --icon-size: 0.92rem;
  }

  .header {
    display: grid;
    gap: 8px;
  }

  .title {
    color: var(--latch-pencil);
    font-family:
      "Kalam",
      "Patrick Hand",
      "Segoe Print",
      cursive;
    font-size: clamp(2.55rem, 5vw, 3.55rem);
    font-weight: 700;
    line-height: 0.92;
    margin: 0;
    text-wrap: balance;
  }

  .subtitle,
  .meta-text,
  .editor-status {
    color: var(--latch-pencil-muted);
    font-size: 1rem;
    line-height: 1.28;
    margin: 0;
  }

  .workspace {
    align-items: start;
    display: grid;
    gap: 18px;
    grid-template-columns: minmax(0, 1.1fr) minmax(300px, 0.9fr);
  }

  .panel,
  .state-panel {
    background: var(--latch-surface);
    border: 3px solid var(--latch-pencil);
    border-radius: var(--latch-radius-lg);
    box-shadow: var(--latch-shadow);
  }

  .editor-panel {
    display: grid;
    gap: 13px;
    padding: 15px;
    transform: rotate(-0.25deg);
  }

  .editor-label-row {
    align-items: baseline;
    display: flex;
    gap: 12px;
    justify-content: space-between;
  }

  .editor-label {
    color: var(--latch-pencil-soft);
    font-size: 1.08rem;
    font-weight: 700;
  }

  .config-editor {
    background:
      linear-gradient(rgba(45, 93, 161, 0.08) 1px, transparent 1px),
      #fffefb;
    background-size: 100% 32px;
    border: 3px solid var(--latch-pencil);
    border-radius: var(--latch-radius-md);
    box-shadow: inset 3px 3px 0 0 rgba(45, 45, 45, 0.06);
    color: var(--latch-pencil);
    font-family:
      "SF Mono",
      "Roboto Mono",
      ui-monospace,
      monospace;
    font-size: 0.88rem;
    line-height: 1.58;
    min-block-size: 536px;
    padding: 15px;
    resize: vertical;
    tab-size: 2;
    white-space: pre;
    width: 100%;
  }

  .side-column {
    display: grid;
    gap: 16px;
  }

  .panel-section {
    display: grid;
    gap: 12px;
    padding: 15px;
  }

  .panel-section:nth-child(2n) {
    transform: rotate(0.35deg);
  }

  .panel-title {
    align-self: start;
    background: var(--latch-note);
    border: 2px solid var(--latch-pencil);
    border-radius: var(--latch-radius-sm);
    box-shadow: var(--latch-shadow-soft);
    color: var(--latch-pencil-soft);
    font-size: 0.98rem;
    font-weight: 700;
    justify-self: start;
    line-height: 1.1;
    margin: 0;
    padding: 5px 10px;
    transform: rotate(-1deg);
  }

  .preview-list,
  .revision-list,
  .message-list {
    display: grid;
    gap: 9px;
    margin: 0;
    padding: 0;
  }

  .preview-item {
    align-items: center;
    background: rgba(253, 251, 247, 0.74);
    border: 2px dashed rgba(45, 45, 45, 0.58);
    border-radius: var(--latch-radius-md);
    display: grid;
    gap: 11px;
    grid-template-columns: 38px minmax(0, 1fr);
    min-block-size: 60px;
    padding: 10px 11px;
  }

  .preview-item:nth-child(2n) {
    transform: rotate(-0.3deg);
  }

  .icon-box {
    align-items: center;
    background: var(--latch-muted-surface);
    border: 2px solid var(--latch-pencil);
    border-radius: var(--latch-radius-sm);
    color: var(--latch-pencil-soft);
    display: grid;
    block-size: 38px;
    box-shadow: 2px 2px 0 0 rgba(45, 45, 45, 0.18);
    inline-size: 38px;
    place-items: center;
  }

  .icon-box latch-icon {
    --icon-size: 0.98rem;
  }

  .icon-box latch-icon[hidden] {
    display: none;
  }

  .service-icon-image {
    block-size: 23px;
    border-radius: 6px;
    display: block;
    inline-size: 23px;
    object-fit: contain;
  }

  .service-icon-image[hidden] {
    display: none;
  }

  .item-copy {
    display: grid;
    gap: 2px;
    min-inline-size: 0;
  }

  .item-name {
    color: var(--latch-pencil);
    font-size: 1.02rem;
    font-weight: 700;
    line-height: 1.08;
    overflow-wrap: anywhere;
  }

  .item-meta {
    color: var(--latch-pencil-muted);
    font-size: 0.92rem;
    line-height: 1.12;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .message {
    border: 2px solid var(--latch-pencil);
    border-radius: var(--latch-radius-md);
    box-shadow: var(--latch-shadow-soft);
    font-size: 0.98rem;
    line-height: 1.32;
    padding: 11px 12px;
  }

  .message.error {
    background: #ffe3e3;
    color: var(--latch-danger);
  }

  .message.success {
    background: #e4f6e9;
    color: var(--latch-success);
  }

  .message.neutral {
    background: var(--latch-muted-surface);
    color: var(--latch-pencil-muted);
  }

  .message-list {
    padding-inline-start: 20px;
  }

  .revision-select {
    background: var(--latch-surface);
    border: 3px solid var(--latch-pencil);
    border-radius: var(--latch-radius-sm);
    box-shadow: var(--latch-shadow-soft);
    min-block-size: 40px;
    min-inline-size: 0;
    padding-inline: 10px;
    width: 100%;
  }

  .revision-detail {
    color: var(--latch-pencil-muted);
    font-size: 0.94rem;
    line-height: 1.25;
    margin: 0;
  }

  .state-panel {
    align-items: center;
    display: grid;
    gap: 15px;
    grid-template-columns: 42px minmax(0, 1fr);
    min-block-size: 88px;
    padding: 18px;
    transform: rotate(-0.35deg);
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

  @media (max-width: 860px) {
    .settings-shell {
      inline-size: calc(100vw - 24px);
      padding-block: 24px 48px;
    }

    .top-row {
      align-items: start;
      flex-direction: column;
    }

    .header-actions {
      flex-wrap: wrap;
    }

    .workspace {
      grid-template-columns: 1fr;
    }

    .config-editor {
      min-block-size: 420px;
    }
  }

  @media (max-width: 520px) {
    .settings-shell {
      inline-size: calc(100vw - 20px);
    }

    .action-row,
    .editor-label-row,
    .revision-actions {
      align-items: stretch;
      flex-direction: column;
    }

    .button {
      width: 100%;
    }
  }
`;

export class LatchSettings extends HTMLElement {
  #root: ShadowRoot;
  #status: "loading" | "ready" | "error" = "loading";
  #session: SessionResponse | undefined;
  #configured = false;
  #raw = DEFAULT_SERVICE_CONFIG_YAML;
  #savedRaw = "";
  #draftServices: PreviewServiceEntry[] = [];
  #revisions: RevisionSummary[] = [];
  #validationMessage = "";
  #validationDetails: string[] = [];
  #notice = "";
  #errorMessage = "";
  #isSaving = false;
  #selectedRevisionId = "";
  #lastSavedAt = "";

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
    let updateDraftServices = true;

    try {
      this.#session = await fetchJson<SessionResponse>("/api/session");
      if (this.#session.isAdmin) {
        const config = await fetchJson<ConfigResponse>("/api/config");
        this.#applyConfig(config);
        updateDraftServices = !config.configured;
      }
      this.#status = "ready";
    } catch (error) {
      this.#status = "error";
      this.#errorMessage = getFriendlyErrorMessage(error, "Could not load settings.");
    }

    this.#validateDraft(updateDraftServices);
    this.#render();
  }

  async #save(): Promise<void> {
    this.#validateDraft();
    this.#notice = "";
    if (this.#validationMessage) {
      this.#syncDraftPanels();
      return;
    }

    if (!this.#isDirty() && this.#configured) {
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
      this.#notice = `Saved at ${formatTime(this.#lastSavedAt)}`;
    } catch (error) {
      this.#notice = "";
      this.#validationMessage = getFriendlyErrorMessage(error, "Could not save config.");
    }

    this.#isSaving = false;
    this.#render();
  }

  async #rollback(): Promise<void> {
    if (!this.#selectedRevisionId) {
      return;
    }

    const revision = this.#getSelectedRevision();
    const label = revision ? formatRevision(revision) : "the selected revision";
    if (
      this.#isDirty() &&
      !globalThis.confirm(`Restore ${label}? Unsaved changes will be replaced.`)
    ) {
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
      this.#notice = `Restored ${formatTime(this.#lastSavedAt)}`;
    } catch (error) {
      this.#validationMessage = getFriendlyErrorMessage(error, "Could not restore revision.");
    }

    this.#isSaving = false;
    this.#render();
  }

  #applyConfig(config: ConfigResponse): void {
    this.#configured = config.configured;
    this.#raw = config.raw;
    this.#savedRaw = config.configured ? config.raw : "";
    this.#draftServices = config.services;
    this.#revisions = config.revisions;
    this.#selectedRevisionId = this.#revisions[0]?.id ?? "";
    this.#lastSavedAt = config.configured
      ? (this.#revisions[0]?.savedAt ?? new Date().toISOString())
      : "";
    this.#validationMessage = "";
    this.#validationDetails = [];
  }

  #validateDraft(updateDraftServices = true): void {
    try {
      const draftServices = parseServiceConfigSource(this.#raw, {
        mode: "private"
      });
      if (updateDraftServices) {
        this.#draftServices = draftServices;
      }
      this.#validationMessage = "";
      this.#validationDetails = [];
    } catch (error) {
      if (updateDraftServices) {
        this.#draftServices = [];
      }
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
          <div class="editor-label-row">
            <label class="editor-label" for="latch-config-editor">Service YAML</label>
            <span class="editor-status" data-role="editor-status">${escapeHtml(this.#getEditorStatus())}</span>
          </div>
          <textarea id="latch-config-editor" class="config-editor" spellcheck="false" data-field="raw">${escapeHtml(
            this.#raw
          )}</textarea>
          <div class="action-row">
            <button class="button primary" type="button" data-action="save" ${
              this.#isSaveDisabled() ? "disabled" : ""
            }>
              <latch-icon name="save" aria-hidden="true"></latch-icon>
              <span data-role="save-label">${escapeHtml(this.#getSaveLabel())}</span>
            </button>
            <span class="meta-text" data-role="config-status">${escapeHtml(this.#getConfigStatus())}</span>
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

  #renderService(service: PreviewServiceEntry): string {
    const host = getServiceHostname(service);
    const name = getServiceDisplayName(service);
    return `
      <div class="preview-item">
        <span class="icon-box" aria-hidden="true">
          ${renderServiceIcon(service)}
        </span>
        <span class="item-copy">
          <span class="item-name">${escapeHtml(name)}</span>
          <span class="item-meta">${escapeHtml(host)}</span>
        </span>
      </div>
    `;
  }

  #renderRevisions(): string {
    if (this.#revisions.length === 0) {
      return `<div class="message neutral">No revisions</div>`;
    }

    const selectedRevision = this.#getSelectedRevision();
    const selectedDetail = selectedRevision
      ? `${selectedRevision.serviceCount} services saved by ${selectedRevision.savedBy}`
      : "";

    return `
      <div class="revision-list">
        <select class="revision-select" data-field="revision" aria-label="Revision">
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
        ${selectedDetail ? `<p class="revision-detail">${escapeHtml(selectedDetail)}</p>` : ""}
        <div class="revision-actions">
          <button class="button" type="button" data-action="rollback" ${this.#isSaving ? "disabled" : ""}>
            <latch-icon name="refresh" aria-hidden="true"></latch-icon>
            <span>Restore</span>
          </button>
        </div>
      </div>
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
      this.#render();
    });

    this.#root
      .querySelector<HTMLButtonElement>("[data-action='rollback']")
      ?.addEventListener("click", () => {
        void this.#rollback();
      });

    this.#bindIconFallbacks();
  }

  #bindIconFallbacks(): void {
    bindServiceIconFallbacks(this.#root);
  }

  #syncDraftPanels(): void {
    const validation = this.#root.querySelector(".validation-slot");
    if (validation) {
      validation.innerHTML = this.#renderValidation();
    }

    const preview = this.#root.querySelector(".preview-slot");
    if (preview) {
      preview.innerHTML = this.#renderPreview();
      this.#bindIconFallbacks();
    }

    const save = this.#root.querySelector<HTMLButtonElement>("[data-action='save']");
    if (save) {
      save.disabled = this.#isSaveDisabled();
      save.querySelector("[data-role='save-label']")?.replaceChildren(this.#getSaveLabel());
    }

    this.#root
      .querySelector("[data-role='editor-status']")
      ?.replaceChildren(this.#getEditorStatus());

    this.#root
      .querySelector("[data-role='config-status']")
      ?.replaceChildren(this.#getConfigStatus());
  }

  #getSelectedRevision(): RevisionSummary | undefined {
    return this.#revisions.find((revision) => revision.id === this.#selectedRevisionId);
  }

  #isDirty(): boolean {
    return this.#raw !== this.#savedRaw;
  }

  #isSaveDisabled(): boolean {
    return (
      this.#isSaving || Boolean(this.#validationMessage) || (!this.#isDirty() && this.#configured)
    );
  }

  #getSaveLabel(): string {
    if (this.#isSaving) {
      return "Saving";
    }

    return this.#configured && !this.#isDirty() ? "Saved" : "Save";
  }

  #getEditorStatus(): string {
    if (this.#isSaving) {
      return "Saving changes";
    }

    if (this.#validationMessage) {
      return "Needs a fix";
    }

    if (this.#isDirty()) {
      return "Unsaved changes";
    }

    if (this.#lastSavedAt) {
      return `Saved ${formatTime(this.#lastSavedAt)}`;
    }

    return "Ready to save";
  }

  #getConfigStatus(): string {
    if (!this.#configured) {
      return "Not configured";
    }

    return this.#isDirty() ? "Draft differs from saved config" : "Configured";
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

  if (typeof payload === "string" && payload.trim() && !looksLikeHtml(payload)) {
    return payload.length > 180 ? `${payload.slice(0, 180)}...` : payload;
  }

  return `Request failed (${status}).`;
}

function getFriendlyErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  if (error.message === "Request failed (404).") {
    return "Settings API unavailable. Open the Worker-backed app to edit services.";
  }

  return error.message || fallback;
}

function looksLikeHtml(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  return (
    trimmed.startsWith("<!doctype") || trimmed.startsWith("<html") || trimmed.includes("<body")
  );
}

function formatRevision(revision: RevisionSummary): string {
  return `${formatTime(revision.savedAt)} · ${revision.serviceCount} services`;
}

function formatTime(value: string): string {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function renderServiceIcon(service: PreviewServiceEntry): string {
  const fallbackIcon = escapeAttribute(service.icon ?? "service");
  if (service.icon || !service.iconUrl) {
    return `<latch-icon name="${fallbackIcon}"></latch-icon>`;
  }

  return `
    <img class="service-icon-image" src="${escapeAttribute(service.iconUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer" />
    <latch-icon name="${fallbackIcon}" hidden></latch-icon>
  `;
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
