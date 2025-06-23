import express from "express"
import cors from "cors"
import helmet from "helmet"
import compression from "compression"
import dotenv from "dotenv"
import { createTables } from "./database/migrate"
import { userRoutes } from "./routes/users"
import { groupRoutes } from "./routes/groups"
import { expenseRoutes } from "./routes/expenses"
import { balanceRoutes } from "./routes/balances"
import { chatRoutes } from "./routes/chat"
import { errorHandler } from "./middleware/errorHandler"
import { logger } from "./middleware/logger"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8000

// Middleware
app.use(helmet())
app.use(compression())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))
app.use(logger)

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  })
})

// Routes
app.use("/users", userRoutes)
app.use("/groups", groupRoutes)
app.use("/expenses", expenseRoutes)
app.use("/balances", balanceRoutes)
app.use("/chat", chatRoutes)

// Error handling
app.use(errorHandler)

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" })
})

// Initialize database and start server
async function startServer() {
  try {
    console.log("🔄 Initializing database...")
    await createTables()
    console.log("✅ Database initialized successfully")

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`📊 Health check: http://localhost:${PORT}/health`)
      console.log(`📚 Environment: ${process.env.NODE_ENV || "development"}`)
    })
  } catch (error) {
    console.error("❌ Failed to start server:", error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully")
  process.exit(0)
})

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully")
  process.exit(0)
})

startServer()
