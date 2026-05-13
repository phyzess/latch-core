import { describe, expect, it } from "vitest";
import { emptyUserState, recordServiceOpen, toggleFavorite } from "../src/lib/user-state";

describe("user state", () => {
  it("toggles favorites without duplicates", () => {
    const first = toggleFavorite(emptyUserState(), "photos");
    const second = toggleFavorite(first, "photos");

    expect(first.favorites).toEqual(["photos"]);
    expect(second.favorites).toEqual([]);
  });

  it("records recent opens with counts", () => {
    const first = recordServiceOpen(emptyUserState(), "photos", "2026-05-13T00:00:00.000Z");
    const second = recordServiceOpen(first, "photos", "2026-05-13T00:01:00.000Z");

    expect(second.recents).toEqual([
      {
        serviceId: "photos",
        openedAt: "2026-05-13T00:01:00.000Z",
        count: 2
      }
    ]);
  });
});
