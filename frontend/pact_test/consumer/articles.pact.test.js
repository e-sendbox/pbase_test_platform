// ОБНОВЛЕНО: Используем нативный Pact и измененные импорты матчеров
const { PactV3, Matchers } = require("@pact-foundation/pact");
const path = require("path");
// ОБНОВЛЕНО: Убрали superagent-promise, используем чистый superagent
const superagent = require("superagent");

// ОБНОВЛЕНО: Matchers теперь доступны напрямую через деструктуризацию
const { like, eachLike, iso8601DateTime } = Matchers;

describe("Conduit API - Articles", () => {
  // ОБНОВЛЕНО: Используем PactV3 для современной спецификации
  const provider = new PactV3({
    consumer: "conduit-frontend",
    provider: "conduit-backend",
    port: 1234,
    log: path.resolve(process.cwd(), "logs", "pact.log"),
    dir: path.resolve(process.cwd(), "pacts"),
    logLevel: "info",
  });


  describe("GET /api/articles", () => {
    const expectedResponse = {
      articles: eachLike({
        slug: like("how-to-train-your-dragon"),
        title: like("How to train your dragon"),
        description: like("Ever wonder how?"),
        body: like("It takes a Jacobian"),
        tagList: like(["dragons", "training"]),
        createdAt: iso8601DateTime,
        updatedAt: iso8601DateTime,
        favorited: like(false),
        favoritesCount: like(0),
        author: like({
          username: like("testuser"),
          bio: like(""),
          image: like(""),
          following: like(false),
        }),
      }),
      articlesCount: like(1),
    };

    it("returns a list of articles", async () => {
      // ОБНОВЛЕНО: V3 использует метод .addInteraction внутри теста
      await provider.addInteraction({
        states: [{ description: "articles exist in the system" }],
        uponReceiving: "a request to get all articles",
        withRequest: {
          method: "GET",
          path: "/api/articles",
          query: {
            limit: "10",
            offset: "0",
          },
        },
        willRespondWith: {
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: expectedResponse,
        },
      });

      return provider.executeTest(async (mockServer) => {
        const response = await superagent.get(`${mockServer.url}/api/articles?limit=10&offset=0`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("articles");
      });
    });
  });

  describe("POST /api/articles", () => {
    const newArticle = {
      article: {
        title: "My New Article",
        description: "This is a test article",
        body: "Article body content goes here",
        tagList: ["test", "demo"],
      },
    };

    it("creates a new article and returns it", async () => {
      await provider.addInteraction({
        states: [{ description: "user is authenticated" }],
        uponReceiving: "a request to create a new article",
        withRequest: {
          method: "POST",
          path: "/api/articles",
          headers: {
            "Content-Type": "application/json",
            "Authorization":"Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwiZXhwIjo0OTI5ODg5ODE0LCJzdWIiOiJhY2Nlc3MifQ.OQ6fhqJi-g_pFkbbN_-7XfTnqMz3t5GSqaGsty5yolc",
          },
          body: newArticle,
        },
        willRespondWith: {
          status: 201,
          headers: { "Content-Type": "application/json" },
          body: { 
            article: {
              slug: like("my-new-article-slug"),
              title: like(newArticle.article.title),
              description: like(newArticle.article.description),
              body: like(newArticle.article.body),
              tagList: like(newArticle.article.tagList),
              createdAt: iso8601DateTime,
              updatedAt: iso8601DateTime,
              favorited: like(false),
              favoritesCount: like(0),
              author: like({
                username: like("testuser"),
                bio: like(""),
                image: like(""),
                following: like(false),
              }),
            }
          },
        },
      });

      return provider.executeTest(async (mockServer) => {
        const response = await superagent
          .post(`${mockServer.url}/api/articles`)
          .send(newArticle)
          .set("Content-Type", "application/json")
          .set("Authorization", "Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwiZXhwIjo0OTI5ODg5ODE0LCJzdWIiOiJhY2Nlc3MifQ.OQ6fhqJi-g_pFkbbN_-7XfTnqMz3t5GSqaGsty5yolc");

        expect(response.status).toBe(201);
        expect(response.body.article).toHaveProperty("slug");
        expect(response.body.article).toHaveProperty("title");
        expect(response.body.article).toHaveProperty("author");
      });
    });
  });
});
