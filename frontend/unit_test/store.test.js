describe("store module", () => {
  const origEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = origEnv;
    jest.resetModules();
  });

  it("loads store in production without redux-logger", () => {
    process.env.NODE_ENV = "production";
    const mod = require("../src/store");
    expect(mod.store.getState()).toBeDefined();
    expect(mod.history).toBeDefined();
  });

  it("loads store in development", () => {
    process.env.NODE_ENV = "development";
    const mod = require("../src/store");
    expect(mod.store.getState()).toBeDefined();
  });
});
