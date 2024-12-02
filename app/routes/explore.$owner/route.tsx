import { useOutlet, useParams } from "@remix-run/react";
import { useEffect } from "react";
import { useSetOwner } from "~/components/Context/OwnerContext";

export default function Index() {
  const params = useParams();
  const outlet = useOutlet();
  const setOwner = useSetOwner();

  useEffect(() => {
    setOwner(params["owner"]!);
  }, [setOwner, params]);

  if (outlet) {
    return outlet;
  }

  return (
    <main>
      <h3>Select Owner, Repository and File by sidebar</h3>
    </main>
  );
}
