import type { LinksFunction } from "@remix-run/cloudflare";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

import "./tailwind.css";

import { ClerkProvider } from "@clerk/clerk-react";

import { hc } from "hono/client";
import type { AppType } from "server";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { HonoClientProvider } from "./hooks/use-hono-client";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error("Add your Clerk publishable key to the .env file");
}

const queryClient = new QueryClient();
// TODO: use the correct URL, deploy~
const honoClient = hc<AppType>("", {
  headers: {
    credentials: "include",
  },
});

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <HonoClientProvider client={honoClient}>
          <Outlet />
        </HonoClientProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
