import { describe, expect, it } from "vitest";
import {
  ConfigValidationError,
  parseServiceConfigSource,
  serializeServices,
  validateServiceConfig
} from "../scripts/service-config.ts";

const validConfig = {
  services: [
    {
      id: "photos",
      name: "Photos",
      url: "https://photos.example.com",
      shortcut: "1",
      pinned: true
    },
    {
      id: "notes",
      name: "Notes",
      url: "https://notes.example.com",
      aliases: ["docs"],
      shortcut: "2"
    }
  ]
};

describe("service config validation", () => {
  it("accepts a valid example config", () => {
    const services = validateServiceConfig(validConfig, {
      mode: "example",
      rawSource: "services:\n  - id: photos\n"
    });

    expect(services).toHaveLength(2);
    expect(serializeServices(services)).toContain('"id": "photos"');
  });

  it("rejects duplicate ids", () => {
    expect(() =>
      validateServiceConfig(
        {
          services: [
            validConfig.services[0],
            {
              id: "photos",
              name: "Other Photos",
              url: "https://other.example.com"
            }
          ]
        },
        { mode: "example" }
      )
    ).toThrow(ConfigValidationError);
  });

  it("rejects non-https urls", () => {
    expect(() =>
      validateServiceConfig(
        {
          services: [
            {
              id: "files",
              name: "Files",
              url: "http://files.example.com"
            }
          ]
        },
        { mode: "example" }
      )
    ).toThrow(ConfigValidationError);
  });

  it("rejects shortcut conflicts", () => {
    expect(() =>
      validateServiceConfig(
        {
          services: [
            validConfig.services[0],
            {
              id: "files",
              name: "Files",
              url: "https://files.example.com",
              shortcut: "1"
            }
          ]
        },
        { mode: "example" }
      )
    ).toThrow(ConfigValidationError);
  });

  it("rejects private network hosts", () => {
    expect(() =>
      validateServiceConfig(
        {
          services: [
            {
              id: "router",
              name: "Router",
              url: "https://192.168.1.1"
            }
          ]
        },
        { mode: "private" }
      )
    ).toThrow(ConfigValidationError);
  });

  it("rejects obvious secret material in source text", () => {
    expect(() =>
      validateServiceConfig(validConfig, {
        mode: "example",
        rawSource: "services:\n  - id: photos\n    token: should-not-be-here\n"
      })
    ).toThrow(ConfigValidationError);
  });

  it("requires example configs to use example.com hostnames", () => {
    expect(() =>
      validateServiceConfig(
        {
          services: [
            {
              id: "notes",
              name: "Notes",
              url: "https://notes.invalid"
            }
          ]
        },
        { mode: "example" }
      )
    ).toThrow(ConfigValidationError);
  });

  it("reports YAML parse errors", () => {
    expect(() =>
      parseServiceConfigSource("services: [", {
        mode: "private"
      })
    ).toThrow(ConfigValidationError);
  });
});
