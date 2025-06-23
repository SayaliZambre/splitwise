"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Users, ArrowRight, CheckCircle, TrendingDown } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"

interface Group {
  id: number
  name: string
  created_at: string
}

interface Balance {
  debtor: string
  creditor: string
  amount: number
}

interface UserBalance {
  group_name: string
  group_id: number
  balances: Balance[]
}

interface BalanceViewerProps {
  users: any[]
  groups: Group[]
}

export default function BalanceViewer({ users, groups }: BalanceViewerProps) {
  const [selectedGroup, setSelectedGroup] = useState<string>("")
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [groupBalances, setGroupBalances] = useState<Balance[]>([])
  const [userBalances, setUserBalances] = useState<UserBalance[]>([])
  const [loading, setLoading] = useState(false)

  const fetchGroupBalances = async (groupId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/balances`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setGroupBalances(data)
    } catch (error) {
      console.error("Error fetching group balances:", error)
      setGroupBalances([])
    } finally {
      setLoading(false)
    }
  }

  const fetchUserBalances = async (userId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}/balances`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setUserBalances(data)
    } catch (error) {
      console.error("Error fetching user balances:", error)
      setUserBalances([])
    } finally {
      setLoading(false)
    }
  }

  const handleGroupChange = (groupId: string) => {
    setSelectedGroup(groupId)
    setSelectedUser("")
    setUserBalances([])
    if (groupId) {
      fetchGroupBalances(groupId)
    } else {
      setGroupBalances([])
    }
  }

  const handleUserChange = (userId: string) => {
    setSelectedUser(userId)
    setSelectedGroup("")
    setGroupBalances([])
    if (userId) {
      fetchUserBalances(userId)
    } else {
      setUserBalances([])
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="hover:shadow-lg transition-all duration-300 animate-in slide-in-from-left duration-500">
        <CardHeader className="bg-gradient-to-r from-orange-500/5 to-red-500/10 rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <div className="p-1 bg-orange-500/20 rounded">
              <TrendingDown className="h-4 w-4 text-orange-600" />
            </div>
            Group Balances
          </CardTitle>
          <CardDescription>View who owes whom in a specific group</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Select value={selectedGroup} onValueChange={handleGroupChange}>
              <SelectTrigger className="transition-all duration-200 focus:scale-[1.02]">
                <SelectValue placeholder="Select a group" />
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

          {loading && (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="md" className="mr-2" />
              <span className="text-muted-foreground">Loading balances...</span>
            </div>
          )}

          {!loading && selectedGroup && (
            <div className="space-y-3">
              {groupBalances.length > 0 ? (
                groupBalances.map((balance, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all duration-300 hover:scale-[1.02] animate-in slide-in-from-bottom"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300"
                      >
                        {balance.debtor}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300"
                      >
                        {balance.creditor}
                      </Badge>
                    </div>
                    <div className="font-semibold text-red-600 text-lg">${balance.amount.toFixed(2)}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 animate-in fade-in duration-500">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium text-green-600 mb-2">All settled up!</p>
                  <p className="text-muted-foreground">No outstanding balances in this group.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-all duration-300 animate-in slide-in-from-right duration-500">
        <CardHeader className="bg-gradient-to-r from-purple-500/5 to-pink-500/10 rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <div className="p-1 bg-purple-500/20 rounded">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
            Personal Balances
          </CardTitle>
          <CardDescription>View all balances for a specific user across all groups</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Select value={selectedUser} onValueChange={handleUserChange}>
              <SelectTrigger className="transition-all duration-200 focus:scale-[1.02]">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="md" className="mr-2" />
              <span className="text-muted-foreground">Loading balances...</span>
            </div>
          )}

          {!loading && selectedUser && (
            <div className="space-y-4">
              {userBalances.length > 0 ? (
                userBalances.map((groupBalance, groupIndex) => (
                  <div
                    key={groupIndex}
                    className="border rounded-lg p-4 hover:shadow-md transition-all duration-300 animate-in slide-in-from-bottom"
                    style={{ animationDelay: `${groupIndex * 150}ms` }}
                  >
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-primary">
                      <Users className="h-4 w-4" />
                      {groupBalance.group_name}
                    </h4>
                    <div className="space-y-2">
                      {groupBalance.balances.map((balance, balanceIndex) => (
                        <div
                          key={balanceIndex}
                          className="flex items-center justify-between text-sm p-2 rounded bg-muted/30 hover:bg-muted/50 transition-all duration-200"
                        >
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="text-xs bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300"
                            >
                              {balance.debtor}
                            </Badge>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <Badge
                              variant="outline"
                              className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300"
                            >
                              {balance.creditor}
                            </Badge>
                          </div>
                          <div className="font-medium text-red-600">${balance.amount.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 animate-in fade-in duration-500">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium text-green-600 mb-2">All clear!</p>
                  <p className="text-muted-foreground">No outstanding balances for this user.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
