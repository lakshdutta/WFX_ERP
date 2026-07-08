import dotenv from 'dotenv';
import path from 'path';

// Load .env from current and parent directory
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export const config = {
  port: process.env.PORT || 8000,
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  databaseUrl: process.env.DATABASE_URL || '', // PostgreSQL database connection string
  get isSupabase() {
    return !!this.databaseUrl; // True if postgres connection string is provided
  }
};
