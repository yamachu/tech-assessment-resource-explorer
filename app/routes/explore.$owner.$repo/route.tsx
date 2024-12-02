import { useOutlet, useParams } from "@remix-run/react";
import { useEffect } from "react";
import { useSetRepository } from "~/components/Context/RepositoryContext";

export default function Index() {
  const params = useParams();
  const outlet = useOutlet();
  const setRepository = useSetRepository();

  useEffect(() => {
    setRepository(params["repo"]!);
  }, [setRepository, params]);

  if (outlet) {
    return outlet;
  }

  return (
    <main>
      <h3>Select Owner, Repository and File by sidebar</h3>
    </main>
  );
}
