import React from "react";
import nock from "nock";
import { Provider } from "react-redux";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import createHistory from "history/createMemoryHistory";
import { MemoryRouter, Route, Router } from "react-router-dom";
import { createTestStore } from "./helpers/testStore";
import { APP_LOAD, SETTINGS_SAVED } from "../src/constants/actionTypes";
import Login from "../src/components/Login";
import Register from "../src/components/Register";
import Editor from "../src/components/Editor";
import ProfileFavorites from "../src/components/ProfileFavorites";
import CommentList from "../src/components/Article/CommentList";
import Tags from "../src/components/Home/Tags";
import Settings from "../src/components/Settings";
import Article from "../src/components/Article";
import common from "../src/reducers/common";
import articleList from "../src/reducers/articleList";
import * as types from "../src/constants/actionTypes";
import { promiseMiddleware } from "../src/middleware";

describe("coverage gaps", () => {
  it("Login dispatches field updates and onUnload", () => {
    const store = createTestStore({
      auth: { email: "", password: "", errors: null, inProgress: false },
    });
    store.dispatch({
      type: APP_LOAD,
      token: null,
      payload: null,
      skipTracking: true,
    });
    const { unmount } = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/login"]}>
          <Route path="/login" component={Login} />
        </MemoryRouter>
      </Provider>,
    );
    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "e@e.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "secret" },
    });
    unmount();
  });

  it("Register dispatches field updates and onUnload", () => {
    const store = createTestStore({
      auth: { email: "", password: "", username: "", errors: null, inProgress: false },
    });
    store.dispatch({
      type: APP_LOAD,
      token: null,
      payload: null,
      skipTracking: true,
    });
    const { unmount } = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/register"]}>
          <Route path="/register" component={Register} />
        </MemoryRouter>
      </Provider>,
    );
    fireEvent.change(screen.getByPlaceholderText("Username"), {
      target: { value: "u" },
    });
    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "e@e.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "p" },
    });
    unmount();
  });

  it("Editor reloads when route slug changes", async () => {
    nock("http://localhost").get("/api/articles/first").reply(200, {
      article: {
        slug: "first",
        title: "A",
        description: "B",
        body: "C",
        tagList: [],
        author: { username: "x", image: "" },
        createdAt: "",
        updatedAt: "",
        favorited: false,
        favoritesCount: 0,
      },
    });
    nock("http://localhost").get("/api/articles/second").reply(200, {
      article: {
        slug: "second",
        title: "X",
        description: "Y",
        body: "Z",
        tagList: [],
        author: { username: "x", image: "" },
        createdAt: "",
        updatedAt: "",
        favorited: false,
        favoritesCount: 0,
      },
    });
    const history = createHistory({ initialEntries: ["/editor/first"] });
    const store = createTestStore(undefined, undefined, history);
    store.dispatch({
      type: APP_LOAD,
      token: null,
      payload: null,
      skipTracking: true,
    });
    const { container } = render(
      <Provider store={store}>
        <Router history={history}>
          <Route path="/editor/:slug" component={Editor} />
        </Router>
      </Provider>,
    );
    await waitFor(() =>
      expect(within(container).getByPlaceholderText("Article Title")).toHaveValue("A"),
    );
    fireEvent.change(within(container).getByPlaceholderText("Enter tags"), {
      target: { value: "tagx" },
    });
    fireEvent.keyUp(within(container).getByPlaceholderText("Enter tags"), {
      keyCode: 32,
    });
    fireEvent.keyUp(within(container).getByPlaceholderText("Enter tags"), {
      keyCode: 13,
      preventDefault: jest.fn(),
    });
    await waitFor(() => expect(store.getState().editor.tagList).toContain("tagx"));
    history.push("/editor/second");
    await waitFor(() =>
      expect(within(container).getByPlaceholderText("Article Title")).toHaveValue("X"),
    );
  });

  it("Editor clears loaded article when navigating to /editor without slug", async () => {
    nock("http://localhost").get("/api/articles/wip").reply(200, {
      article: {
        slug: "wip",
        title: "T1",
        description: "",
        body: "",
        tagList: [],
        author: { username: "a", image: "" },
        createdAt: "",
        updatedAt: "",
        favorited: false,
        favoritesCount: 0,
      },
    });
    const history = createHistory({ initialEntries: ["/editor/wip"] });
    const store = createTestStore(undefined, undefined, history);
    store.dispatch({
      type: APP_LOAD,
      token: null,
      payload: null,
      skipTracking: true,
    });
    const { container } = render(
      <Provider store={store}>
        <Router history={history}>
          <Route path="/editor/:slug?" component={Editor} />
        </Router>
      </Provider>,
    );
    await waitFor(() =>
      expect(within(container).getByPlaceholderText("Article Title")).toHaveValue("T1"),
    );
    history.push("/editor");
    await waitFor(() =>
      expect(within(container).getByPlaceholderText("Article Title")).toHaveValue(""),
    );
  });

  it("ProfileFavorites renders tabs after profile load", async () => {
    nock("http://localhost").get("/api/profiles/pf").reply(200, {
      profile: { username: "pf", bio: "", image: "", following: false },
    });
    nock("http://localhost")
      .get("/api/articles?favorited=pf&limit=5&offset=0")
      .reply(200, { articles: [], articlesCount: 0 });
    const store = createTestStore({
      common: {
        appName: "A",
        token: "t",
        appLoaded: true,
        currentUser: { username: "me", email: "m@e.com", bio: "", image: "", token: "t" },
        redirectTo: null,
        viewChangeCounter: 0,
      },
    });
    const { unmount } = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/@pf/favorites"]}>
          <Route path="/@:username/favorites" component={ProfileFavorites} />
        </MemoryRouter>
      </Provider>,
    );
    await waitFor(() => expect(screen.getByText("Favorited Articles")).toBeInTheDocument());
    expect(screen.getByText("My Articles")).toBeInTheDocument();
    unmount();
  });

  it("ProfileFavorites pager loads another favorites page", async () => {
    const mk = (i) => ({
      slug: `slug-${i}`,
      title: "T",
      description: "",
      body: "",
      tagList: [],
      createdAt: "",
      updatedAt: "",
      favorited: true,
      favoritesCount: 1,
      author: { username: "pg", image: "" },
    });
    const articles = Array.from({ length: 11 }, (_, i) => mk(i));
    nock("http://localhost").get("/api/profiles/pg").reply(200, {
      profile: { username: "pg", bio: "", image: "", following: false },
    });
    nock("http://localhost")
      .get("/api/articles?favorited=pg&limit=5&offset=0")
      .reply(200, { articles, articlesCount: 11 });
    nock("http://localhost")
      .get("/api/articles?favorited=pg&limit=5&offset=5")
      .reply(200, { articles: articles.slice(5, 11), articlesCount: 11 });
    const store = createTestStore({
      common: {
        appName: "A",
        token: "t",
        appLoaded: true,
        currentUser: { username: "me", email: "m@e.com", bio: "", image: "", token: "t" },
        redirectTo: null,
        viewChangeCounter: 0,
      },
    });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/@pg/favorites"]}>
          <Route path="/@:username/favorites" component={ProfileFavorites} />
        </MemoryRouter>
      </Provider>,
    );
    await waitFor(() => expect(screen.getByText("Favorited Articles")).toBeInTheDocument());
    const page2 = screen.getAllByRole("link").find((el) => el.textContent === "2");
    expect(page2).toBeTruthy();
    fireEvent.click(page2);
    await waitFor(() => expect(nock.isDone()).toBe(true));
  });

  it("CommentList tolerates missing comments prop", () => {
    render(
      <MemoryRouter>
        <CommentList comments={undefined} slug="s" currentUser={null} />
      </MemoryRouter>,
    );
  });

  it("Tags maps click handlers for multiple tags", () => {
    nock("http://localhost")
      .persist()
      .get(/^\/api\/articles\?tag=.+/)
      .reply(200, { articles: [], articlesCount: 0 });
    const onClick = jest.fn();
    const { container } = render(
      <MemoryRouter>
        <Tags tags={["a", "b", "c"]} onClickTag={onClick} />
      </MemoryRouter>,
    );
    const links = container.querySelectorAll("a.tag-pill");
    fireEvent.click(links[0]);
    fireEvent.click(links[1]);
    fireEvent.click(links[2]);
    expect(onClick).toHaveBeenCalled();
  });

  it("Tags invokes tag pager for page > 0", () => {
    nock("http://localhost")
      .get("/api/articles?tag=p&limit=10&offset=0")
      .reply(200, { articles: [], articlesCount: 0 });
    nock("http://localhost")
      .get("/api/articles?tag=p&limit=10&offset=10")
      .reply(200, { articles: [], articlesCount: 0 });
    const onClick = jest.fn((tag, pager) => {
      pager(1);
    });
    const { container } = render(
      <MemoryRouter>
        <Tags tags={["p"]} onClickTag={onClick} />
      </MemoryRouter>,
    );
    fireEvent.click(container.querySelector("a.tag-pill"));
    expect(onClick).toHaveBeenCalled();
  });

  it("Tags shows loading when tags are not yet loaded", () => {
    render(
      <MemoryRouter>
        <Tags onClickTag={jest.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Loading Tags/)).toBeInTheDocument();
  });

  it("common reducer ignores malformed ARTICLE_SUBMITTED", () => {
    const s0 = common(undefined, { type: "@@INIT" });
    const s1 = common(s0, { type: types.ARTICLE_SUBMITTED, error: true, payload: {} });
    expect(s1).toEqual(s0);
    const s2 = common(s0, { type: types.ARTICLE_SUBMITTED, error: false, payload: {} });
    expect(s2).toEqual(s0);
  });

  it("articleList favorite with no articles array uses empty list", () => {
    const s = articleList(
      {},
      {
        type: types.ARTICLE_FAVORITED,
        payload: { article: { slug: "x", favorited: true, favoritesCount: 1 } },
      },
    );
    expect(s.articles).toEqual([]);
  });

  it("SettingsForm syncs state when currentUser updates", () => {
    const store = createTestStore({
      settings: { errors: null, inProgress: false },
      common: {
        appName: "App",
        token: "t",
        appLoaded: true,
        currentUser: { username: "me", email: "old@e.com", bio: "b", image: "", token: "t" },
        redirectTo: null,
        viewChangeCounter: 0,
      },
    });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/settings"]}>
          <Route path="/settings" component={Settings} />
        </MemoryRouter>
      </Provider>,
    );
    store.dispatch({
      type: SETTINGS_SAVED,
      error: false,
      payload: {
        user: { username: "me", email: "new@e.com", bio: "b2", image: "http://i", token: "t" },
      },
    });
    expect(screen.getByPlaceholderText("Email")).toHaveValue("new@e.com");
  });

  it("SettingsForm skips hydrate when currentUser is null", () => {
    const store = createTestStore({
      settings: { errors: null, inProgress: false },
      common: {
        appName: "App",
        token: null,
        appLoaded: true,
        currentUser: null,
        redirectTo: null,
        viewChangeCounter: 0,
      },
    });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/settings"]}>
          <Route path="/settings" component={Settings} />
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.getByPlaceholderText("Username")).toHaveValue("");
  });

  it("SettingsForm omits empty password on submit", async () => {
    const agentMod = require("../src/agent");
    const saveSpy = jest.spyOn(agentMod.default.Auth, "save").mockResolvedValue({
      user: { username: "me", email: "m@e.com", bio: "bio", image: "", token: "t" },
    });
    const store = createTestStore({
      settings: { errors: null, inProgress: false },
      common: {
        appName: "App",
        token: "t",
        appLoaded: true,
        currentUser: { username: "me", email: "m@e.com", bio: "bio", image: "", token: "t" },
        redirectTo: null,
        viewChangeCounter: 0,
      },
    });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/settings"]}>
          <Route path="/settings" component={Settings} />
        </MemoryRouter>
      </Provider>,
    );
    fireEvent.click(screen.getByText("Update Settings"));
    await waitFor(() => expect(saveSpy).toHaveBeenCalled());
    expect(saveSpy.mock.calls[0][0].password).toBeUndefined();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it("SettingsForm keeps password in payload when set", async () => {
    const agentMod = require("../src/agent");
    const saveSpy = jest.spyOn(agentMod.default.Auth, "save").mockResolvedValue({
      user: { username: "me", email: "m@e.com", bio: "bio", image: "", token: "t" },
    });
    const store = createTestStore({
      settings: { errors: null, inProgress: false },
      common: {
        appName: "App",
        token: "t",
        appLoaded: true,
        currentUser: { username: "me", email: "m@e.com", bio: "bio", image: "", token: "t" },
        redirectTo: null,
        viewChangeCounter: 0,
      },
    });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/settings"]}>
          <Route path="/settings" component={Settings} />
        </MemoryRouter>
      </Provider>,
    );
    fireEvent.change(screen.getByPlaceholderText("New Password"), {
      target: { value: "s3cret" },
    });
    fireEvent.click(screen.getByText("Update Settings"));
    await waitFor(() => expect(saveSpy).toHaveBeenCalled());
    expect(saveSpy.mock.calls[0][0].password).toBe("s3cret");
  });

  it("Article tolerates comments response without comments key", async () => {
    nock("http://localhost").get("/api/articles/c1").reply(200, {
      article: {
        slug: "c1",
        title: "Title",
        description: "D",
        body: "Body",
        tagList: ["t"],
        author: { username: "a", image: "" },
        createdAt: "",
        updatedAt: "",
        favorited: false,
        favoritesCount: 0,
      },
    });
    nock("http://localhost").get("/api/articles/c1/comments").reply(200, {});
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
        <MemoryRouter initialEntries={["/article/c1"]}>
          <Route path="/article/:id" component={Article} />
        </MemoryRouter>
      </Provider>,
    );
    await waitFor(() => expect(screen.getByText("Title")).toBeInTheDocument());
  });

  it("promiseMiddleware error uses empty payload when response has no body", async () => {
    const dispatch = jest.fn((a) => a);
    const store = {
      getState: () => ({ viewChangeCounter: 0 }),
      dispatch,
    };
    const rejected = Promise.reject({ response: {} });
    rejected.catch(() => {});
    promiseMiddleware(store)(jest.fn())({
      type: types.LOGIN,
      payload: rejected,
      skipTracking: false,
    });
    await rejected.catch(() => {});
    await new Promise((r) => setTimeout(r, 0));
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: types.LOGIN, error: true, payload: {} }),
    );
  });
});
