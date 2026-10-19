import reducer from "../src/reducer";

describe("root reducer", () => {
  it("returns initial combined state", () => {
    const s = reducer(undefined, { type: "@@INIT" });
    expect(s).toHaveProperty("article");
    expect(s).toHaveProperty("router");
  });

  it("passes through unknown actions", () => {
    const s0 = reducer(undefined, { type: "@@INIT" });
    const s1 = reducer(s0, { type: "__unknown__action__" });
    expect(s1).toEqual(s0);
  });
});
