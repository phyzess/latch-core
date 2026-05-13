import type { LatchUserState } from "./types";

export const USER_STATE_KEY = "latch:v1:user-state";

export const emptyUserState = (): LatchUserState => ({
  favorites: [],
  recents: []
});

export function loadUserState(storage: Storage | undefined = getLocalStorage()): LatchUserState {
  if (!storage) {
    return emptyUserState();
  }

  const raw = storage.getItem(USER_STATE_KEY);
  if (!raw) {
    return emptyUserState();
  }

  try {
    return normalizeState(JSON.parse(raw));
  } catch {
    return emptyUserState();
  }
}

export function saveUserState(
  state: LatchUserState,
  storage: Storage | undefined = getLocalStorage()
): void {
  if (!storage) {
    return;
  }

  storage.setItem(USER_STATE_KEY, JSON.stringify(normalizeState(state)));
}

export function toggleFavorite(state: LatchUserState, serviceId: string): LatchUserState {
  const favorites = new Set(state.favorites);
  if (favorites.has(serviceId)) {
    favorites.delete(serviceId);
  } else {
    favorites.add(serviceId);
  }

  return normalizeState({
    ...state,
    favorites: [...favorites]
  });
}

export function recordServiceOpen(
  state: LatchUserState,
  serviceId: string,
  openedAt = new Date().toISOString()
): LatchUserState {
  const existing = state.recents.find((entry) => entry.serviceId === serviceId);
  const nextEntry = {
    serviceId,
    openedAt,
    count: (existing?.count ?? 0) + 1
  };

  return normalizeState({
    ...state,
    recents: [nextEntry, ...state.recents.filter((entry) => entry.serviceId !== serviceId)]
  });
}

export function isFavorite(state: LatchUserState, serviceId: string): boolean {
  return state.favorites.includes(serviceId);
}

function normalizeState(input: unknown): LatchUserState {
  if (!input || typeof input !== "object") {
    return emptyUserState();
  }

  const candidate = input as Partial<LatchUserState>;
  const favorites = Array.isArray(candidate.favorites)
    ? [
        ...new Set(
          candidate.favorites.filter((value): value is string => typeof value === "string")
        )
      ]
    : [];

  const recents = Array.isArray(candidate.recents)
    ? candidate.recents
        .filter((entry) => entry && typeof entry === "object")
        .map((entry) => entry as Partial<LatchUserState["recents"][number]>)
        .filter(
          (entry) => typeof entry.serviceId === "string" && typeof entry.openedAt === "string"
        )
        .map((entry) => ({
          serviceId: entry.serviceId as string,
          openedAt: entry.openedAt as string,
          count: typeof entry.count === "number" && Number.isFinite(entry.count) ? entry.count : 1
        }))
        .slice(0, 12)
    : [];

  return { favorites, recents };
}

function getLocalStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}
