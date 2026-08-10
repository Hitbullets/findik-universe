import { Universe } from "@/components/universe";
import { validateCatalog } from "@/lib/content/catalog";
import { connection } from "next/server";

if (process.env.NODE_ENV !== "production" && !validateCatalog()) console.error("Fındık content catalog validation failed.");

export default async function Home() {
  await connection();
  return <Universe />;
}
