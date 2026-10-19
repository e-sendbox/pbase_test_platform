module.exports = {
  testEnvironment: "node",
  testMatch: ["**/*.pact.test.js"],
  testTimeout: 30000,
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};
