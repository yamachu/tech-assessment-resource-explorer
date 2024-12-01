import { createContext, useContext, useState } from "react";

const OwnerContext = createContext<string>("");
const SetOwnerContext = createContext<
  React.Dispatch<React.SetStateAction<string>>
>(() => {});

export const useOwner = () => {
  return useContext(OwnerContext);
};
export const useSetOwner = () => {
  return useContext(SetOwnerContext);
};

export const OwnerContextProvider = ({
  children,
  owner,
}: {
  children: React.ReactNode;
  owner?: string;
}) => {
  const [_owner, setOwner] = useState<string>(owner ?? "");

  return (
    <OwnerContext.Provider value={_owner}>
      <SetOwnerContext.Provider value={setOwner}>
        {children}
      </SetOwnerContext.Provider>
    </OwnerContext.Provider>
  );
};
