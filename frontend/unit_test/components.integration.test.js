import React from "react";
import nock from "nock";
import { Provider } from "react-redux";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from "@testing-library/react";
import { MemoryRouter, Route } from "react-router-dom";
import { createTestStore } from "./helpers/testStore";
import { APP_LOAD } from "../src/constants/actionTypes";

import App from "../src/components/App";
import Header from "../src/components/Header";
import Banner from "../src/components/Home/Banner";
import ListErrors from "../src/components/ListErrors";
import ArticleList from "../src/components/ArticleList";
import ArticleMeta from "../src/components/Article/ArticleMeta";
import CommentList from "../src/components/Article/CommentList";
import Comment from "../src/components/Article/Comment";
import CommentContainer from "../src/components/Article/CommentContainer";
import ArticlePreview from "../src/components/ArticlePreview";
import Login from "../src/components/Login";
import Register from "../src/components/Register";
import Settings from "../src/components/Settings";
import Editor from "../src/components/Editor";
import Home from "../src/components/Home";
import Tags from "../src/components/Home/Tags";
import Profile from "../src/components/Profile";
import ProfileFavorites from "../src/components/ProfileFavorites";
import Article from "../src/components/Article";
import ListPagination from "../src/components/ListPagination";
import ArticleActions from "../src/components/Article/ArticleActions";
import DeleteButton from "../src/components/Article/DeleteButton";
import CommentInput from "../src/components/Article/CommentInput";

const articleShape = (slug = "s", favorited = false) => ({
  slug,
  title: "Title",
  description: "Desc",
  body: "Body",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  tagList: ["t1"],
  favorited,
  favoritesCount: 2,
  author: { username: "author", image: "" },
});

function bootStore() {
  const store = createTestStore();
  store.dispatch({
    type: APP_LOAD,
    token: null,
    payload: null,
    skipTracking: true,
  });
  return store;
}

