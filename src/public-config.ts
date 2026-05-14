import {
  ConfigValidationError,
  parseServiceConfigSource as parseInternalServiceConfigSource,
  validateServiceConfig as validateInternalServiceConfig
} from "./lib/service-config";

export interface ServiceEntry {
  id: string;
  name: string;
  url: string;
  icon?: string | undefined;
  aliases?: string[] | undefined;
  group?: string | undefined;
  shortcut?: string | undefined;
  pinned?: boolean | undefined;
  tags?: string[] | undefined;
}

export type ValidationMode = "private" | "example";

export { ConfigValidationError };

export function parseServiceConfigSource(
  rawSource: string,
  options: {
    mode: ValidationMode;
    sourceLabel?: string;
  }
): ServiceEntry[] {
  return parseInternalServiceConfigSource(rawSource, options);
}

export function validateServiceConfig(
  input: unknown,
  options: {
    mode: ValidationMode;
    rawSource?: string;
    sourceLabel?: string;
  }
): ServiceEntry[] {
  return validateInternalServiceConfig(input, options);
}
