import { createContext, useContext, useState } from "react";

const RepositoryContext = createContext<string>("");
const SetRepositoryContext = createContext<
  React.Dispatch<React.SetStateAction<string>>
>(() => {});

export const useRepository = () => {
  return useContext(RepositoryContext);
};
export const useSetRepository = () => {
  return useContext(SetRepositoryContext);
};

export const RepositoryContextProvider = ({
  children,
  repository,
}: {
  children: React.ReactNode;
  repository?: string;
}) => {
  const [_repository, setRepository] = useState<string>(repository ?? "");

  return (
    <RepositoryContext.Provider value={_repository}>
      <SetRepositoryContext.Provider value={setRepository}>
        {children}
      </SetRepositoryContext.Provider>
    </RepositoryContext.Provider>
  );
};
