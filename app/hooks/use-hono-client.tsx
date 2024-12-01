import { hc } from "hono/client";
import { createContext, useContext } from "react";
import type { AppType } from "server";

type ClientType = ReturnType<typeof hc<AppType>>;
const HonoClientContext = createContext<ClientType>(undefined as never);

export const useHonoClient = () => useContext(HonoClientContext);
export const HonoClientProvider = ({
  children,
  client,
}: {
  children: React.ReactNode;
  client: ClientType;
}) => {
  return (
    <HonoClientContext.Provider value={client}>
      {children}
    </HonoClientContext.Provider>
  );
};
