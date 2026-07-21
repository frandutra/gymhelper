import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Punto único de acceso a datos (CLAUDE.md: nunca queries sueltas en componentes).
 */
const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });

export { schema };
