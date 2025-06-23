import { pool } from "../database/connection"

async function seedDatabase() {
  const client = await pool.connect()

  try {
    console.log("🌱 Seeding database...")

    await client.query("BEGIN")

    // Create sample users
    const users = [
      { name: "Alice Johnson", email: "alice@example.com" },
      { name: "Bob Smith", email: "bob@example.com" },
      { name: "Charlie Brown", email: "charlie@example.com" },
      { name: "Diana Prince", email: "diana@example.com" },
    ]

    const userIds: number[] = []
    for (const user of users) {
      const result = await client.query("INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id", [
        user.name,
        user.email,
      ])
      userIds.push(result.rows[0].id)
      console.log(`✅ Created user: ${user.name}`)
    }

    // Create sample groups
    const groups = [
      { name: "Weekend Trip", userIds: userIds.slice(0, 3) },
      { name: "Roommates", userIds: userIds },
      { name: "Office Lunch", userIds: userIds.slice(1, 4) },
    ]

    const groupIds: number[] = []
    for (const group of groups) {
      const result = await client.query("INSERT INTO groups (name) VALUES ($1) RETURNING id", [group.name])
      const groupId = result.rows[0].id
      groupIds.push(groupId)

      // Add members
      for (const userId of group.userIds) {
        await client.query("INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)", [groupId, userId])
      }

      console.log(`✅ Created group: ${group.name}`)
    }

    // Create sample expenses
    const expenses = [
      {
        groupId: groupIds[0],
        description: "Hotel booking",
        amount: 300.0,
        paidBy: userIds[0],
        splitType: "equal",
        splits: userIds.slice(0, 3).map((id) => ({ userId: id })),
      },
      {
        groupId: groupIds[0],
        description: "Dinner at restaurant",
        amount: 120.0,
        paidBy: userIds[1],
        splitType: "percentage",
        splits: [
          { userId: userIds[0], percentage: 40 },
          { userId: userIds[1], percentage: 35 },
          { userId: userIds[2], percentage: 25 },
        ],
      },
      {
        groupId: groupIds[1],
        description: "Grocery shopping",
        amount: 85.5,
        paidBy: userIds[2],
        splitType: "equal",
        splits: userIds.map((id) => ({ userId: id })),
      },
    ]

    for (const expense of expenses) {
      const expenseResult = await client.query(
        `
        INSERT INTO expenses (description, amount, paid_by, group_id, split_type)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
        [expense.description, expense.amount, expense.paidBy, expense.groupId, expense.splitType],
      )

      const expenseId = expenseResult.rows[0].id

      // Create splits
      if (expense.splitType === "equal") {
        const splitAmount = expense.amount / expense.splits.length
        for (const split of expense.splits) {
          await client.query(
            `
            INSERT INTO expense_splits (expense_id, user_id, amount)
            VALUES ($1, $2, $3)
          `,
            [expenseId, split.userId, splitAmount],
          )
        }
      } else {
        for (const split of expense.splits) {
          const splitAmount = expense.amount * ((split as any).percentage / 100)
          await client.query(
            `
            INSERT INTO expense_splits (expense_id, user_id, amount, percentage)
            VALUES ($1, $2, $3, $4)
          `,
            [expenseId, split.userId, splitAmount, (split as any).percentage],
          )
        }
      }

      console.log(`✅ Created expense: ${expense.description}`)
    }

    await client.query("COMMIT")
    console.log("🎉 Database seeded successfully!")
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("❌ Error seeding database:", error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase().catch(console.error)
}
