import { createConnection } from 'mysql2/promise';

export default async function createE2eDatabase(): Promise<void> {
  const connection = await createConnection({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? 'root',
  });
  try {
    await connection.query('CREATE DATABASE IF NOT EXISTS online_market_test');
  } finally {
    await connection.end();
  }
}
