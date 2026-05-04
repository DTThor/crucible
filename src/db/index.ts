/**
 * Drizzle client for direct Postgres access from server actions / route handlers.
 * For ordinary CRUD bound to the signed-in user, prefer Supabase client + RLS —
 * it's simpler and the policies do the auth for you. Reach for Drizzle when you
 * need transactions, complex joins, or system-level reads.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, {
  prepare: false, // Supabase pgbouncer (transaction mode) requires this
  max: 1,
});

export const db = drizzle(client, { schema });
export { schema };
