import { createContext, useContext, useState } from "react";

const SelectedPathContext = createContext<string>("");
const SetSelectedPathContext = createContext<
  React.Dispatch<React.SetStateAction<string>>
>(() => {});

export const useSelectedPath = () => {
  return useContext(SelectedPathContext);
};
export const useSetSelectedPath = () => {
  return useContext(SetSelectedPathContext);
};

export const SelectedPathContextProvider = ({
  children,
  selectedPath,
}: {
  children: React.ReactNode;
  selectedPath?: string;
}) => {
  const [_selectedPath, setSelectedPath] = useState<string>(selectedPath ?? "");

  return (
    <SelectedPathContext.Provider value={_selectedPath}>
      <SetSelectedPathContext.Provider value={setSelectedPath}>
        {children}
      </SetSelectedPathContext.Provider>
    </SelectedPathContext.Provider>
  );
};
