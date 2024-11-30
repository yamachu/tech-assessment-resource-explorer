import { SignIn } from "@clerk/clerk-react";
import type { MetaFunction } from "@remix-run/cloudflare";

export const meta: MetaFunction = () => {
  return [
    { title: "Tech Assessment Resource Explorer" },
    {
      name: "description",
      content: "Let's explore the sea of wisdom of our ancestors!",
    },
  ];
};

export default function Index() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <SignIn forceRedirectUrl={"/explore"} />
    </div>
  );
}
