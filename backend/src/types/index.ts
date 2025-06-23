import { z } from "zod"

// User schemas
export const UserCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
})

export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  created_at: z.string(),
})

// Group schemas
export const GroupCreateSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  user_ids: z.array(z.number()).min(1, "At least one user is required"),
})

export const GroupSchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.string(),
})

// Expense schemas
export const ExpenseSplitCreateSchema = z.object({
  user_id: z.number(),
  percentage: z.number().optional(),
})

export const ExpenseCreateSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be positive"),
  paid_by: z.number(),
  split_type: z.enum(["equal", "percentage"]),
  splits: z.array(ExpenseSplitCreateSchema).min(1, "At least one split is required"),
})

// Chat schema
export const ChatQuerySchema = z.object({
  query: z.string().min(1, "Query is required"),
  user_id: z.number().optional(),
})

// Types
export type UserCreate = z.infer<typeof UserCreateSchema>
export type User = z.infer<typeof UserSchema>
export type GroupCreate = z.infer<typeof GroupCreateSchema>
export type Group = z.infer<typeof GroupSchema>
export type ExpenseCreate = z.infer<typeof ExpenseCreateSchema>
export type ChatQuery = z.infer<typeof ChatQuerySchema>

export interface Balance {
  debtor: string
  creditor: string
  amount: number
}

export interface UserBalance {
  group_name: string
  group_id: number
  balances: Balance[]
}

export interface GroupDetail extends Group {
  members: User[]
  total_expenses: number
}

export interface ExpenseSplit {
  id: number
  user_id: number
  amount: number
  percentage?: number
  user: User
}

export interface Expense {
  id: number
  description: string
  amount: number
  paid_by: number
  group_id: number
  split_type: "equal" | "percentage"
  created_at: string
  payer: User
  splits: ExpenseSplit[]
}
