import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { Octokit } from "octokit";
import { allowedOwners, allowedRepos } from "./constants";
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

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

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

const routes = app
  .get("/api/tree/:owner/:repo", async (c) => {
    const { owner, repo } = c.req.param();
    const tree = await fetchRepositoryTree(c.get("octokit"), {
      owner,
      repo,
    });

    return c.json({
      tree,
    });
  })
  .get("/api/content/:owner/:repo/:path{.*}", async (c) => {
    const { owner, repo, path } = c.req.param();
    const body = await fetchRepositoryContent(c.get("octokit"), {
      owner,
      repo,
      path,
    });

    return c.json({
      body,
    });
  })
  .get("/api/image/:owner/:repo/:path{.*}", async (c) => {
    const { owner, repo, path } = c.req.param();
    const buffer = await fetchRepositoryBinaryContent(c.get("octokit"), {
      owner,
      repo,
      path,
    });

    return c.body(buffer.buffer, 200, {
      "Content-Type": "application/octet-stream",
    });
  })
  .get("/api/owners", async (c) => {
    return c.json({
      owners: allowedOwners,
    });
  })
  .get("/api/repositories/:owner", async (c) => {
    const { owner: reqOwner } = c.req.param();
    if (!allowedOwners.includes(reqOwner)) {
      return c.json(
        {
          error: "Bad Request",
        },
        400
      );
    }

    const maybeRepos = allowedRepos.find(([owner]) => owner === reqOwner);
    if (maybeRepos === undefined) {
      return c.json(
        {
          error: "Not Found",
        },
        404
      );
    }

    return c.json({
      repositories: maybeRepos[1],
    });
  });

export default app;
export type AppType = typeof routes;
