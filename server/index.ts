import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { Hono } from "hono";

const app = new Hono();

app.use("*", clerkMiddleware());

app.use(async (c, next) => {
  await next();
  c.header("X-Debug", "hono-remix-adapter");
});

app.get("/api", (c) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = getAuth(c);
  return c.json({
    message: "Hello",
  });
});

export default app;
