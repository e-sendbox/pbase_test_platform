describe("src/index", () => {
  it("invokes ReactDOM.render on load", () => {
    jest.resetModules();
    const mockRender = jest.fn();
    jest.doMock("react-dom", () => ({
      __esModule: true,
      default: { render: mockRender },
    }));
    require("../src/index");
    expect(mockRender).toHaveBeenCalled();
  });
});
