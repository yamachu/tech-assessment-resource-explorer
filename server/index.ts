import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { Hono } from "hono";

const app = new Hono();

app.use("*", clerkMiddleware());

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

app.get("/api", (c) => {
  return c.json({
    message: "Hello",
  });
});

export default app;
