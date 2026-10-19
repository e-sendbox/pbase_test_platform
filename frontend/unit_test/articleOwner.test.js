import React from "react";
import nock from "nock";
import { Provider } from "react-redux";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route } from "react-router-dom";
import { createTestStore } from "./helpers/testStore";
import { APP_LOAD } from "../src/constants/actionTypes";
import Article from "../src/components/Article";

describe("Article owner toolbar", () => {
  it("shows edit when current user is author", async () => {
    nock("http://localhost").get("/api/articles/own-slug").reply(200, {
      article: {
        slug: "own-slug",
        title: "T",
        description: "D",
        body: "B",
        tagList: [],
        author: { username: "me", image: "" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        favorited: false,
        favoritesCount: 0,
      },
    });
    nock("http://localhost").get("/api/articles/own-slug/comments").reply(200, { comments: [] });

    const store = createTestStore();
    store.dispatch({
      type: APP_LOAD,
      token: "t",
      payload: {
        user: { username: "me", email: "m@e.com", bio: "", image: "", token: "t" },
      },
      skipTracking: true,
    });

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/article/own-slug"]}>
          <Route path="/article/:id" component={Article} />
        </MemoryRouter>
      </Provider>,
    );

    await waitFor(() => expect(screen.getByText(/Edit Article/)).toBeInTheDocument());
  });

  it("does not show edit when current user is not the author", async () => {
    nock("http://localhost").get("/api/articles/other-slug").reply(200, {
      article: {
        slug: "other-slug",
        title: "T",
        description: "D",
        body: "B",
        tagList: [],
        author: { username: "author", image: "" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        favorited: false,
        favoritesCount: 0,
      },
    });
    nock("http://localhost").get("/api/articles/other-slug/comments").reply(200, { comments: [] });

    const store = createTestStore();
    store.dispatch({
      type: APP_LOAD,
      token: "t",
      payload: {
        user: { username: "me", email: "m@e.com", bio: "", image: "", token: "t" },
      },
      skipTracking: true,
    });

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/article/other-slug"]}>
          <Route path="/article/:id" component={Article} />
        </MemoryRouter>
      </Provider>,
    );

    await waitFor(() => expect(screen.getByText("T")).toBeInTheDocument());
    expect(screen.queryByText(/Edit Article/)).not.toBeInTheDocument();
  });
});
