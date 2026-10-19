import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import nock from "nock";

afterEach(() => {
  cleanup();
});

beforeAll(() => {
  const root = document.createElement("div");
  root.id = "root";
  document.body.appendChild(root);
  // Block all real HTTP; tests must use nock or mocks (allowing localhost caused ECONNREFUSED to :80).
  nock.disableNetConnect();
});

afterEach(() => {
  nock.cleanAll();
});

Object.defineProperty(window, "localStorage", {
  value: (() => {
    let store = {};
    return {
      getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
      setItem: (k, v) => {
        store[k] = String(v);
      },
      removeItem: (k) => {
        delete store[k];
      },
      clear: () => {
        store = {};
      },
    };
  })(),
  writable: true,
});

window.console = { ...console, log: jest.fn(), error: jest.fn() };
