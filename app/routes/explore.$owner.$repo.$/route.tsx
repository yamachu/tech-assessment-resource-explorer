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
import { transform } from "~/utils/url";

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
            return transform(`${owner}/${repo}/${path}`, url);
          }
          return defaultUrlTransform(url);
        }}
      >
        {content.data ?? ""}
      </ReactMarkdown>
    </main>
  );
}
