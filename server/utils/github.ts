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

export const fetchRepositoryTree = async (
  octokit: Octokit,
  params: {
    owner: string;
    repo: string;
  }
) => {
  const { owner, repo } = params;

  // リポジトリのデフォルトブランチを取得
  const repoInfo = await octokit.rest.repos.get({
    owner,
    repo,
  });
  const defaultBranch = repoInfo.data.default_branch;

  // デフォルトブランチの最新コミットを取得
  const branchInfo = await octokit.rest.repos.getBranch({
    owner,
    repo,
    branch: defaultBranch,
  });
  const latestCommitSha = branchInfo.data.commit.sha;

  // 最新コミットのツリーSHAを取得
  const commitInfo = await octokit.rest.git.getCommit({
    owner,
    repo,
    commit_sha: latestCommitSha,
  });
  const treeSha = commitInfo.data.tree.sha;

  const repositoryFiles = await octokit.request(
    "GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
    {
      owner,
      repo,
      tree_sha: treeSha,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
      recursive: "true",
    }
  );

  // https://docs.github.com/ja/rest/git/trees?apiVersion=2022-11-28#get-a-tree
  // if repositoryFiles.data.truncated ...
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

// TODO: Get Author account...
// maybe octokit.rest.repos.listCommits is useful
// usecase: fetch specified user's files