describe("presentational components", () => {
  it("Header logged out and logged in", () => {
    const { rerender } = render(
      <MemoryRouter>
        <Header appName="CONDUIT" currentUser={null} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    rerender(
      <MemoryRouter>
        <Header
          appName="CONDUIT"
          currentUser={{ username: "u1", image: "http://x/img.png" }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("u1")).toBeInTheDocument();
  });

  it("Banner with and without token", () => {
    const { container, rerender } = render(<Banner appName="X" token={null} />);
    expect(container.querySelector(".banner")).toBeTruthy();
    rerender(<Banner appName="X" token="jwt" />);
    expect(container.firstChild).toBeNull();
  });

  it("ListErrors branches", () => {
    const { container, rerender } = render(<ListErrors errors={null} />);
    expect(container.firstChild).toBeNull();
    rerender(<ListErrors errors={{ email: "bad" }} />);
    expect(screen.getByText(/email/)).toBeInTheDocument();
  });

  it("ArticleList branches", () => {
    const store = bootStore();
    const wrap = (node) => (
      <Provider store={store}>
        <MemoryRouter>{node}</MemoryRouter>
      </Provider>
    );
    const { rerender } = render(
      wrap(
        <ArticleList
          pager={null}
          articles={null}
          articlesCount={0}
          currentPage={0}
        />,
      ),
    );
    expect(screen.getByText(/Loading/)).toBeInTheDocument();
    rerender(
      wrap(
        <ArticleList
          pager={null}
          articles={[]}
          articlesCount={0}
          currentPage={0}
        />,
      ),
    );
    expect(screen.getByText(/No articles/)).toBeInTheDocument();
    rerender(
      wrap(
        <ArticleList
          pager={null}
          articles={[articleShape()]}
          articlesCount={25}
          currentPage={0}
        />,
      ),
    );
    expect(screen.getByText("Title")).toBeInTheDocument();
  });

  it("ArticleMeta renders", () => {
    render(
      <Provider store={bootStore()}>
        <MemoryRouter>
          <ArticleMeta article={articleShape()} canModify={false} />
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.getByText("author")).toBeInTheDocument();
  });

  it("CommentList and Comment", () => {
    const store = bootStore();
    const comments = [
      {
        id: 1,
        body: "c1",
        author: { username: "a1", image: "" },
        createdAt: new Date().toISOString(),
      },
    ];
    render(
      <Provider store={store}>
        <MemoryRouter>
          <CommentList comments={comments} slug="s" currentUser={{ username: "a1" }} />
        </MemoryRouter>
      </Provider>,
    );
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Comment
            comment={comments[0]}
            slug="s"
            currentUser={{ username: "other" }}
          />
        </MemoryRouter>
      </Provider>,
    );
  });

  it("CommentContainer guest and user", () => {
    const store = bootStore();
    const comments = [
      {
        id: 1,
        body: "b",
        author: { username: "a", image: "" },
        createdAt: new Date().toISOString(),
      },
    ];
    const { rerender } = render(
      <Provider store={store}>
        <MemoryRouter>
          <CommentContainer
            comments={comments}
            slug="s"
            currentUser={null}
            errors={null}
          />
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.getByText(/Sign in/)).toBeInTheDocument();
    rerender(
      <Provider store={store}>
        <MemoryRouter>
          <CommentContainer
            comments={comments}
            slug="s"
            currentUser={{ username: "u", image: "" }}
            errors={{ body: "e" }}
          />
        </MemoryRouter>
      </Provider>,
    );
  });
});

describe("connected small components", () => {
  it("ListPagination hidden when few articles", () => {
    const store = bootStore();
    render(
      <Provider store={store}>
        <ListPagination articlesCount={5} currentPage={0} />
      </Provider>,
    );
    expect(document.querySelector(".pagination")).toBeNull();
  });

  it("ListPagination with pager", async () => {
    const store = bootStore();
    const dispatch = jest.spyOn(store, "dispatch");
    const { unmount } = render(
      <Provider store={store}>
        <ListPagination
          articlesCount={25}
          currentPage={0}
          pager={(p) => Promise.resolve({ articles: [], articlesCount: 0, page: p })}
        />
      </Provider>,
    );
    const links = document.querySelectorAll(".page-link");
    fireEvent.click(links[1].parentElement);
    expect(dispatch).toHaveBeenCalled();
    dispatch.mockRestore();
    unmount();
  });

  it("ListPagination without pager uses agent", async () => {
    nock("http://localhost").get("/api/articles?limit=10&offset=10").reply(200, {
      articles: [],
      articlesCount: 0,
    });
    const store = bootStore();
    render(
      <Provider store={store}>
        <ListPagination articlesCount={25} currentPage={0} pager={null} />
      </Provider>,
    );
    const links = document.querySelectorAll(".page-link");
    fireEvent.click(links[1].parentElement);
    await waitFor(() => expect(nock.isDone()).toBe(true));
  });

  it("ArticleActions modify and read-only", async () => {
    const store = bootStore();
    const a = articleShape();
    const { rerender } = render(
      <Provider store={store}>
        <MemoryRouter>
          <ArticleActions canModify article={a} />
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.getByText(/Edit Article/)).toBeInTheDocument();
    nock("http://localhost").delete("/api/articles/s").reply(204);
    fireEvent.click(screen.getByText(/Delete Article/));
    await waitFor(() => expect(nock.isDone()).toBe(true));
    rerender(
      <Provider store={store}>
        <MemoryRouter>
          <ArticleActions canModify={false} article={a} />
        </MemoryRouter>
      </Provider>,
    );
  });

  it("DeleteButton visibility", async () => {
    const store = bootStore();
    const { rerender } = render(
      <Provider store={store}>
        <DeleteButton show={false} slug="s" commentId={1} />
      </Provider>,
    );
    expect(document.querySelector(".mod-options")).toBeNull();
    rerender(
      <Provider store={store}>
        <DeleteButton show slug="s" commentId={1} />
      </Provider>,
    );
    nock("http://localhost").delete("/api/articles/s/comments/1").reply(204);
    fireEvent.click(document.querySelector(".ion-trash-a"));
    await waitFor(() => expect(nock.isDone()).toBe(true));
  });

  it("ArticlePreview favorite toggle", async () => {
    const favArticle = (favorited) => ({
      slug: "s",
      title: "Title",
      description: "Desc",
      body: "Body",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tagList: ["t1"],
      favorited,
      favoritesCount: favorited ? 3 : 2,
      author: { username: "author", image: "" },
    });
    const store = createTestStore({
      articleList: {
        articles: [articleShape("s", false)],
        articlesCount: 1,
        currentPage: 0,
      },
    });
    store.dispatch({
      type: APP_LOAD,
      token: null,
      payload: null,
      skipTracking: true,
    });
    const postScope = nock("http://localhost")
      .post("/api/articles/s/favorite")
      .reply(200, { article: favArticle(true) });
    const delScope = nock("http://localhost")
      .delete("/api/articles/s/favorite")
      .reply(200, { article: favArticle(false) });
    const { rerender } = render(
      <Provider store={store}>
        <MemoryRouter>
          <ArticlePreview article={articleShape("s", false)} />
        </MemoryRouter>
      </Provider>,
    );
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(postScope.isDone()).toBe(true));
    rerender(
      <Provider store={store}>
        <MemoryRouter>
          <ArticlePreview article={articleShape("s", true)} />
        </MemoryRouter>
      </Provider>,
    );
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(delScope.isDone()).toBe(true));
  });

  it("CommentInput submits", async () => {
    const store = bootStore();
    nock("http://localhost")
      .post("/api/articles/slug1/comments")
      .reply(200, { comment: { id: 9, body: "x", author: {}, createdAt: "" } });
    render(
      <Provider store={store}>
        <CommentInput slug="slug1" currentUser={{ username: "u", image: "" }} />
      </Provider>,
    );
    fireEvent.change(screen.getByPlaceholderText(/Write a comment/), {
      target: { value: "hello" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /Post Comment/i }).closest("form"));
    await waitFor(() => expect(nock.isDone()).toBe(true));
  });
});

