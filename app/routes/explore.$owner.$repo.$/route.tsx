import { useParams } from "@remix-run/react";
import { useEffect } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useOwner } from "~/components/Context/OwnerContext";
import { useRepository } from "~/components/Context/RepositoryContext";
import {
  useSelectedPath,
  useSetSelectedPath,
} from "~/components/Context/SelectedPathContext";
import { useTextContent } from "~/queries/hooks";

export default function Index() {
  const params = useParams();
  const setPath = useSetSelectedPath();
  const owner = useOwner();
  const repo = useRepository();
  const path = useSelectedPath();
  const content = useTextContent(owner, repo, path);

  useEffect(() => {
    setPath(params["*"]!);
  }, [setPath, params]);

  return (
    <main>
      <ReactMarkdown
        className={"prose w-full max-w-full p-4"}
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
                `${owner}/${repo}/` +
                path.substring(0, path.lastIndexOf("/")) +
                url.substring(1)
              );
            }
            return url;
          }
          return defaultUrlTransform(url);
        }}
      >
        {content.data ?? ""}
      </ReactMarkdown>
    </main>
  );
}
