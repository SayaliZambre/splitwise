import { Router } from "express"
import { pool } from "../database/connection"
import type { Balance, UserBalance } from "../types"

const router = Router()

// Get group balances
router.get("/groups/:groupId", async (req, res, next) => {
  try {
    const { groupId } = req.params

    // Get all expenses and splits for the group
    const result = await pool.query(
      `
      SELECT 
        e.paid_by,
        es.user_id,
        es.amount,
        u1.name as payer_name,
        u2.name as user_name
      FROM expenses e
      JOIN expense_splits es ON e.id = es.expense_id
      JOIN users u1 ON e.paid_by = u1.id
      JOIN users u2 ON es.user_id = u2.id
      WHERE e.group_id = $1
    `,
      [groupId],
    )

    // Calculate balances
    const balances: { [key: string]: { [key: string]: number } } = {}

    for (const row of result.rows) {
      const payerId = row.paid_by
      const userId = row.user_id
      const amount = Number.parseFloat(row.amount)

      if (payerId !== userId) {
        if (!balances[userId]) balances[userId] = {}
        if (!balances[userId][payerId]) balances[userId][payerId] = 0
        balances[userId][payerId] += amount
      }
    }

    // Simplify balances (net amounts)
    const simplifiedBalances: Balance[] = []
    const processedPairs = new Set<string>()

    for (const debtorId in balances) {
      for (const creditorId in balances[debtorId]) {
        const pair = [debtorId, creditorId].sort().join("-")
        if (processedPairs.has(pair)) continue

        const debtAmount = balances[debtorId]?.[creditorId] || 0
        const creditAmount = balances[creditorId]?.[debtorId] || 0
        const netAmount = debtAmount - creditAmount

        if (Math.abs(netAmount) > 0.01) {
          // Get user names
          const debtorResult = await pool.query("SELECT name FROM users WHERE id = $1", [
            netAmount > 0 ? debtorId : creditorId,
          ])
          const creditorResult = await pool.query("SELECT name FROM users WHERE id = $1", [
            netAmount > 0 ? creditorId : debtorId,
          ])

          simplifiedBalances.push({
            debtor: debtorResult.rows[0].name,
            creditor: creditorResult.rows[0].name,
            amount: Math.abs(netAmount),
          })
        }

        processedPairs.add(pair)
      }
    }

    res.json(simplifiedBalances)
  } catch (error) {
    next(error)
  }
})

// Get user balances across all groups
router.get("/users/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params

    // Get all groups the user is part of
    const groupsResult = await pool.query(
      `
      SELECT g.id, g.name
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = $1
    `,
      [userId],
    )

    const userBalances: UserBalance[] = []

    for (const group of groupsResult.rows) {
      // Get balances for this group (reuse the logic from group balances)
      const balancesResult = await pool.query(
        `
        SELECT 
          e.paid_by,
          es.user_id,
          es.amount,
          u1.name as payer_name,
          u2.name as user_name
        FROM expenses e
        JOIN expense_splits es ON e.id = es.expense_id
        JOIN users u1 ON e.paid_by = u1.id
        JOIN users u2 ON es.user_id = u2.id
        WHERE e.group_id = $1
      `,
        [group.id],
      )

      // Calculate balances for this group
      const balances: { [key: string]: { [key: string]: number } } = {}

      for (const row of balancesResult.rows) {
        const payerId = row.paid_by
        const rowUserId = row.user_id
        const amount = Number.parseFloat(row.amount)

        if (payerId !== rowUserId) {
          if (!balances[rowUserId]) balances[rowUserId] = {}
          if (!balances[rowUserId][payerId]) balances[rowUserId][payerId] = 0
          balances[rowUserId][payerId] += amount
        }
      }

      // Get user name
      const userResult = await pool.query("SELECT name FROM users WHERE id = $1", [userId])
      const userName = userResult.rows[0]?.name

      // Filter balances involving this user
      const relevantBalances: Balance[] = []
      const processedPairs = new Set<string>()

      for (const debtorId in balances) {
        for (const creditorId in balances[debtorId]) {
          if (debtorId !== userId && creditorId !== userId) continue

          const pair = [debtorId, creditorId].sort().join("-")
          if (processedPairs.has(pair)) continue

          const debtAmount = balances[debtorId]?.[creditorId] || 0
          const creditAmount = balances[creditorId]?.[debtorId] || 0
          const netAmount = debtAmount - creditAmount

          if (Math.abs(netAmount) > 0.01) {
            const debtorResult = await pool.query("SELECT name FROM users WHERE id = $1", [
              netAmount > 0 ? debtorId : creditorId,
            ])
            const creditorResult = await pool.query("SELECT name FROM users WHERE id = $1", [
              netAmount > 0 ? creditorId : debtorId,
            ])

            relevantBalances.push({
              debtor: debtorResult.rows[0].name,
              creditor: creditorResult.rows[0].name,
              amount: Math.abs(netAmount),
            })
          }

          processedPairs.add(pair)
        }
      }

      if (relevantBalances.length > 0) {
        userBalances.push({
          group_name: group.name,
          group_id: group.id,
          balances: relevantBalances,
        })
      }
    }

    res.json(userBalances)
  } catch (error) {
    next(error)
  }
})

export { router as balanceRoutes }