describe("pages with router", () => {
  it("Login flow", async () => {
    nock("http://localhost")
      .post("/api/users/login")
      .reply(200, { user: { email: "a@b.com", username: "u", token: "t", bio: "", image: "" } });
    const store = createTestStore({
      auth: { email: "a@b.com", password: "pw", errors: null, inProgress: false },
    });
    store.dispatch({
      type: APP_LOAD,
      token: null,
      payload: null,
      skipTracking: true,
    });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/login"]}>
          <Route path="/login" component={Login} />
        </MemoryRouter>
      </Provider>,
    );
    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "a@b.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "pw" },
    });
    fireEvent.click(screen.getByText("Sign in"));
    await waitFor(() => expect(nock.isDone()).toBe(true));
  });

  it("Register flow", async () => {
    nock("http://localhost").post("/api/users").reply(201, {
      user: { email: "n@b.com", username: "nu", token: "t", bio: "", image: "" },
    });
    const store = createTestStore({
      auth: { email: "n@b.com", password: "pw", username: "nu", errors: null, inProgress: false },
    });
    store.dispatch({
      type: APP_LOAD,
      token: null,
      payload: null,
      skipTracking: true,
    });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/register"]}>
          <Route path="/register" component={Register} />
        </MemoryRouter>
      </Provider>,
    );
    fireEvent.change(screen.getByPlaceholderText("Username"), {
      target: { value: "nu" },
    });
    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "n@b.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "pw" },
    });
    fireEvent.click(screen.getByText("Sign up"));
    await waitFor(() => expect(nock.isDone()).toBe(true));
  });

  it("Settings and logout", async () => {
    nock("http://localhost").put("/api/user").reply(200, {
      user: { username: "me", email: "m@b.com", bio: "", image: "", token: "nt" },
    });
    const store = createTestStore({
      settings: { errors: null, inProgress: false },
      common: {
        appName: "App",
        token: "t",
        appLoaded: true,
        currentUser: { username: "me", email: "m@b.com", bio: "", image: "", token: "t" },
        redirectTo: null,
        viewChangeCounter: 0,
      },
    });
    const { unmount } = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/settings"]}>
          <Route path="/settings" component={Settings} />
        </MemoryRouter>
      </Provider>,
    );
    fireEvent.change(screen.getByPlaceholderText("Short bio about you"), {
      target: { value: "new bio" },
    });
    fireEvent.click(screen.getByText("Update Settings"));
    await waitFor(() => expect(nock.isDone()).toBe(true));
    fireEvent.change(screen.getByPlaceholderText("URL of profile picture"), {
      target: { value: "http://img" },
    });
    fireEvent.click(screen.getByText(/logout/i));
    unmount();
  });

  it("Editor new article", async () => {
    const store = bootStore();
    nock("http://localhost").post("/api/articles").reply(201, {
      article: {
        slug: "new-slug",
        title: "T",
        description: "D",
        body: "B",
        tagList: [],
        author: { username: "a", image: "" },
        createdAt: "",
        updatedAt: "",
        favorited: false,
        favoritesCount: 0,
      },
    });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/editor"]}>
          <Route exact path="/editor" component={Editor} />
        </MemoryRouter>
      </Provider>,
    );
    await waitFor(() => expect(screen.getByPlaceholderText("Article Title")).toBeInTheDocument());
    const titles = screen.getAllByPlaceholderText("Article Title");
    fireEvent.change(titles[0], { target: { value: "T" } });
    const descs = screen.getAllByPlaceholderText("What's this article about?");
    fireEvent.change(descs[0], { target: { value: "D" } });
    const bodies = screen.getAllByPlaceholderText(/markdown/);
    fireEvent.change(bodies[0], { target: { value: "B" } });
    fireEvent.click(screen.getByText("Publish Article"));
    await waitFor(() => expect(nock.isDone()).toBe(true));
  });

  it("Editor existing slug", async () => {
    const articleBody = {
      slug: "exists",
      title: "T",
      description: "D",
      body: "B",
      tagList: ["z"],
      author: { username: "a", image: "" },
      createdAt: "",
      updatedAt: "",
      favorited: false,
      favoritesCount: 0,
    };
    nock("http://localhost").get("/api/articles/exists").reply(200, {
      article: articleBody,
    });
    nock("http://localhost").put("/api/articles/exists").reply(200, {
      article: {
        slug: "exists",
        title: "T",
        description: "D",
        body: "C",
        tagList: ["z"],
        author: { username: "a", image: "" },
        createdAt: "",
        updatedAt: "",
        favorited: false,
        favoritesCount: 0,
      },
    });
    const store = bootStore();
    const { container, unmount } = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/editor/exists"]}>
          <Route path="/editor/:slug" component={Editor} />
        </MemoryRouter>
      </Provider>,
    );
    await waitFor(() =>
      expect(within(container).getByPlaceholderText(/markdown/)).toHaveValue("B"),
    );
    fireEvent.change(screen.getByPlaceholderText("Enter tags"), {
      target: { value: "x" },
    });
    fireEvent.keyUp(screen.getByPlaceholderText("Enter tags"), { keyCode: 13 });
    const rm = container.querySelector(".tag-list .ion-close-round");
    if (rm) {
      fireEvent.click(rm);
    }
    fireEvent.change(within(container).getByPlaceholderText(/markdown/), {
      target: { value: "C" },
    });
    await waitFor(() =>
      expect(within(container).getByPlaceholderText(/markdown/)).toHaveValue("C"),
    );
    fireEvent.click(within(container).getByText("Publish Article"));
    await waitFor(() => expect(nock.pendingMocks().length).toBe(0));
    unmount();
  });

  it("Home loads tags and articles", async () => {
    nock("http://localhost").get("/api/tags").reply(200, { tags: ["a", "b"] });
    nock("http://localhost").get("/api/articles?limit=10&offset=0").reply(200, {
      articles: [articleShape()],
      articlesCount: 1,
    });
    nock("http://localhost")
      .get("/api/articles?tag=a&limit=10&offset=0")
      .reply(200, { articles: [], articlesCount: 0 });
    const store = bootStore();
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/"]}>
          <Route path="/" component={Home} />
        </MemoryRouter>
      </Provider>,
    );
    await waitFor(() => expect(screen.getByText("Popular Tags")).toBeInTheDocument());
    const pill = await waitFor(() => {
      const el = document.querySelector(".sidebar .tag-list a.tag-pill");
      expect(el).toBeTruthy();
      return el;
    });
    fireEvent.click(pill);
    await waitFor(() => expect(nock.isDone()).toBe(true));
  });

  it("Tags list and click", async () => {
    nock("http://localhost")
      .get("/api/articles?tag=a&limit=10&offset=0")
      .reply(200, { articles: [], articlesCount: 0 });
    const onClick = jest.fn();
    const { container } = render(
      <MemoryRouter>
        <Tags tags={["a"]} onClickTag={onClick} />
      </MemoryRouter>,
    );
    fireEvent.click(container.querySelector("a.tag-pill"));
    await waitFor(() => expect(onClick).toHaveBeenCalled());
    const { container: c2 } = render(<Tags tags={null} onClickTag={onClick} />);
    expect(c2.textContent).toMatch(/Loading Tags/);
  });

  it("Article page renders markdown", async () => {
    nock("http://localhost").get("/api/articles/the-slug").reply(200, {
      article: articleShape("the-slug"),
    });
    nock("http://localhost").get("/api/articles/the-slug/comments").reply(200, { comments: [] });
    const store = bootStore();
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/article/the-slug"]}>
          <Route path="/article/:id" component={Article} />
        </MemoryRouter>
      </Provider>,
    );
    await waitFor(() => expect(screen.getByText("Title")).toBeInTheDocument());
  });

  it("Profile follow button", async () => {
    nock("http://localhost").get("/api/profiles/p1").reply(200, {
      profile: { username: "p1", bio: "", image: "", following: false },
    });
    nock("http://localhost")
      .get("/api/articles?author=p1&limit=5&offset=0")
      .reply(200, { articles: [], articlesCount: 0 });
    nock("http://localhost").post("/api/profiles/p1/follow").reply(200, {
      profile: { username: "p1", bio: "", image: "", following: true },
    });
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
        <MemoryRouter initialEntries={["/@p1"]}>
          <Route path="/@:username" component={Profile} />
        </MemoryRouter>
      </Provider>,
    );
    await waitFor(() => expect(screen.getByText("Follow p1")).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Follow p1/));
    await waitFor(() => expect(nock.isDone()).toBe(true));
  });

  it("Profile unfollow and favorites page", async () => {
    nock("http://localhost").get("/api/profiles/p3").reply(200, {
      profile: { username: "p3", bio: "", image: "", following: true },
    });
    nock("http://localhost")
      .get("/api/articles?author=p3&limit=5&offset=0")
      .reply(200, { articles: [], articlesCount: 0 });
    nock("http://localhost").delete("/api/profiles/p3/follow").reply(200, {
      profile: { username: "p3", bio: "", image: "", following: false },
    });
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
        <MemoryRouter initialEntries={["/@p3"]}>
          <Route path="/@:username" component={Profile} />
        </MemoryRouter>
      </Provider>,
    );
    await waitFor(() => expect(screen.getByText(/Unfollow p3/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Unfollow p3/));
    await waitFor(() => expect(nock.isDone()).toBe(true));

    nock("http://localhost").get("/api/profiles/p4").reply(200, {
      profile: { username: "p4", bio: "", image: "", following: false },
    });
    nock("http://localhost")
      .get("/api/articles?favorited=p4&limit=5&offset=0")
      .reply(200, { articles: [], articlesCount: 0 });
    render(
      <Provider store={bootStore()}>
        <MemoryRouter initialEntries={["/@p4/favorites"]}>
          <Route path="/@:username/favorites" component={ProfileFavorites} />
        </MemoryRouter>
      </Provider>,
    );
    await waitFor(() => expect(screen.getByText("Favorited Articles")).toBeInTheDocument());
  });

  it("App loads with jwt", async () => {
    window.localStorage.setItem("jwt", "stored");
    nock("http://localhost")
      .get("/api/user")
      .reply(200, {
        user: { username: "u", email: "u@e.com", bio: "", image: "", token: "stored" },
      });
    nock("http://localhost").get("/api/tags").reply(200, { tags: [] });
    nock("http://localhost")
      .get("/api/articles/feed?limit=10&offset=0")
      .reply(200, { articles: [], articlesCount: 0 });
    const store = createTestStore({
      common: {
        appName: "App",
        token: null,
        appLoaded: false,
        currentUser: null,
        redirectTo: null,
        viewChangeCounter: 0,
      },
    });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/"]}>
          <Route path="/" component={App} />
        </MemoryRouter>
      </Provider>,
    );
    await waitFor(() => expect(nock.isDone()).toBe(true));
  });
});
