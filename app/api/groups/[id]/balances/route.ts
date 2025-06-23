import { NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://backend:8000"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const response = await fetch(`${BACKEND_URL}/groups/${params.id}/balances`)

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch group balances" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching group balances:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
