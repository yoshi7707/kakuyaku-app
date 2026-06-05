// src/app/page.tsx
// Server Component — fetches contacts from DB at request time

import { prisma } from "./lib/prisma";
import ContactTable from "./components/ContactTable";

export const dynamic = "force-dynamic"; // always fetch fresh data

export default async function Home() {
  const contacts = await prisma.contact.findMany({
    orderBy: [{ area: "asc" }, { name: "asc" }],
  });

  return <ContactTable initialContacts={contacts} />;
}