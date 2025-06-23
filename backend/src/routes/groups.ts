import { Router } from "express"
import { pool } from "../database/connection"
import { GroupCreateSchema } from "../types"
import { validateRequest } from "../middleware/validation"

const router = Router()

// Get all groups
router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT id, name, created_at FROM groups ORDER BY created_at DESC")
    res.json(result.rows)
  } catch (error) {
    next(error)
  }
})

// Get group by ID with details
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params

    // Get group info
    const groupResult = await pool.query("SELECT id, name, created_at FROM groups WHERE id = $1", [id])

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: "Group not found" })
    }

    const group = groupResult.rows[0]

    // Get group members
    const membersResult = await pool.query(
      `
      SELECT u.id, u.name, u.email, u.created_at
      FROM users u
      JOIN group_members gm ON u.id = gm.user_id
      WHERE gm.group_id = $1
      ORDER BY u.name
    `,
      [id],
    )

    // Get total expenses
    const expensesResult = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE group_id = $1",
      [id],
    )

    const groupDetail = {
      ...group,
      members: membersResult.rows,
      total_expenses: Number.parseFloat(expensesResult.rows[0].total),
    }

    res.json(groupDetail)
  } catch (error) {
    next(error)
  }
})

// Create group
router.post("/", validateRequest(GroupCreateSchema), async (req, res, next) => {
  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const { name, user_ids } = req.body

    // Create group
    const groupResult = await client.query("INSERT INTO groups (name) VALUES ($1) RETURNING id, name, created_at", [
      name,
    ])

    const group = groupResult.rows[0]

    // Add members to group
    for (const userId of user_ids) {
      await client.query("INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)", [group.id, userId])
    }

    await client.query("COMMIT")
    res.status(201).json(group)
  } catch (error) {
    await client.query("ROLLBACK")
    next(error)
  } finally {
    client.release()
  }
})

export { router as groupRoutes }
