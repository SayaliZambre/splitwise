import { Pool } from "pg"
import dotenv from "dotenv"

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/splitwise",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Test connection
pool.on("connect", () => {
  console.log("🔗 Connected to PostgreSQL database")
})

pool.on("error", (err) => {
  console.error("❌ PostgreSQL connection error:", err)
})

export { pool }
