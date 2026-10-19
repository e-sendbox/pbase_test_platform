const path = require("path");

const rootDir = path.resolve(__dirname, "..");

module.exports = {
  rootDir,
  restoreMocks: true,
  roots: [rootDir],
  testMatch: ["<rootDir>/unit_test/**/*.test.js"],
  testEnvironment: "jsdom",
  testEnvironmentOptions: {
    url: "http://localhost/",
  },
  setupFilesAfterEnv: [path.join(__dirname, "jest.setup.js")],
  transform: {
    "^.+\\.js$": [
      "babel-jest",
      { configFile: path.join(__dirname, "babel.config.cjs") },
    ],
  },
  transformIgnorePatterns: ["/node_modules/"],
  moduleNameMapper: {
    "\\.(css|less)$": "identity-obj-proxy",
  },
  collectCoverageFrom: [
    "src/**/*.js",
    "!**/node_modules/**",
  ],
  coverageDirectory: path.join(rootDir, "coverage", "unit"),
  coverageReporters: ["text", "html", "lcov"],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
