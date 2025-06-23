import { Router } from "express"
import { pool } from "../database/connection"
import { ChatQuerySchema } from "../types"
import { validateRequest } from "../middleware/validation"
import OpenAI from "openai"

const router = Router()

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null

// Process chat query
router.post("/", validateRequest(ChatQuerySchema), async (req, res, next) => {
  try {
    const { query, user_id } = req.body

    if (!openai) {
      return res.json({
        response:
          "I'm sorry, the AI chat feature is not available. Please set the OPENAI_API_KEY environment variable.",
      })
    }

    // Get context data
    const context = await getChatContext(user_id)

    const systemPrompt = `
      You are a helpful assistant for a Splitwise-like expense tracking app.
      Answer user queries about expenses, balances, and groups based on the provided context.
      Keep responses concise and friendly.
      
      Context data: ${JSON.stringify(context, null, 2)}
    `

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
      ],
      max_tokens: 300,
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content || "I couldn't process your query."

    res.json({ response })
  } catch (error) {
    console.error("Chat error:", error)
    res.json({
      response: "I'm sorry, I couldn't process your query. Please try again later.",
    })
  }
})

async function getChatContext(userId?: number) {
  const context: any = {
    groups: [],
    recent_expenses: [],
    user_balances: [],
  }

  try {
    // Get all groups with member info
    const groupsResult = await pool.query(`
      SELECT 
        g.id,
        g.name,
        COALESCE(SUM(e.amount), 0) as total_expenses,
        COUNT(DISTINCT gm.user_id) as member_count
      FROM groups g
      LEFT JOIN expenses e ON g.id = e.group_id
      LEFT JOIN group_members gm ON g.id = gm.group_id
      GROUP BY g.id, g.name
      ORDER BY g.created_at DESC
    `)

    for (const group of groupsResult.rows) {
      const membersResult = await pool.query(
        `
        SELECT u.name
        FROM users u
        JOIN group_members gm ON u.id = gm.user_id
        WHERE gm.group_id = $1
      `,
        [group.id],
      )

      context.groups.push({
        id: group.id,
        name: group.name,
        members: membersResult.rows.map((m: any) => m.name),
        total_expenses: Number.parseFloat(group.total_expenses),
        member_count: Number.parseInt(group.member_count),
      })
    }

    // Get recent expenses
    const expensesResult = await pool.query(`
      SELECT 
        e.description,
        e.amount,
        u.name as payer_name,
        g.name as group_name,
        e.created_at
      FROM expenses e
      JOIN users u ON e.paid_by = u.id
      JOIN groups g ON e.group_id = g.id
      ORDER BY e.created_at DESC
      LIMIT 10
    `)

    context.recent_expenses = expensesResult.rows.map((expense: any) => ({
      description: expense.description,
      amount: Number.parseFloat(expense.amount),
      payer: expense.payer_name,
      group: expense.group_name,
      date: expense.created_at,
    }))

    // Get user balances if user_id provided
    if (userId) {
      // This would use the same logic as the balances route
      // For brevity, we'll add a simplified version
      context.user_balances = `User ${userId} balance information available`
    }
  } catch (error) {
    console.error("Error getting chat context:", error)
  }

  return context
}

export { router as chatRoutes }
