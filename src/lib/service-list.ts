import type { LatchUserState } from "./types";

export type ServiceListEntry = {
  aliases?: string[] | undefined;
  group?: string | undefined;
  id: string;
  name?: string | undefined;
  pinned?: boolean | undefined;
  tags?: string[] | undefined;
  url: string;
};

export type ServiceSection<T extends ServiceListEntry> = {
  services: T[];
  title?: string;
};

const groupedListThreshold = 8;

export function getServiceDisplayName(service: ServiceListEntry): string {
  return service.name ?? getServiceHostname(service);
}

export function getServiceHostname(service: ServiceListEntry): string {
  return new URL(service.url).hostname;
}

export function getVisibleServices<T extends ServiceListEntry>(
  services: T[],
  state: LatchUserState,
  query: string
): T[] {
  const normalizedQuery = normalizeSearch(query);
  return sortServices(
    normalizedQuery
      ? services.filter((service) => matchesServiceQuery(service, normalizedQuery))
      : services,
    state
  );
}

export function buildServiceSections<T extends ServiceListEntry>(
  services: T[],
  state: LatchUserState,
  query: string
): ServiceSection<T>[] {
  const visibleServices = getVisibleServices(services, state, query);
  if (visibleServices.length === 0) {
    return [];
  }

  const normalizedQuery = normalizeSearch(query);
  const groupedServices = visibleServices.filter((service) => service.group);
  const shouldGroup =
    !normalizedQuery &&
    visibleServices.length >= groupedListThreshold &&
    new Set(groupedServices.map((service) => service.group)).size > 1;

  if (!shouldGroup) {
    return [{ services: visibleServices }];
  }

  const priorityServices = visibleServices.filter((service) => isPriorityService(service, state));
  const priorityIds = new Set(priorityServices.map((service) => service.id));
  const regularServices = visibleServices.filter((service) => !priorityIds.has(service.id));
  const sections: ServiceSection<T>[] = [];

  if (priorityServices.length > 0) {
    sections.push({
      services: priorityServices,
      title: "Pinned and recent"
    });
  }

  for (const service of regularServices) {
    const title = service.group ?? "Other";
    const section = sections.find((candidate) => candidate.title === title);
    if (section) {
      section.services.push(service);
    } else {
      sections.push({
        services: [service],
        title
      });
    }
  }

  return sections;
}

export function matchesServiceQuery(service: ServiceListEntry, normalizedQuery: string): boolean {
  const searchable = [
    service.id,
    service.name,
    getServiceHostname(service),
    service.group,
    ...(service.aliases ?? []),
    ...(service.tags ?? [])
  ];

  return searchable.some((value) => normalizeSearch(value ?? "").includes(normalizedQuery));
}

function sortServices<T extends ServiceListEntry>(services: T[], state: LatchUserState): T[] {
  const originalIndexes = new Map(services.map((service, index) => [service.id, index]));

  return [...services].sort((left, right) => {
    const priorityDelta = getServicePriority(right, state) - getServicePriority(left, state);
    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return (originalIndexes.get(left.id) ?? 0) - (originalIndexes.get(right.id) ?? 0);
  });
}

function getServicePriority(service: ServiceListEntry, state: LatchUserState): number {
  const recent = state.recents.find((entry) => entry.serviceId === service.id);
  const recentIndex = recent ? state.recents.indexOf(recent) : -1;
  const recentScore = recent ? 160 - recentIndex * 8 + Math.min(recent.count, 12) : 0;

  return (
    (state.favorites.includes(service.id) ? 520 : 0) + (service.pinned ? 380 : 0) + recentScore
  );
}

function isPriorityService(service: ServiceListEntry, state: LatchUserState): boolean {
  return (
    state.favorites.includes(service.id) ||
    Boolean(service.pinned) ||
    state.recents.some((entry) => entry.serviceId === service.id)
  );
}

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}
