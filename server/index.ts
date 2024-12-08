import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { App as GitHubApp, Octokit } from "octokit";
import { allowedOwners, allowedRepos } from "./constants";
import {
  fetchRepositoryBinaryContent,
  fetchRepositoryContent,
  fetchRepositoryTree,
} from "./utils/github";
import { isValidOwner, isValidRepo } from "./utils/validator";

type Env = {
  Variables: {
    octokit: Octokit;
  };
  Bindings: {
    USE_GITHUB_APP: string; // we treat this truthy or falsy, so "false" is true
    // if USE_GITHUB_APP is false
    GITHUB_TOKEN: string;
    // if USE_GITHUB_APP is true
    GITHUB_APP_ID: string;
    GITHUB_APP_PRIVATE_KEY: string;
    GITHUB_APP_INSTALLATION_ID: string;
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
    credentials: true,
    maxAge: 600,
  })
);

app.use(async (c, next) => {
  if (c.env.USE_GITHUB_APP) {
    const gitHubApp = await new GitHubApp({
      appId: c.env.GITHUB_APP_ID,
      // Supports only PKCS8 PEM format
      // run: openssl pkcs8 -topk8 -inform PEM -outform PEM -in private_key_pkcs1.pem -out private_key_pkcs8.pem -nocrypt
      // and convert oneline
      // run: cat private_key_pkcs8.pem | awk '{printf "%s\\n", $0}'
      privateKey: c.env.GITHUB_APP_PRIVATE_KEY,
    }).getInstallationOctokit(JSON.parse(c.env.GITHUB_APP_INSTALLATION_ID));
    c.set("octokit", gitHubApp);
  } else {
    c.set(
      "octokit",
      new Octokit({
        auth: c.env.GITHUB_TOKEN,
      })
    );
  }

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
    if (!isValidOwner(owner) || !isValidRepo(owner, repo)) {
      return c.json(
        {
          error: "Bad Request",
        },
        400
      );
    }
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
    if (!isValidOwner(owner) || !isValidRepo(owner, repo)) {
      return c.json(
        {
          error: "Bad Request",
        },
        400
      );
    }
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
    if (!isValidOwner(owner) || !isValidRepo(owner, repo)) {
      return c.json(
        {
          error: "Bad Request",
        },
        400
      );
    }
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
    if (!isValidOwner(reqOwner)) {
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
