import { describe, expect, it } from "vitest";
import { buildServiceSections, getVisibleServices } from "../src/lib/service-list";
import { emptyUserState, recordServiceOpen, toggleFavorite } from "../src/lib/user-state";

const services = [
  {
    aliases: ["albums"],
    group: "Media",
    id: "photos",
    name: "Photos",
    pinned: true,
    tags: ["family"],
    url: "https://photos.example.com"
  },
  {
    aliases: ["writing"],
    group: "Knowledge",
    id: "notes",
    name: "Notes",
    tags: ["text"],
    url: "https://notes.example.com"
  },
  {
    group: "Storage",
    id: "files",
    name: "Files",
    url: "https://files.example.com"
  }
];

describe("service list helpers", () => {
  it("matches names, hosts, aliases, groups, and tags", () => {
    expect(
      getVisibleServices(services, emptyUserState(), "albums").map((service) => service.id)
    ).toEqual(["photos"]);
    expect(
      getVisibleServices(services, emptyUserState(), "storage").map((service) => service.id)
    ).toEqual(["files"]);
    expect(
      getVisibleServices(services, emptyUserState(), "text").map((service) => service.id)
    ).toEqual(["notes"]);
    expect(
      getVisibleServices(services, emptyUserState(), "files.example").map((service) => service.id)
    ).toEqual(["files"]);
  });

  it("sorts favorites, pinned services, and recents ahead of the configured order", () => {
    const withRecent = recordServiceOpen(emptyUserState(), "files", "2026-06-25T00:00:00.000Z");
    const withFavorite = toggleFavorite(withRecent, "notes");

    expect(getVisibleServices(services, withFavorite, "").map((service) => service.id)).toEqual([
      "notes",
      "photos",
      "files"
    ]);
  });

  it("adds group sections only when the list is large enough", () => {
    const extendedServices = [
      ...services,
      ...Array.from({ length: 6 }, (_, index) => ({
        group: index % 2 === 0 ? "Media" : "Operations",
        id: `service-${index}`,
        name: `Service ${index}`,
        url: `https://service-${index}.example.com`
      }))
    ];

    expect(buildServiceSections(services, emptyUserState(), "")).toHaveLength(1);
    expect(
      buildServiceSections(extendedServices, emptyUserState(), "").map((section) => section.title)
    ).toEqual(["Pinned and recent", "Knowledge", "Storage", "Media", "Operations"]);
  });
});
