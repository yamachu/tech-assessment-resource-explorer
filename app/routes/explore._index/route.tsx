import { useOutlet } from "@remix-run/react";

export default function Index() {
  const outlet = useOutlet();

  if (outlet) {
    return outlet;
  }

  return (
    <main>
      <h3>Select Owner, Repository and File by sidebar</h3>
    </main>
  );
}
