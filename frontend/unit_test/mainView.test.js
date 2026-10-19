import React from "react";
import nock from "nock";
import { Provider } from "react-redux";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { createTestStore } from "./helpers/testStore";
import MainView from "../src/components/Home/MainView";

const articleShape = () => ({
  slug: "s",
  title: "T",
  description: "D",
  body: "B",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  tagList: [],
  favorited: false,
  favoritesCount: 0,
  author: { username: "a", image: "" },
});

describe("MainView", () => {
  it("shows feed tab and switches tabs", () => {
    nock("http://localhost")
      .get("/api/articles/feed?limit=10&offset=0")
      .reply(200, { articles: [], articlesCount: 0 });
    nock("http://localhost")
      .get("/api/articles?limit=10&offset=0")
      .reply(200, { articles: [], articlesCount: 0 });

    const store = createTestStore({
      home: { tags: [] },
      articleList: {
        articles: [articleShape()],
        articlesCount: 1,
        currentPage: 0,
        tab: "feed",
        tag: null,
        pager: null,
      },
      common: {
        appName: "C",
        token: "tok",
        appLoaded: true,
        currentUser: { username: "u" },
        redirectTo: null,
        viewChangeCounter: 0,
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <MainView />
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.getByText("Your Feed")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Global Feed").closest("a"));
    fireEvent.click(screen.getByText("Your Feed").closest("a"));
  });

  it("shows tag filter tab", () => {
    const store = createTestStore({
      home: { tags: [] },
      articleList: {
        articles: [],
        articlesCount: 0,
        currentPage: 0,
        tab: "all",
        tag: "react",
        pager: null,
      },
      common: {
        appName: "C",
        token: null,
        appLoaded: true,
        currentUser: null,
        redirectTo: null,
        viewChangeCounter: 0,
      },
    });
    render(
      <Provider store={store}>
        <MemoryRouter>
          <MainView />
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.getByText(/react/)).toBeInTheDocument();
  });
});
