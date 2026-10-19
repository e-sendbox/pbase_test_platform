import React from "react";
import { Provider } from "react-redux";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter, Route } from "react-router-dom";
import { createTestStore } from "./helpers/testStore";
import { APP_LOAD, ARTICLE_SUBMITTED } from "../src/constants/actionTypes";
import App from "../src/components/App";

describe("App redirect", () => {
  it("clears redirect when redirectTo is set", async () => {
    const store = createTestStore({
      common: {
        appName: "App",
        token: null,
        appLoaded: true,
        currentUser: null,
        redirectTo: null,
        viewChangeCounter: 0,
      },
    });
    store.dispatch({
      type: APP_LOAD,
      token: null,
      payload: null,
      skipTracking: true,
    });
    const { rerender } = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/"]}>
          <Route path="/" component={App} />
        </MemoryRouter>
      </Provider>,
    );
    store.dispatch({
      type: ARTICLE_SUBMITTED,
      payload: { article: { slug: "z" } },
    });
    rerender(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/"]}>
          <Route path="/" component={App} />
        </MemoryRouter>
      </Provider>,
    );
    await waitFor(() => expect(store.getState().common.redirectTo).toBeNull());
  });
});
