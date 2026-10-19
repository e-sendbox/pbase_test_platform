import React from "react";
import nock from "nock";
import { Provider } from "react-redux";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route } from "react-router-dom";
import { createTestStore } from "./helpers/testStore";
import Profile from "../src/components/Profile";

describe("Profile owner view", () => {
  it("shows edit settings for same user", async () => {
    nock("http://localhost").get("/api/profiles/me").reply(200, {
      profile: { username: "me", bio: "", image: "", following: false },
    });
    nock("http://localhost")
      .get("/api/articles?author=me&limit=5&offset=0")
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

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/@me"]}>
          <Route path="/@:username" component={Profile} />
        </MemoryRouter>
      </Provider>,
    );
    await waitFor(() =>
      expect(screen.getByText(/Edit Profile Settings/)).toBeInTheDocument(),
    );
  });
});
