import { type Octokit } from "octokit";
import { appendLeafs, dir2Tree } from "./tree";

// https://docs.github.com/ja/rest/repos/contents?apiVersion=2022-11-28
export const fetchRepositoryContent = async (
  octokit: Octokit,
  params: {
    owner: string;
    repo: string;
    path: string;
  }
) => {
  const { owner, path, repo } = params;

  const content = await octokit.rest.repos.getContent({
    owner,
    repo,
    path,
    mediaType: {
      // NOTE: html だといい感じの html が返ってくるが、img タグの src の変更や setDangerouslyInnerHTML みたいになり微妙なので、自前で変換する
      format: "raw",
    },
  });

  return content.data as unknown as string;
};

export const fetchRepositoryBinaryContent = async (
  octokit: Octokit,
  params: {
    owner: string;
    repo: string;
    path: string;
  }
) => {
  const { owner, path, repo } = params;
  const content = await octokit.rest.repos.getContent({
    owner,
    repo,
    path,
    mediaType: {
      format: "object",
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = content.data as any;

  return Buffer.from(data.content, data.encoding);
};

const fetchRepositoryFiles = async (
  octokit: Octokit,
  params: {
    owner: string;
    repo: string;
  }
) => {
  const { owner, repo } = params;

  const treeResponse = await octokit.graphql<{
    repository: {
      defaultBranchRef: {
        name: string;
        target: { tree: { oid: string } };
      };
    };
  }>(
    `
    query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        defaultBranchRef {
          name
          target {
            ... on Commit {
              tree {
                oid
              }
            }
          }
        }
      }
    }
    `,
    {
      owner,
      repo,
    }
  );
  const treeSha: string =
    treeResponse.repository.defaultBranchRef.target.tree.oid;

  const repositoryFiles = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: treeSha,
    recursive: "true",
  });

  // https://docs.github.com/ja/rest/git/trees?apiVersion=2022-11-28#get-a-tree
  // if repositoryFiles.data.truncated ...
  return repositoryFiles;
};

export const fetchRepositoryTree = async (
  octokit: Octokit,
  params: {
    owner: string;
    repo: string;
  }
) => {
  const { owner, repo } = params;
  const repositoryFiles = await fetchRepositoryFiles(octokit, { owner, repo });

  const trees = repositoryFiles.data.tree.filter((v) => v.type === "tree") as {
    path: string;
    mode: string;
    type: string;
    sha: string;
    size: number;
    url: string;
  }[];

  const { children } = dir2Tree(trees, "", true);

  const blobs = repositoryFiles.data.tree.filter((v) => v.type === "blob") as {
    path: string;
    mode: string;
    type: string;
    sha: string;
    size: number;
    url: string;
  }[];

  const { children: entireTree } = appendLeafs(children, blobs, "", true);

  return entireTree;
};

export const fetchMaybeDocumentFileAuthor = async (
  octokit: Octokit,
  params: {
    owner: string;
    repo: string;
  }
) => {
  const { owner, repo } = params;
  const repositoryFiles = await fetchRepositoryFiles(octokit, { owner, repo });

  const paths = repositoryFiles.data.tree
    .map(({ path }) => path)
    .filter((v) => v !== undefined)
    .filter(
      (v) =>
        v.endsWith(".md") ||
        v.endsWith(".txt") ||
        v.endsWith(".text") ||
        v.endsWith(".pdf")
    );
  const response = await octokit.graphql(
    `
    query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        ${paths
          .map(
            (path, index) => `
            # https://docs.github.com/ja/graphql/reference/interfaces#gitobject
          file${index + 1}: object(expression: "HEAD") {
            ... on Commit {
              history(first: 1, path: "${path}") {
                edges {
                  node {
                    author {
                      user {
                        login
                      }
                    }
                  }
                }
              }
            }
          }
        `
          )
          .join("\n")}
      }
    }
    `,
    {
      owner,
      repo,
    }
  );

  return paths.map<{
    path: string;
    login: string;
  }>((_, index) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const commit = (response as any).repository[`file${index + 1}`].history
      .edges[0].node;
    return {
      path: paths[index],
      login: commit.author.user?.login,
    };
  });
};
