import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().optional().default(3333),
  JWT_PRIVATE_KEY: z.string(),
  JWT_PUBLIC_KEY: z.string(),
  STORAGE_AUTHORIZATION_TOKEN: z.string(),
  STORAGE_BASE_URL: z.string().url(),
  EXPENSES_BUCKET_ID: z.string(),
  MISCELANEOUS_BUCKET_ID: z.string(),
});

export type Env = z.infer<typeof envSchema>;
