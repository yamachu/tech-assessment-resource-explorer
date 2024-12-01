export const keys = {
  owners: ["owners"] as const,
  repositories: (owner: string) => ["repositories", owner] as const,
  gitTree: (owner: string, repo: string) => ["gitTree", owner, repo] as const,
  textContent: (owner: string, repo: string, path: string) =>
    ["textContent", owner, repo, path] as const,
};
