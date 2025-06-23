"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, DollarSign, Calculator, MessageCircle, Sparkles, AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { AnimatedCounter } from "@/components/animated-counter"
import { LoadingSpinner } from "@/components/loading-spinner"
import GroupManager from "@/components/group-manager"
import ExpenseManager from "@/components/expense-manager"
import BalanceViewer from "@/components/balance-viewer"
import ChatBot from "@/components/chat-bot"

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

export default function SplitwiseClone() {
  const [users, setUsers] = useState<User[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "disconnected">("checking")
  const [isLoading, setIsLoading] = useState(true)
  const [backendUrl, setBackendUrl] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true)
      await checkConnection()
      await Promise.all([fetchUsers(), fetchGroups()])
      setIsLoading(false)
    }

    initializeApp()
  }, [retryCount])

  const checkConnection = async () => {
    try {
      const response = await fetch("/api/health")
      const data = await response.json()
      setConnectionStatus(data.backend === "connected" ? "connected" : "disconnected")
      setBackendUrl(data.backend_url)
      console.log("Health check result:", data)
    } catch (error) {
      console.error("Health check failed:", error)
      setConnectionStatus("disconnected")
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")

      // Check if this is a fallback response
      const isFallback = response.headers.get("X-Fallback") === "true"

      if (!response.ok && !isFallback) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setUsers(data)

      if (isFallback) {
        console.warn("Using fallback data for users")
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      setUsers([])
    }
  }

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/groups")

      // Check if this is a fallback response
      const isFallback = response.headers.get("X-Fallback") === "true"

      if (!response.ok && !isFallback) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setGroups(data)

      if (isFallback) {
        console.warn("Using fallback data for groups")
      }
    } catch (error) {
      console.error("Error fetching groups:", error)
      setGroups([])
    }
  }

  const handleGroupCreated = () => {
    fetchGroups()
  }

  const handleExpenseAdded = () => {
    // Refresh any necessary data
  }

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center transition-colors duration-500">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" className="mx-auto" />
          <p className="text-muted-foreground animate-pulse">Loading Splitwise Clone...</p>
          <p className="text-sm text-muted-foreground">Connecting to backend services...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 transition-colors duration-500">
      <div className="max-w-6xl mx-auto p-4">
        <header className="mb-8 animate-in slide-in-from-top duration-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg transition-colors duration-300">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Splitwise Clone
                </h1>
                <p className="text-muted-foreground transition-colors duration-300">
                  Track shared expenses and settle up with friends
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </div>
        </header>

        {connectionStatus === "disconnected" && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg animate-in slide-in-from-top duration-300 transition-colors duration-300">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">Backend Connection Error</p>
                <p className="text-sm opacity-90 mb-3">
                  Cannot connect to the backend service. The app is running in offline mode with limited functionality.
                </p>
                <div className="text-xs opacity-75 mb-3">
                  <p>Troubleshooting steps:</p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>
                      Ensure Docker containers are running:{" "}
                      <code className="bg-destructive/20 px-1 rounded">docker-compose up</code>
                    </li>
                    <li>
                      Check if backend is accessible at:{" "}
                      <code className="bg-destructive/20 px-1 rounded">http://localhost:8000</code>
                    </li>
                    <li>Verify environment variables are set correctly</li>
                  </ul>
                </div>
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  size="sm"
                  className="border-destructive/30 hover:bg-destructive/10 transition-all duration-200"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Connection
                </Button>
              </div>
            </div>
          </div>
        )}

        {connectionStatus === "connected" && backendUrl && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-300 rounded-lg animate-in slide-in-from-top duration-300 transition-colors duration-300">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-sm font-medium">Connected to backend: {backendUrl}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 animate-in slide-in-from-left duration-500 delay-100 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <AnimatedCounter value={users.length} />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 animate-in slide-in-from-left duration-500 delay-200 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <AnimatedCounter value={groups.length} />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 animate-in slide-in-from-left duration-500 delay-300 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Expenses</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 animate-in slide-in-from-left duration-500 delay-400 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Assistant</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    connectionStatus === "connected" ? "bg-green-500 animate-pulse" : "bg-yellow-500"
                  }`}
                ></div>
                {connectionStatus === "connected" ? "Available" : "Limited"}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="groups" className="space-y-6 animate-in slide-in-from-bottom duration-500">
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 backdrop-blur-sm transition-colors duration-300">
            <TabsTrigger
              value="groups"
              className="transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Groups
            </TabsTrigger>
            <TabsTrigger
              value="expenses"
              className="transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Expenses
            </TabsTrigger>
            <TabsTrigger
              value="balances"
              className="transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Balances
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              AI Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="groups" className="animate-in fade-in duration-300">
            <GroupManager
              users={users}
              groups={groups}
              onGroupCreated={handleGroupCreated}
              onGroupSelected={setSelectedGroup}
            />
          </TabsContent>

          <TabsContent value="expenses" className="animate-in fade-in duration-300">
            <ExpenseManager
              users={users}
              groups={groups}
              selectedGroup={selectedGroup}
              onExpenseAdded={handleExpenseAdded}
            />
          </TabsContent>

          <TabsContent value="balances" className="animate-in fade-in duration-300">
            <BalanceViewer users={users} groups={groups} />
          </TabsContent>

          <TabsContent value="chat" className="animate-in fade-in duration-300">
            <ChatBot users={users} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
