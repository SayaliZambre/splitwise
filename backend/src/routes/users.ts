import { Router } from "express"
import { pool } from "../database/connection"
import { UserCreateSchema } from "../types"
import { validateRequest } from "../middleware/validation"

const router = Router()

// Get all users
router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT id, name, email, created_at FROM users ORDER BY created_at DESC")
    res.json(result.rows)
  } catch (error) {
    next(error)
  }
})

// Get user by ID
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params
    const result = await pool.query("SELECT id, name, email, created_at FROM users WHERE id = $1", [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json(result.rows[0])
  } catch (error) {
    next(error)
  }
})

// Create user
router.post("/", validateRequest(UserCreateSchema), async (req, res, next) => {
  try {
    const { name, email } = req.body

    const result = await pool.query(
      "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email, created_at",
      [name, email],
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    if ((error as any).code === "23505") {
      // Unique violation
      return res.status(400).json({ error: "Email already exists" })
    }
    next(error)
  }
})

export { router as userRoutes }
