import { Universe } from "@/components/universe";
import { validateCatalog } from "@/lib/content/catalog";

if (process.env.NODE_ENV !== "production" && !validateCatalog()) console.error("Fındık content catalog validation failed.");

export default function Home() { return <Universe />; }
