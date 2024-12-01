import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { Hono } from "hono";
import { Octokit } from "octokit";
import {
  fetchRepositoryBinaryContent,
  fetchRepositoryContent,
  fetchRepositoryTree,
} from "./utils/github";

type Env = {
  Variables: {
    octokit: Octokit;
  };
};

const app = new Hono<Env>();

app.use("*", clerkMiddleware());

app.use(async (c, next) => {
  c.set(
    "octokit",
    new Octokit({
      // TODO: use GitHub App based authentication
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      auth: (c.env as any).GITHUB_TOKEN,
    })
  );

  await next();
});

app.use(async (c, next) => {
  if (c.req.path === "/") {
    return await next();
  }

  const auth = getAuth(c);

  if (auth?.userId === undefined || auth?.userId === null) {
    return c.json(
      {
        message: "Unauthorized",
      },
      401
    );
  }

  await next();
});

app.get("/api/tree/:owner/:repo", async (c) => {
  const { owner, repo } = c.req.param();
  const tree = await fetchRepositoryTree(c.get("octokit"), {
    owner,
    repo,
  });

  return c.json({
    tree,
  });
});

app.get("/api/content/:owner/:repo/:path{.*}", async (c) => {
  const { owner, repo, path } = c.req.param();
  const body = await fetchRepositoryContent(c.get("octokit"), {
    owner,
    repo,
    path,
  });

  return c.json({
    body,
  });
});

app.get("/api/image/:owner/:repo/:path{.*}", async (c) => {
  const { owner, repo, path } = c.req.param();
  const buffer = await fetchRepositoryBinaryContent(c.get("octokit"), {
    owner,
    repo,
    path,
  });

  return c.body(buffer.buffer, 200, {
    "Content-Type": "application/octet-stream",
  });
});

export default app;
