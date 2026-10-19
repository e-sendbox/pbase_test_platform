import React from "react";
import nock from "nock";
import { Provider } from "react-redux";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter, Route } from "react-router-dom";
import { createTestStore } from "./helpers/testStore";
import { APP_LOAD } from "../src/constants/actionTypes";
import Home from "../src/components/Home";

describe("Home with token uses feed", () => {
  it("loads feed tab", async () => {
    nock("http://localhost").get("/api/tags").reply(200, { tags: [] });
    nock("http://localhost")
      .get("/api/articles/feed?limit=10&offset=0")
      .reply(200, { articles: [], articlesCount: 0 });

    const store = createTestStore();
    store.dispatch({
      type: APP_LOAD,
      token: "t",
      payload: { user: { username: "u", email: "e", token: "t", bio: "", image: "" } },
      skipTracking: true,
    });

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/"]}>
          <Route path="/" component={Home} />
        </MemoryRouter>
      </Provider>,
    );
    await waitFor(() => expect(nock.isDone()).toBe(true));
  });
});
