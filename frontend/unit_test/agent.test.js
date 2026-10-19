import nock from "nock";
import agent from "../src/agent";

describe("agent HTTP client", () => {
  beforeEach(() => {
    agent.setToken(null);
  });

  afterEach(() => {
    agent.setToken(null);
  });

  it("covers all request helpers", async () => {
    nock("http://localhost").get("/api/user").reply(200, { user: {} });
    await agent.Auth.current();

    nock("http://localhost")
      .post("/api/users/login", { user: { email: "e", password: "p" } })
      .reply(200, {});
    await agent.Auth.login("e", "p");

    nock("http://localhost")
      .post("/api/users", { user: { username: "u", email: "e", password: "p" } })
      .reply(201, {});
    await agent.Auth.register("u", "e", "p");

    nock("http://localhost").put("/api/user", { user: { bio: "x" } }).reply(200, {});
    await agent.Auth.save({ bio: "x" });

    nock("http://localhost").get("/api/tags").reply(200, { tags: ["t"] });
    await agent.Tags.getAll();

    nock("http://localhost").get("/api/articles?limit=10&offset=0").times(2).reply(200, {});
    await agent.Articles.all(0);
    await agent.Articles.all();
    nock("http://localhost").get("/api/articles?limit=10&offset=10").reply(200, {});
    await agent.Articles.all(1);

    nock("http://localhost")
      .get("/api/articles?author=au&limit=5&offset=0")
      .reply(200, {});
    await agent.Articles.byAuthor("au", 0);
    nock("http://localhost")
      .get("/api/articles?author=au&limit=5&offset=0")
      .reply(200, {});
    await agent.Articles.byAuthor("au");

    nock("http://localhost")
      .get("/api/articles?tag=ta&limit=10&offset=0")
      .reply(200, {});
    await agent.Articles.byTag("ta", 0);
    nock("http://localhost")
      .get("/api/articles?tag=ta&limit=10&offset=0")
      .reply(200, {});
    await agent.Articles.byTag("ta");

    nock("http://localhost").delete("/api/articles/slug1").reply(204);
    await agent.Articles.del("slug1");

    nock("http://localhost").post("/api/articles/s1/favorite").reply(200, {});
    await agent.Articles.favorite("s1");

    nock("http://localhost")
      .get("/api/articles?favorited=fu&limit=5&offset=0")
      .reply(200, {});
    await agent.Articles.favoritedBy("fu", 0);

    nock("http://localhost")
      .get("/api/articles/feed?limit=10&offset=0")
      .reply(200, {});
    await agent.Articles.feed();

    nock("http://localhost").get("/api/articles/slugx").reply(200, {});
    await agent.Articles.get("slugx");

    nock("http://localhost").delete("/api/articles/s1/favorite").reply(200, {});
    await agent.Articles.unfavorite("s1");

    const art = {
      slug: "sl",
      title: "t",
      description: "d",
      body: "b",
      tagList: [],
    };
    nock("http://localhost")
      .put("/api/articles/sl", { article: { title: "t", description: "d", body: "b", tagList: [] } })
      .reply(200, {});
    await agent.Articles.update(art);

    nock("http://localhost")
      .post("/api/articles", { article: { title: "t", description: "d", body: "b", tagList: [] } })
      .reply(201, {});
    await agent.Articles.create({
      title: "t",
      description: "d",
      body: "b",
      tagList: [],
    });

    nock("http://localhost")
      .post("/api/articles/slug0/comments", { comment: { body: "c" } })
      .reply(200, {});
    await agent.Comments.create("slug0", { body: "c" });

    nock("http://localhost").delete("/api/articles/slug0/comments/9").reply(204);
    await agent.Comments.delete("slug0", "9");

    nock("http://localhost").get("/api/articles/slug0/comments").reply(200, {});
    await agent.Comments.forArticle("slug0");

    nock("http://localhost").post("/api/profiles/u1/follow").reply(200, {});
    await agent.Profile.follow("u1");

    nock("http://localhost").get("/api/profiles/u1").reply(200, {});
    await agent.Profile.get("u1");

    nock("http://localhost").delete("/api/profiles/u1/follow").reply(200, {});
    await agent.Profile.unfollow("u1");
  });

  it("sends authorization when token set", async () => {
    nock("http://localhost")
      .get("/api/tags")
      .matchHeader("authorization", "Token secret")
      .reply(200, { tags: [] });
    agent.setToken("secret");
    await agent.Tags.getAll();
  });

  it("setToken accepts null", () => {
    agent.setToken("x");
    agent.setToken(null);
  });
});
