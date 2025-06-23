import { Router } from "express"
import { pool } from "../database/connection"
import { ExpenseCreateSchema } from "../types"
import { validateRequest } from "../middleware/validation"

const router = Router()

// Create expense for a group
router.post("/groups/:groupId", validateRequest(ExpenseCreateSchema), async (req, res, next) => {
  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const { groupId } = req.params
    const { description, amount, paid_by, split_type, splits } = req.body

    // Validate percentages if split_type is percentage
    if (split_type === "percentage") {
      const totalPercentage = splits.reduce((sum: number, split: any) => sum + (split.percentage || 0), 0)
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return res.status(400).json({ error: "Percentages must add up to 100%" })
      }
    }

    // Create expense
    const expenseResult = await client.query(
      `
      INSERT INTO expenses (description, amount, paid_by, group_id, split_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, description, amount, paid_by, group_id, split_type, created_at
    `,
      [description, amount, paid_by, groupId, split_type],
    )

    const expense = expenseResult.rows[0]

    // Create expense splits
    if (split_type === "equal") {
      const splitAmount = amount / splits.length
      for (const split of splits) {
        await client.query(
          `
          INSERT INTO expense_splits (expense_id, user_id, amount)
          VALUES ($1, $2, $3)
        `,
          [expense.id, split.user_id, splitAmount],
        )
      }
    } else {
      for (const split of splits) {
        const splitAmount = amount * (split.percentage / 100)
        await client.query(
          `
          INSERT INTO expense_splits (expense_id, user_id, amount, percentage)
          VALUES ($1, $2, $3, $4)
        `,
          [expense.id, split.user_id, splitAmount, split.percentage],
        )
      }
    }

    await client.query("COMMIT")

    // Get complete expense with payer and splits
    const completeExpenseResult = await pool.query(
      `
      SELECT 
        e.*,
        u.name as payer_name,
        u.email as payer_email
      FROM expenses e
      JOIN users u ON e.paid_by = u.id
      WHERE e.id = $1
    `,
      [expense.id],
    )

    const splitsResult = await pool.query(
      `
      SELECT 
        es.*,
        u.name as user_name,
        u.email as user_email
      FROM expense_splits es
      JOIN users u ON es.user_id = u.id
      WHERE es.expense_id = $1
    `,
      [expense.id],
    )

    const completeExpense = {
      ...completeExpenseResult.rows[0],
      payer: {
        id: completeExpenseResult.rows[0].paid_by,
        name: completeExpenseResult.rows[0].payer_name,
        email: completeExpenseResult.rows[0].payer_email,
      },
      splits: splitsResult.rows.map((split) => ({
        id: split.id,
        user_id: split.user_id,
        amount: Number.parseFloat(split.amount),
        percentage: split.percentage ? Number.parseFloat(split.percentage) : null,
        user: {
          id: split.user_id,
          name: split.user_name,
          email: split.user_email,
        },
      })),
    }

    res.status(201).json(completeExpense)
  } catch (error) {
    await client.query("ROLLBACK")
    next(error)
  } finally {
    client.release()
  }
})

export { router as expenseRoutes }
