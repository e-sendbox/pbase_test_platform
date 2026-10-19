import { applyMiddleware, compose, createStore } from "redux";
import createHistory from "history/createMemoryHistory";
import { routerMiddleware } from "react-router-redux";
import { promiseMiddleware, localStorageMiddleware } from "../../src/middleware";
import reducer from "../../src/reducer";

export function createTestStore(preloadedState, initialEntries, injectedHistory) {
  const history =
    injectedHistory ||
    createHistory({
      initialEntries: initialEntries || ["/"],
    });
  const rm = routerMiddleware(history);
  const enhancer = compose(
    applyMiddleware(rm, promiseMiddleware, localStorageMiddleware),
  );
  return createStore(reducer, preloadedState, enhancer);
}
