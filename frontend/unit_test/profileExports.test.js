import { mapStateToProps } from "../src/components/Profile";

describe("Profile exports", () => {
  it("mapStateToProps merges slices", () => {
    const s = mapStateToProps({
      articleList: { articles: [] },
      home: { tags: [] },
      common: { currentUser: null },
      profile: { username: "u" },
    });
    expect(s.profile.username).toBe("u");
    expect(s.articles).toEqual([]);
  });
});
