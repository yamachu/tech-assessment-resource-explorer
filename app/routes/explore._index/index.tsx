import { useState } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ExploreIndex() {
  const [content, setContent] = useState("");
  const [owner] = useState("yamachu");
  const [repo] = useState("my-articles");
  const [path] = useState("/c99/Article.md");

  return (
    <div>
      <button
        onClick={() =>
          fetch(`/api/tree/${owner}/${repo}`, {
            credentials: "include",
          })
            .then((v) => v.json())
            .then((v) => console.log(v))
        }
      >
        Tree
      </button>
      <button
        onClick={() => {
          fetch(`/api/content/${owner}/${repo}${path}`, {
            credentials: "include",
          })
            .then((v) => v.json() as Promise<{ body: string }>)
            .then((v) => setContent(v.body));
        }}
      >
        Fetch
      </button>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={(url, key, node) => {
          if (node.tagName === "img") {
            // TODO: ホンマにこうか確かめるのと、テスト
            if (url.startsWith("https://github.com")) {
              url.replace("https://github.com", "/api/image");
            } else if (url.startsWith(".")) {
              if (url.startsWith("..")) {
                const tmp = url.split("/");
                return (
                  [...tmp.slice(0, tmp.length - 2)].join("/") + url.substring(2)
                );
              }
              // FIXME: like path resolve...
              return (
                "/api/image/" +
                `${owner}/${repo}` +
                path.substring(0, path.lastIndexOf("/")) +
                url.substring(1)
              );
            }
            return url;
          }
          return defaultUrlTransform(url);
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
