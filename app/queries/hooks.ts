import { useQuery } from "@tanstack/react-query";
import { useHonoClient } from "~/hooks/use-hono-client";
import { keys } from "./keys";

export const useOwners = () => {
  const honoClient = useHonoClient();
  return useQuery({
    queryKey: keys.owners,
    queryFn: async () => {
      const res = await honoClient.api.owners.$get();

      return res.json().then((data) => data.owners);
    },
  });
};

export const useRepositories = (owner: string) => {
  const honoClient = useHonoClient();
  return useQuery({
    queryKey: keys.repositories(owner),
    queryFn: async () => {
      const res = await honoClient.api.repositories[":owner"].$get({
        param: {
          owner,
        },
      });

      if (res.ok && res.status === 200) {
        return res.json().then((data) => data.repositories);
      }
      throw new Error("Failed to fetch repositories");
    },
    enabled: owner !== "",
  });
};

export const useGitTree = (owner: string, repo: string) => {
  const honoClient = useHonoClient();
  return useQuery({
    queryKey: keys.gitTree(owner, repo),
    queryFn: async () => {
      const res = await honoClient.api.tree[":owner"][":repo"].$get({
        param: {
          owner,
          repo,
        },
      });

      if (res.ok && res.status === 200) {
        return res.json().then((data) => data.tree);
      }
      throw new Error("Failed to fetch tree");
    },
    enabled: owner !== "" && repo !== "",
  });
};

export const useTextContent = (owner: string, repo: string, path: string) => {
  const honoClient = useHonoClient();
  return useQuery({
    queryKey: keys.textContent(owner, repo, path),
    queryFn: async () => {
      const res = await honoClient.api.content[":owner"][":repo"][
        ":path{.*}"
      ].$get({
        param: {
          owner,
          repo,
          path,
        },
      });

      return res.json().then((data) => data.body);
    },
    enabled: owner !== "" && repo !== "" && path !== "",
  });
};
