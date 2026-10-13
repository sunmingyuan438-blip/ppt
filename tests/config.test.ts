import { describe, expect, it } from "vitest";
import { loadConfig } from "../config/config";

describe("config", () => {
  it("loads fixture defaults", () => {
    const config = loadConfig({ APP_ENV: "fixture" });
    expect(config.APP_ENV).toBe("fixture");
    expect(config.PORT).toBe(8080);
    expect(config.AIGZM_API_ORIGIN).toBe("https://aigzm.com");
  });

  it("requires production secrets", () => {
    expect(() => loadConfig({ APP_ENV: "production" })).toThrow(/Production requires/);
  });

  it("allows local developer setup without OAuth or database configuration", () => {
    const config = loadConfig({ APP_ENV: "developer", AIGZM_API_KEY: "unit-test-key" });
    expect(config.APP_ENV).toBe("developer");
    expect(config.AIGZM_API_KEY).toBe("unit-test-key");
    expect(config.AIGZM_CLIENT_SECRET).toBeUndefined();
  });
});
