import reducer from "../src/reducer";

describe("src/reducer module", () => {
  it("exports combined reducer", () => {
    const s = reducer(undefined, { type: "__probe__" });
    expect(s).toHaveProperty("article");
    expect(s).toHaveProperty("router");
  });
});
