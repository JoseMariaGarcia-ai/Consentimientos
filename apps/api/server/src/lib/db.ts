import { Pool } from 'pg'

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
})

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const { rows } = await pool.query(sql, params)
  return rows
}

export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const { rows } = await pool.query(sql, params)
  return rows[0] ?? null
}
