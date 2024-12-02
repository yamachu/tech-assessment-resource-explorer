export const transform = (basePath: string, url: string) => {
  if (url.startsWith(".")) {
    if (url.startsWith("..")) {
      const t = basePath.split("/");
      return (
        "/api/image/" + t.slice(0, t.length - 2).join("/") + url.substring(2)
      );
    }

    return (
      "/api/image/" +
      basePath.substring(0, basePath.lastIndexOf("/")) +
      url.substring(1)
    );
  }
  return url;
};

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;
  describe("transform", () => {
    it("relative path one dot", () => {
      expect(
        transform("owner/repo/path/to/content.md", "./img/awesome-image.png")
      ).toBe("/api/image/owner/repo/path/to/img/awesome-image.png");
    });

    it("relative path two dots", () => {
      expect(
        transform("owner/repo/path/to/content.md", "../img/awesome-image.png")
      ).toBe("/api/image/owner/repo/path/img/awesome-image.png");
    });

    it.fails("absolute path", () => {
      expect(
        transform(
          "owner/repo/path/to/content.md",
          "https://github.com/owner/repo/blob/main/path/to/img/awesome-image.png"
        )
        // FIXME: default branch とか判定していないし、この PATH を元に request を送るので、うまい具合に消し飛ばす
      ).toBe("/api/image/owner/repo/path/to/img/awesome-image.png");
    });
  });
}
