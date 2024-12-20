type GitHubContentTree<T extends { path: string }> = T & {
  children: GitHubContentTree<T>[];
};

type GitHubContentLeaf<T extends { path: string }> = T;

const separator = "/";

const pathDepthDivider = <T extends { path: string }>(
  candidates: T[],
  rootName: string,
  separator: string,
  isRoot?: boolean
) =>
  candidates.reduce<{
    currentDepth: T[];
    other: T[];
  }>(
    (prev, acc) => {
      if (isRoot) {
        if (acc.path.includes(separator)) {
          return {
            currentDepth: prev.currentDepth,
            other: [...prev.other, acc],
          };
        }
        return {
          currentDepth: [...prev.currentDepth, acc],
          other: prev.other,
        };
      }

      const subPath = `${rootName}${separator}`;
      if (acc.path.startsWith(subPath)) {
        if (!acc.path.substring(subPath.length).includes(separator)) {
          return {
            currentDepth: [...prev.currentDepth, acc],
            other: prev.other,
          };
        }
        return {
          currentDepth: prev.currentDepth,
          other: [...prev.other, acc],
        };
      }
      return {
        currentDepth: prev.currentDepth,
        other: [...prev.other, acc],
      };
    },
    { currentDepth: [], other: [] }
  );

export const dir2Tree = <T extends { path: string }>(
  candidates: T[],
  rootName: string,
  isRoot?: boolean
): { children: GitHubContentTree<T>[]; other: T[] } => {
  if (candidates.length === 0) {
    return { children: [], other: [] };
  }

  const { currentDepth, other } = pathDepthDivider(
    candidates,
    rootName,
    separator,
    isRoot
  );

  return currentDepth.reduce<{
    children: GitHubContentTree<T>[];
    other: T[];
  }>(
    (prev, acc) => {
      const { children, other } = dir2Tree(prev.other, acc.path);
      return {
        children: [
          ...prev.children,
          {
            ...acc,
            children,
          },
        ],
        other,
      };
    },
    {
      children: [] as GitHubContentTree<T>[],
      other,
    }
  );
};

export const appendLeafs = <T extends { path: string }>(
  nodes: GitHubContentTree<T>[],
  candidates: T[],
  rootName: string,
  isRoot?: boolean
): {
  children: Array<GitHubContentTree<T> | GitHubContentLeaf<T>>;
  other: T[];
} => {
  const { currentDepth, other } = pathDepthDivider(
    candidates,
    rootName,
    separator,
    isRoot
  );

  if (nodes.length === 0) {
    return {
      children: currentDepth,
      other,
    };
  }

  const leafAppended = nodes.reduce(
    (prev, acc) => {
      const { children, other } = appendLeafs(
        acc.children,
        prev.other,
        acc.path
      );
      return {
        children: [...prev.children, { ...acc, children }],
        other,
      };
    },
    {
      children: [] as Array<GitHubContentTree<T> | GitHubContentLeaf<T>>,
      other,
    }
  );

  return {
    children: [...leafAppended.children, ...currentDepth],
    other: leafAppended.other,
  };
};

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;
  describe("tree", () => {
    it("dir2Tree", () => {
      expect(
        dir2Tree(
          [
            {
              path: "rootDirA",
            },
            {
              path: "rootDirB",
            },
            {
              path: "rootDirA/A",
            },
            {
              path: "rootDirA/B",
            },
            {
              path: "rootDirA/A/D",
            },
          ],
          "",
          true
        )
      ).toStrictEqual({
        children: [
          {
            path: "rootDirA",
            children: [
              {
                path: "rootDirA/A",
                children: [{ path: "rootDirA/A/D", children: [] }],
              },
              {
                path: "rootDirA/B",
                children: [],
              },
            ],
          },
          {
            path: "rootDirB",
            children: [],
          },
        ],
        other: [],
      });
    });

    it("appendLeafs", () => {
      expect(
        appendLeafs(
          [
            {
              path: "rootDirA",
              children: [
                {
                  path: "rootDirA/A",
                  children: [{ path: "rootDirA/A/D", children: [] }],
                },
                {
                  path: "rootDirA/B",
                  children: [],
                },
              ],
            },
            {
              path: "rootDirB",
              children: [],
            },
          ],
          [
            {
              path: "rootFile",
            },
            {
              path: "rootDirA/fileA",
            },
            {
              path: "rootDirA/B/fileB",
            },
            {
              path: "rootDirA/A/D/fileC",
            },
            {
              path: "rootDirB/fileD",
            },
          ],
          "",
          true
        )
      ).toStrictEqual({
        children: [
          {
            path: "rootDirA",
            children: [
              {
                path: "rootDirA/A",
                children: [
                  {
                    path: "rootDirA/A/D",
                    children: [{ path: "rootDirA/A/D/fileC" }],
                  },
                ],
              },
              {
                path: "rootDirA/B",
                children: [
                  {
                    path: "rootDirA/B/fileB",
                  },
                ],
              },
              {
                path: "rootDirA/fileA",
              },
            ],
          },
          {
            path: "rootDirB",
            children: [
              {
                path: "rootDirB/fileD",
              },
            ],
          },
          {
            path: "rootFile",
          },
        ],
        other: [],
      });
    });
  });
}
