import {
  ASYNC_END,
  LOGIN,
  LOGOUT,
  REGISTER,
} from "../src/constants/actionTypes";
import { localStorageMiddleware, promiseMiddleware } from "../src/middleware";

describe("localStorageMiddleware", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("stores jwt on LOGIN success", () => {
    const next = jest.fn();
    const store = {};
    const action = {
      type: LOGIN,
      error: false,
      payload: { user: { token: "abc" } },
    };
    localStorageMiddleware(store)(next)(action);
    expect(window.localStorage.getItem("jwt")).toBe("abc");
    expect(next).toHaveBeenCalledWith(action);
  });

  it("clears jwt on LOGOUT", () => {
    window.localStorage.setItem("jwt", "x");
    const next = jest.fn();
    localStorageMiddleware({})(next)({ type: LOGOUT });
    expect(window.localStorage.getItem("jwt")).toBe("");
    expect(next).toHaveBeenCalled();
  });

  it("stores jwt on REGISTER success", () => {
    const next = jest.fn();
    localStorageMiddleware({})(next)({
      type: REGISTER,
      error: false,
      payload: { user: { token: "reg" } },
    });
    expect(window.localStorage.getItem("jwt")).toBe("reg");
  });

  it("skips storage on LOGIN error", () => {
    window.localStorage.setItem("jwt", "keep");
    const next = jest.fn();
    localStorageMiddleware({})(next)({
      type: LOGIN,
      error: true,
      payload: {},
    });
    expect(window.localStorage.getItem("jwt")).toBe("keep");
  });
});

describe("promiseMiddleware", () => {
  it("delegates non-promise actions", () => {
    const next = jest.fn();
    const store = { getState: () => ({ viewChangeCounter: 0 }), dispatch: jest.fn() };
    const action = { type: "plain", payload: {} };
    promiseMiddleware(store)(next)(action);
    expect(next).toHaveBeenCalledWith(action);
  });

  it("dispatches success path", async () => {
    const dispatch = jest.fn((a) => a);
    const store = {
      getState: () => ({ viewChangeCounter: 0 }),
      dispatch,
    };
    const resolved = Promise.resolve({ ok: 1 });
    const action = { type: LOGIN, payload: resolved, skipTracking: false };
    promiseMiddleware(store)(jest.fn())(action);
    await resolved;
    await Promise.resolve();
    expect(dispatch.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("skips dispatch when view changes", async () => {
    const dispatch = jest.fn();
    const store = {
      getState: jest
        .fn()
        .mockReturnValueOnce({ viewChangeCounter: 0 })
        .mockReturnValue({ viewChangeCounter: 1 }),
      dispatch,
    };
    const resolved = Promise.resolve({ ok: 1 });
    const action = { type: LOGIN, payload: resolved, skipTracking: false };
    promiseMiddleware(store)(jest.fn())(action);
    await resolved;
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: LOGIN, payload: { ok: 1 } }),
    );
  });

  it("respects skipTracking on success", async () => {
    const store = {
      getState: jest
        .fn()
        .mockReturnValueOnce({ viewChangeCounter: 0 })
        .mockReturnValue({ viewChangeCounter: 1 }),
      dispatch: jest.fn(),
    };
    const resolved = Promise.resolve({ ok: 1 });
    const action = { type: LOGIN, payload: resolved, skipTracking: true };
    promiseMiddleware(store)(jest.fn())(action);
    await resolved;
    expect(store.dispatch).toHaveBeenCalled();
  });

  it("dispatches error path", async () => {
    const dispatch = jest.fn((a) => a);
    const store = {
      getState: () => ({ viewChangeCounter: 0 }),
      dispatch,
    };
    const body = { errors: { e: "m" } };
    const rejected = Promise.reject({ response: { body } });
    rejected.catch(() => {});
    const action = { type: LOGIN, payload: rejected, skipTracking: false };
    promiseMiddleware(store)(jest.fn())(action);
    await rejected.catch(() => {});
    await new Promise((r) => setTimeout(r, 0));
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: LOGIN, error: true, payload: body }),
    );
  });

  it("error path respects skipTracking for ASYNC_END", async () => {
    const dispatch = jest.fn((a) => a);
    const store = {
      getState: () => ({ viewChangeCounter: 0 }),
      dispatch,
    };
    const rejected = Promise.reject({ response: { body: {} } });
    rejected.catch(() => {});
    const action = { type: LOGIN, payload: rejected, skipTracking: true };
    promiseMiddleware(store)(jest.fn())(action);
    await rejected.catch(() => {});
    await new Promise((r) => setTimeout(r, 0));
    const asyncEndCalls = dispatch.mock.calls.filter((c) => c[0].type === ASYNC_END);
    expect(asyncEndCalls.length).toBe(0);
  });

  it("error path skips when view changes", async () => {
    const dispatch = jest.fn();
    const store = {
      getState: jest
        .fn()
        .mockReturnValueOnce({ viewChangeCounter: 0 })
        .mockReturnValue({ viewChangeCounter: 9 }),
      dispatch,
    };
    const rejected = Promise.reject({ response: { body: {} } });
    rejected.catch(() => {});
    promiseMiddleware(store)(jest.fn())({
      type: LOGIN,
      payload: rejected,
      skipTracking: false,
    });
    await rejected.catch(() => {});
    await new Promise((r) => setTimeout(r, 0));
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: LOGIN, error: true }),
    );
  });
});
