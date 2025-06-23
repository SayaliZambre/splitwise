"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Users, UserPlus, Sparkles } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"

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

interface GroupManagerProps {
  users: User[]
  groups: Group[]
  onGroupCreated: () => void
  onGroupSelected: (groupId: number) => void
}

export default function GroupManager({ users, groups, onGroupCreated, onGroupSelected }: GroupManagerProps) {
  const [groupName, setGroupName] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [newUserName, setNewUserName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [isCreatingUser, setIsCreatingUser] = useState(false)

  const handleUserToggle = (userId: number) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return

    setIsCreatingGroup(true)
    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: groupName,
          user_ids: selectedUsers,
        }),
      })

      if (response.ok) {
        setGroupName("")
        setSelectedUsers([])
        onGroupCreated()
      }
    } catch (error) {
      console.error("Error creating group:", error)
    } finally {
      setIsCreatingGroup(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) return

    setIsCreatingUser(true)
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
        }),
      })

      if (response.ok) {
        setNewUserName("")
        setNewUserEmail("")
        window.location.reload()
      }
    } catch (error) {
      console.error("Error creating user:", error)
    } finally {
      setIsCreatingUser(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="hover:shadow-lg transition-all duration-300 animate-in slide-in-from-left duration-500">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <div className="p-1 bg-primary/20 rounded">
              <Plus className="h-4 w-4 text-primary" />
            </div>
            Create New Group
          </CardTitle>
          <CardDescription>Create a group and add members to start tracking expenses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Weekend Trip, Roommates"
              className="transition-all duration-200 focus:scale-[1.02]"
            />
          </div>

          <div className="space-y-3">
            <Label>Select Members</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto p-2 border rounded-lg bg-muted/20">
              {users.map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50 transition-all duration-200 animate-in slide-in-from-right"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Checkbox
                    id={`user-${user.id}`}
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={() => handleUserToggle(user.id)}
                    className="transition-all duration-200"
                  />
                  <Label htmlFor={`user-${user.id}`} className="text-sm cursor-pointer flex-1">
                    {user.name} ({user.email})
                  </Label>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No users available. Create some users first!
                </p>
              )}
            </div>
          </div>

          <Button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedUsers.length === 0 || isCreatingGroup}
            className="w-full transition-all duration-200 hover:scale-105"
          >
            {isCreatingGroup ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Create Group
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="hover:shadow-lg transition-all duration-300 animate-in slide-in-from-right duration-500">
          <CardHeader className="bg-gradient-to-r from-secondary/5 to-secondary/10 rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <div className="p-1 bg-secondary/20 rounded">
                <UserPlus className="h-4 w-4 text-secondary-foreground" />
              </div>
              Add New User
            </CardTitle>
            <CardDescription>Add a new user to the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="userName">Name</Label>
              <Input
                id="userName"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Enter user name"
                className="transition-all duration-200 focus:scale-[1.02]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userEmail">Email</Label>
              <Input
                id="userEmail"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="Enter user email"
                className="transition-all duration-200 focus:scale-[1.02]"
              />
            </div>
            <Button
              onClick={handleCreateUser}
              disabled={!newUserName.trim() || !newUserEmail.trim() || isCreatingUser}
              className="w-full transition-all duration-200 hover:scale-105"
              variant="secondary"
            >
              {isCreatingUser ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add User
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 animate-in slide-in-from-right duration-500 delay-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Existing Groups
            </CardTitle>
            <CardDescription>Click on a group to view details or add expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {groups.map((group, index) => (
                <Button
                  key={group.id}
                  variant="outline"
                  className="w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-md animate-in slide-in-from-bottom"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => onGroupSelected(group.id)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    {group.name}
                  </div>
                </Button>
              ))}
              {groups.length === 0 && (
                <div className="text-center py-8 animate-in fade-in duration-500">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">No groups created yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Create your first group above!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
