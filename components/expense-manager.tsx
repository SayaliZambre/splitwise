"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Receipt, DollarSign, Calendar, TrendingUp } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { AnimatedCounter } from "@/components/animated-counter"
import { Users } from "lucide-react"

interface User {
  id: number
  name: string
  email: string
}

interface Group {
  id: number
  name: string
  created_at: string
}

interface GroupDetail {
  id: number
  name: string
  created_at: string
  members: User[]
  total_expenses: number
}

interface ExpenseManagerProps {
  users: User[]
  groups: Group[]
  selectedGroup: number | null
  onExpenseAdded: () => void
}

export default function ExpenseManager({ users, groups, selectedGroup, onExpenseAdded }: ExpenseManagerProps) {
  const [groupDetail, setGroupDetail] = useState<GroupDetail | null>(null)
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [paidBy, setPaidBy] = useState("")
  const [splitType, setSplitType] = useState<"equal" | "percentage">("equal")
  const [percentages, setPercentages] = useState<Record<number, number>>({})
  const [isCreatingExpense, setIsCreatingExpense] = useState(false)
  const [currentGroupId, setCurrentGroupId] = useState<number | null>(selectedGroup)

  useEffect(() => {
    if (currentGroupId) {
      fetchGroupDetail(currentGroupId)
    }
  }, [currentGroupId])

  useEffect(() => {
    if (selectedGroup) {
      setCurrentGroupId(selectedGroup)
    }
  }, [selectedGroup])

  const fetchGroupDetail = async (groupId: number) => {
    try {
      const response = await fetch(`/api/groups/${groupId}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setGroupDetail(data)

      if (data.members) {
        const equalPercentage = 100 / data.members.length
        const initialPercentages: Record<number, number> = {}
        data.members.forEach((member: User) => {
          initialPercentages[member.id] = equalPercentage
        })
        setPercentages(initialPercentages)
      }
    } catch (error) {
      console.error("Error fetching group detail:", error)
    }
  }

  const handlePercentageChange = (userId: number, value: string) => {
    const numValue = Number.parseFloat(value) || 0
    setPercentages((prev) => ({
      ...prev,
      [userId]: numValue,
    }))
  }

  const getTotalPercentage = () => {
    return Object.values(percentages).reduce((sum, val) => sum + val, 0)
  }

  const handleCreateExpense = async () => {
    if (!currentGroupId || !description.trim() || !amount || !paidBy) return

    if (splitType === "percentage" && Math.abs(getTotalPercentage() - 100) > 0.01) {
      alert("Percentages must add up to 100%")
      return
    }

    setIsCreatingExpense(true)
    try {
      const splits =
        groupDetail?.members.map((member) => ({
          user_id: member.id,
          percentage: splitType === "percentage" ? percentages[member.id] : undefined,
        })) || []

      const response = await fetch(`/api/groups/${currentGroupId}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description,
          amount: Number.parseFloat(amount),
          paid_by: Number.parseInt(paidBy),
          split_type: splitType,
          splits,
        }),
      })

      if (response.ok) {
        setDescription("")
        setAmount("")
        setPaidBy("")
        onExpenseAdded()
        fetchGroupDetail(currentGroupId)
      }
    } catch (error) {
      console.error("Error creating expense:", error)
    } finally {
      setIsCreatingExpense(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="hover:shadow-lg transition-all duration-300 animate-in slide-in-from-left duration-500">
        <CardHeader className="bg-gradient-to-r from-green-500/5 to-emerald-500/10 rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <div className="p-1 bg-green-500/20 rounded">
              <Receipt className="h-4 w-4 text-green-600" />
            </div>
            Add New Expense
          </CardTitle>
          <CardDescription>Add an expense to a group and split it among members</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="groupSelect">Select Group</Label>
            <Select
              value={currentGroupId?.toString() || ""}
              onValueChange={(value) => setCurrentGroupId(Number.parseInt(value))}
            >
              <SelectTrigger className="transition-all duration-200 focus:scale-[1.02]">
                <SelectValue placeholder="Choose a group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id.toString()}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {groupDetail && (
            <div className="space-y-4 animate-in slide-in-from-bottom duration-300">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Dinner at restaurant"
                  className="transition-all duration-200 focus:scale-[1.02]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="transition-all duration-200 focus:scale-[1.02]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paidBy">Paid By</Label>
                <Select value={paidBy} onValueChange={setPaidBy}>
                  <SelectTrigger className="transition-all duration-200 focus:scale-[1.02]">
                    <SelectValue placeholder="Who paid?" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupDetail.members.map((member) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Split Type</Label>
                <RadioGroup value={splitType} onValueChange={(value: "equal" | "percentage") => setSplitType(value)}>
                  <div className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50 transition-all duration-200">
                    <RadioGroupItem value="equal" id="equal" />
                    <Label htmlFor="equal" className="cursor-pointer">
                      Equal Split
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50 transition-all duration-200">
                    <RadioGroupItem value="percentage" id="percentage" />
                    <Label htmlFor="percentage" className="cursor-pointer">
                      Percentage Split
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {splitType === "percentage" && (
                <div className="space-y-3 animate-in slide-in-from-bottom duration-300">
                  <Label>Percentage Split</Label>
                  <div className="space-y-2 p-3 border rounded-lg bg-muted/20">
                    {groupDetail.members.map((member, index) => (
                      <div
                        key={member.id}
                        className="flex items-center space-x-2 animate-in slide-in-from-right"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <Label className="w-24 text-sm">{member.name}</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={percentages[member.id] || 0}
                          onChange={(e) => handlePercentageChange(member.id, e.target.value)}
                          className="w-20 transition-all duration-200 focus:scale-105"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    ))}
                    <div
                      className={`text-sm font-medium transition-all duration-200 ${
                        Math.abs(getTotalPercentage() - 100) < 0.01 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      Total: {getTotalPercentage().toFixed(2)}%
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleCreateExpense}
                disabled={!description.trim() || !amount || !paidBy || isCreatingExpense}
                className="w-full transition-all duration-200 hover:scale-105"
              >
                {isCreatingExpense ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Adding Expense...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Add Expense
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-all duration-300 animate-in slide-in-from-right duration-500">
        <CardHeader className="bg-gradient-to-r from-blue-500/5 to-cyan-500/10 rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <div className="p-1 bg-blue-500/20 rounded">
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
            Group Summary
          </CardTitle>
          <CardDescription>Overview of the selected group</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {groupDetail ? (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="text-center p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg">
                <h3 className="font-semibold text-lg mb-1">{groupDetail.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Created on {new Date(groupDetail.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Members ({groupDetail.members.length})
                </h4>
                <div className="grid gap-2">
                  {groupDetail.members.map((member, index) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-200 animate-in slide-in-from-left"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">{member.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center p-4 bg-gradient-to-r from-green-500/5 to-emerald-500/10 rounded-lg">
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Total Expenses</h4>
                <p className="text-3xl font-bold text-green-600">
                  $<AnimatedCounter value={groupDetail.total_expenses} />
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 animate-in fade-in duration-500">
              <Receipt className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Select a group to view details</p>
              <p className="text-sm text-muted-foreground mt-1">Choose a group from the dropdown above</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
