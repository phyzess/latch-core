export type { ServiceConfigEntry, ServiceEntry } from "./service-config";

export type LatchUserState = {
  favorites: string[];
  recents: Array<{
    serviceId: string;
    openedAt: string;
    count: number;
  }>;
};
