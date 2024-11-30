import { Hono } from "hono";

const app = new Hono();

app.use(async (c, next) => {
  await next();
  c.header("X-Debug", "hono-remix-adapter");
});

app.get("/api", (c) => {
  return c.json({
    message: "Hello",
  });
});

export default app;
