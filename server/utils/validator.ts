import { allowedOwners, allowedRepos } from "../constants";

export const isValidOwner = (owner: string) => {
  return allowedOwners.includes(owner);
};

export const isValidRepo = (owner: string, repo: string) => {
  return (
    allowedRepos.find(([allowedOwner, allowedRepos]) => {
      if (allowedOwner === owner) {
        return allowedRepos.includes(repo);
      }
      return false;
    }) !== undefined
  );
};
