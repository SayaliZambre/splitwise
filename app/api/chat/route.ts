import { NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://backend:8000"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to process chat query" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error processing chat query:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
