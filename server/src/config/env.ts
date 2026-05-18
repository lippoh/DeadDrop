
import { z } from 'zod';


const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1),

  // Server
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  // Encryption
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  PBKDF2_ITERATIONS: z.coerce.number().default(100000),
});

// Parse and validate environment variables
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    '❌ Invalid environment variables:',
    parsed.error.flatten().fieldErrors
  );
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
