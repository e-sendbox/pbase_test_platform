import * as types from "../src/constants/actionTypes";

describe("actionTypes", () => {
  it("exports string constants", () => {
    expect(types.APP_LOAD).toBe("APP_LOAD");
    expect(types.LOGIN).toBe("LOGIN");
    expect(types.ASYNC_END).toBe("ASYNC_END");
  });
});
