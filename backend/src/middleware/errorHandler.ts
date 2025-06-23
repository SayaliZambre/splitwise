import type { Request, Response, NextFunction } from "express"

export function errorHandler(error: any, req: Request, res: Response, next: NextFunction) {
  console.error("❌ Error:", error)

  // Database errors
  if (error.code === "23505") {
    return res.status(400).json({ error: "Duplicate entry" })
  }

  if (error.code === "23503") {
    return res.status(400).json({ error: "Referenced record not found" })
  }

  // Default error
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
  })
}
