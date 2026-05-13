export type ServiceEntry = {
  id: string;
  name: string;
  url: `https://${string}`;
  icon?: string;
  aliases?: string[];
  group?: string;
  shortcut?: string;
  pinned?: boolean;
  tags?: string[];
};

export type LatchUserState = {
  favorites: string[];
  recents: Array<{
    serviceId: string;
    openedAt: string;
    count: number;
  }>;
};
