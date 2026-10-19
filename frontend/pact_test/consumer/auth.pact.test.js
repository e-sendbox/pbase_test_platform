// ОБНОВЛЕНО: Используем PactV3 и современные матчеры
const { PactV3, Matchers } = require("@pact-foundation/pact");
const path = require("path");
// ОБНОВЛЕНО: Убрали superagent-promise, используем чистый superagent
const superagent = require("superagent");

// ОБНОВЛЕНО: Матчеры теперь используются как константы без скобок ()
const { like } = Matchers;

describe("Conduit API - Authentication", () => {
  // ОБНОВЛЕНО: Используем PactV3
  const provider = new PactV3({
    consumer: "conduit-frontend",
    provider: "conduit-backend",
    port: 1234,
    log: path.resolve(process.cwd(), "logs", "pact.log"),
    dir: path.resolve(process.cwd(), "pacts"),
    logLevel: "info",
  });

  describe("POST /api/users/login", () => {
    const loginRequest = {
      user: {
        email: "test@example.com",
        password: "password123",
      },
    };

    const expectedResponse = {
      user: {
        email: like("test@example.com"),
        token: like("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."),
        username: like("testuser"),
        bio: like(""),
        image: like(""),
      },
    };

    it("returns a user with token on successful login", async () => {
      // ОБНОВЛЕНО: Добавляем взаимодействие внутри теста для V3
      await provider.addInteraction({
        states: [{ description: "a user exists with email test@example.com" }],
        uponReceiving: "a login request with valid credentials",
        withRequest: {
          method: "POST",
          path: "/api/users/login",
          headers: {
            "Content-Type": "application/json",
          },
          body: loginRequest,
        },
        willRespondWith: {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
          body: expectedResponse,
        },
      });

      return provider.executeTest(async (mockServer) => {
        const response = await superagent
          .post(`${mockServer.url}/api/users/login`)
          .send(loginRequest)
          .set("Content-Type", "application/json");

        expect(response.status).toBe(200);
        expect(response.body.user).toHaveProperty("email");
        expect(response.body.user).toHaveProperty("token");
        expect(response.body.user).toHaveProperty("username");
      });
    });
  });

  describe("POST /api/users (register)", () => {
    const registerRequest = {
      user: {
        username: "newuser",
        email: "newuser@example.com",
        password: "password123",
      },
    };

    const expectedResponse = {
      user: {
        email: like("newuser@example.com"),
        token: like("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."),
        username: like("newuser"),
        bio: like(""),
        image: like(""),
      },
    };

    it("returns a user with token on successful registration", async () => {
      // ОБНОВЛЕНО: Добавляем взаимодействие внутри теста для V3
      await provider.addInteraction({
        states: [{ description: "no user exists with email newuser@example.com" }],
        uponReceiving: "a registration request with valid data",
        withRequest: {
          method: "POST",
          path: "/api/users",
          headers: {
            "Content-Type": "application/json",
          },
          body: registerRequest,
        },
        willRespondWith: {
          status: 201,
          headers: {
            "Content-Type": "application/json",
          },
          body: expectedResponse,
        },
      });

      return provider.executeTest(async (mockServer) => {
        const response = await superagent
          .post(`${mockServer.url}/api/users`)
          .send(registerRequest)
          .set("Content-Type", "application/json");

        expect(response.status).toBe(201);
        expect(response.body.user).toHaveProperty("email");
        expect(response.body.user).toHaveProperty("token");
        expect(response.body.user).toHaveProperty("username");
      });
    });
  });
});
