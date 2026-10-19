import * as types from "../src/constants/actionTypes";
import article from "../src/reducers/article";
import articleList from "../src/reducers/articleList";
import auth from "../src/reducers/auth";
import common from "../src/reducers/common";
import editor from "../src/reducers/editor";
import home from "../src/reducers/home";
import profile from "../src/reducers/profile";
import settings from "../src/reducers/settings";

const articlePayload = [
  {
    article: {
      title: "t",
      slug: "s",
      body: "b",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tagList: ["x"],
      description: "d",
      author: { username: "a", image: "" },
    },
  },
  { comments: [{ id: 1, body: "c", author: { username: "a", image: "" }, createdAt: new Date().toISOString() }] },
];

describe("reducers", () => {
  it("article covers all branches", () => {
    let s = article(undefined, { type: "@@INIT" });
    expect(s).toEqual({});

    s = article(s, { type: types.ARTICLE_PAGE_LOADED, payload: articlePayload });
    expect(s.article.slug).toBe("s");

    s = article(s, {
      type: types.ADD_COMMENT,
      error: true,
      payload: { errors: { body: "bad" } },
    });
    expect(s.commentErrors).toEqual({ body: "bad" });

    const loaded = article({}, { type: types.ARTICLE_PAGE_LOADED, payload: articlePayload });
    let s2 = article(loaded, {
      type: types.ADD_COMMENT,
      error: false,
      payload: {
        comment: {
          id: 2,
          body: "n",
          author: { username: "b", image: "" },
          createdAt: new Date().toISOString(),
        },
      },
    });
    expect(s2.comments.length).toBe(2);

    s2 = article(s2, { type: types.DELETE_COMMENT, commentId: 1 });
    expect(s2.comments.every((c) => c.id !== 1)).toBe(true);

    s = article(s, { type: types.ARTICLE_PAGE_UNLOADED });
    expect(s).toEqual({});

    const nullComments = article({}, {
      type: types.ARTICLE_PAGE_LOADED,
      payload: [articlePayload[0], { comments: null }],
    });
    expect(nullComments.comments).toBeNull();

    expect(article({ x: 1 }, { type: "unknown" })).toEqual({ x: 1 });
  });

  it("articleList covers branches", () => {
    const base = {
      articles: [
        { slug: "a", favorited: false, favoritesCount: 1, author: {}, title: "", description: "", createdAt: "", tagList: [] },
      ],
      pager: null,
    };
    let s = articleList(base, {
      type: types.ARTICLE_FAVORITED,
      payload: { article: { slug: "a", favorited: true, favoritesCount: 2 } },
    });
    expect(s.articles[0].favorited).toBe(true);

    s = articleList(s, {
      type: types.ARTICLE_UNFAVORITED,
      payload: { article: { slug: "a", favorited: false, favoritesCount: 1 } },
    });
    expect(s.articles[0].favorited).toBe(false);

    const two = {
      articles: [
        { slug: "a", favorited: false, favoritesCount: 0, author: {}, title: "", description: "", createdAt: "", tagList: [] },
        { slug: "b", favorited: false, favoritesCount: 0, author: {}, title: "", description: "", createdAt: "", tagList: [] },
      ],
      pager: null,
    };
    articleList(two, {
      type: types.ARTICLE_FAVORITED,
      payload: { article: { slug: "b", favorited: true, favoritesCount: 1 } },
    });

    s = articleList(s, {
      type: types.SET_PAGE,
      page: 1,
      payload: { articles: [], articlesCount: 0 },
    });
    expect(s.currentPage).toBe(1);

    s = articleList(s, {
      type: types.APPLY_TAG_FILTER,
      tag: "t",
      pager: () => {},
      payload: { articles: [], articlesCount: 0 },
    });
    expect(s.tag).toBe("t");

    s = articleList({}, {
      type: types.HOME_PAGE_LOADED,
      tab: "all",
      pager: () => {},
      payload: [{ tags: ["z"] }, { articles: [], articlesCount: 0 }],
    });
    expect(s.tags).toEqual(["z"]);

    expect(
      articleList({ prev: 1 }, {
        type: types.HOME_PAGE_LOADED,
        tab: "all",
        pager: () => {},
        payload: [null, { articles: [], articlesCount: 0 }],
      }),
    ).toEqual({ prev: 1 });

    s = articleList(s, { type: types.HOME_PAGE_UNLOADED });
    expect(s).toEqual({});

    s = articleList({}, {
      type: types.CHANGE_TAB,
      tab: "feed",
      pager: () => {},
      payload: { articles: [], articlesCount: 0 },
    });
    expect(s.tab).toBe("feed");

    s = articleList({}, {
      type: types.PROFILE_PAGE_LOADED,
      pager: () => {},
      payload: [{}, { articles: [], articlesCount: 0 }],
    });
    expect(s.articles).toEqual([]);

    expect(
      articleList({ prev: 1 }, {
        type: types.PROFILE_PAGE_LOADED,
        pager: () => {},
        payload: [{}, null],
      }),
    ).toEqual({ prev: 1 });

    s = articleList(s, { type: types.PROFILE_PAGE_UNLOADED });
    expect(s).toEqual({});

    s = articleList({}, {
      type: types.PROFILE_FAVORITES_PAGE_LOADED,
      pager: () => {},
      payload: [{}, { articles: [], articlesCount: 0 }],
    });
    s = articleList(s, { type: types.PROFILE_FAVORITES_PAGE_UNLOADED });
    expect(s).toEqual({});

    expect(articleList({ a: 1 }, { type: "noop" })).toEqual({ a: 1 });
  });

  it("auth reducer", () => {
    let s = auth(undefined, { type: types.LOGIN, error: false, payload: { user: { token: "t" } } });
    expect(s.errors).toBeNull();

    s = auth(s, { type: types.LOGIN, error: true, payload: { errors: { e: "x" } } });
    expect(s.errors).toEqual({ e: "x" });

    s = auth(s, { type: types.LOGIN_PAGE_UNLOADED });
    expect(s).toEqual({});

    s = auth({ x: 1 }, { type: types.REGISTER_PAGE_UNLOADED });
    expect(s).toEqual({});

    s = auth({ inProgress: false }, { type: types.ASYNC_START, subtype: types.LOGIN });
    expect(s.inProgress).toBe(true);

    s = auth({ inProgress: true }, { type: types.ASYNC_START, subtype: types.REGISTER });
    expect(s.inProgress).toBe(true);

    s = auth({ x: 1 }, { type: types.ASYNC_START, subtype: "other" });
    expect(s).toEqual({ x: 1 });

    s = auth({}, { type: types.UPDATE_FIELD_AUTH, key: "email", value: "v" });
    expect(s.email).toBe("v");

    expect(auth({ k: 1 }, { type: "unknown" })).toEqual({ k: 1 });
  });

  it("common reducer", () => {
    let s = common(undefined, {
      type: types.APP_LOAD,
      token: "tok",
      payload: { user: { username: "u" } },
    });
    expect(s.appLoaded).toBe(true);

    s = common(s, { type: types.APP_LOAD, token: null, payload: null });
    expect(s.currentUser).toBeNull();

    s = common(s, { type: types.REDIRECT });
    expect(s.redirectTo).toBeNull();

    s = common(s, { type: types.LOGOUT });
    expect(s.redirectTo).toBe("/");

    s = common(s, { type: types.ARTICLE_SUBMITTED, payload: { article: { slug: "sl" } } });
    expect(s.redirectTo).toContain("/article/sl");

    s = common(s, { type: types.SETTINGS_SAVED, error: true, payload: { errors: {} } });
    expect(s.currentUser).toBeNull();

    s = common(
      { redirectTo: null, appLoaded: true, appName: "A", token: null, currentUser: null, viewChangeCounter: 0 },
      { type: types.SETTINGS_SAVED, error: false, payload: { user: { username: "x" } } },
    );
    expect(s.redirectTo).toBe("/");

    s = common(s, {
      type: types.LOGIN,
      error: false,
      payload: { user: { token: "1", username: "u" } },
    });
    s = common(s, { type: types.LOGIN, error: true, payload: { errors: { x: "y" } } });
    s = common(s, {
      type: types.REGISTER,
      error: false,
      payload: { user: { token: "2", username: "r" } },
    });

    s = common(s, { type: types.DELETE_ARTICLE });
    expect(s.redirectTo).toBe("/");

    s = common(s, { type: types.ARTICLE_PAGE_UNLOADED });
    expect(s.viewChangeCounter).toBeGreaterThan(0);

    expect(common({ v: 0 }, { type: "x" })).toEqual({ v: 0 });
  });

  it("editor reducer", () => {
    let s = editor(undefined, {
      type: types.EDITOR_PAGE_LOADED,
      payload: { article: { slug: "s", title: "t", description: "d", body: "b", tagList: ["a"] } },
    });
    expect(s.articleSlug).toBe("s");

    s = editor({}, { type: types.EDITOR_PAGE_LOADED, payload: null });
    expect(s.articleSlug).toBe("");

    s = editor(s, { type: types.ARTICLE_SUBMITTED, error: true, payload: { errors: { t: "e" } } });
    expect(s.errors).toEqual({ t: "e" });

    s = editor(s, { type: types.ASYNC_START, subtype: types.ARTICLE_SUBMITTED });
    expect(s.inProgress).toBe(true);

    s = editor({ tagList: [], tagInput: "x" }, { type: types.ADD_TAG });
    expect(s.tagList).toEqual(["x"]);

    s = editor({ tagList: ["a", "b"] }, { type: types.REMOVE_TAG, tag: "a" });
    expect(s.tagList).toEqual(["b"]);

    s = editor({}, { type: types.UPDATE_FIELD_EDITOR, key: "title", value: "v" });
    expect(s.title).toBe("v");

    s = editor({ x: 1 }, { type: types.ASYNC_START, subtype: "other" });
    expect(s).toEqual({ x: 1 });

    s = editor(s, { type: types.EDITOR_PAGE_UNLOADED });
    expect(s).toEqual({});

    expect(editor({ z: 1 }, { type: "?" })).toEqual({ z: 1 });
  });

  it("home reducer", () => {
    let s = home({}, {
      type: types.HOME_PAGE_LOADED,
      payload: [{ tags: ["a"] }, {}],
    });
    expect(s.tags).toEqual(["a"]);

    expect(
      home({ k: 1 }, {
        type: types.HOME_PAGE_LOADED,
        payload: [null, {}],
      }),
    ).toEqual({ k: 1 });

    s = home(s, { type: types.HOME_PAGE_UNLOADED });
    expect(s).toEqual({});
    expect(home({ t: 1 }, { type: "x" })).toEqual({ t: 1 });
  });

  it("profile reducer", () => {
    const prof = { username: "u", bio: "", image: "", following: false };
    let s = profile({}, {
      type: types.PROFILE_PAGE_LOADED,
      payload: [{ profile: prof }, {}],
    });
    expect(s.username).toBe("u");

    s = profile(s, { type: types.FOLLOW_USER, payload: { profile: { ...prof, following: true } } });
    expect(s.following).toBe(true);

    s = profile(s, { type: types.UNFOLLOW_USER, payload: { profile: { ...prof, following: false } } });
    expect(s.following).toBe(false);

    s = profile(s, { type: types.PROFILE_PAGE_UNLOADED });
    expect(s).toEqual({});

    expect(profile({ a: 1 }, { type: "none" })).toEqual({ a: 1 });
  });

  it("settings reducer", () => {
    let s = settings({}, { type: types.SETTINGS_SAVED, error: false, payload: {} });
    expect(s.inProgress).toBe(false);

    s = settings({}, { type: types.SETTINGS_SAVED, error: true, payload: { errors: { a: "b" } } });
    expect(s.errors).toEqual({ a: "b" });

    s = settings(s, { type: types.ASYNC_START });
    expect(s.inProgress).toBe(true);

    s = settings(s, { type: types.SETTINGS_PAGE_UNLOADED });
    expect(s).toEqual({});

    expect(settings({ q: 1 }, { type: "?" })).toEqual({ q: 1 });
  });
});
