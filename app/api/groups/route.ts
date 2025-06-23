import { NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"
const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

async function fetchWithFallback(endpoint: string, options?: RequestInit) {
  const urls = [
    `${BACKEND_URL}${endpoint}`,
    `${PUBLIC_API_URL}${endpoint}`,
    `http://backend:8000${endpoint}`,
    `http://localhost:8000${endpoint}`,
  ]

  for (const url of urls) {
    try {
      console.log(`Attempting to fetch from: ${url}`)
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      })

      if (response.ok) {
        console.log(`Successfully connected to: ${url}`)
        return response
      }
    } catch (error) {
      console.log(`Failed to connect to ${url}:`, error)
      continue
    }
  }

  throw new Error("All backend connection attempts failed")
}

export async function GET() {
  try {
    const response = await fetchWithFallback("/groups")
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching groups:", error)

    // Return empty array as fallback
    return NextResponse.json([], {
      status: 200,
      headers: {
        "X-Fallback": "true",
        "X-Error": "Backend connection failed",
      },
    })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const response = await fetchWithFallback("/groups", {
      method: "POST",
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating group:", error)
    return NextResponse.json({ error: "Failed to create group - backend connection failed" }, { status: 503 })
  }
}
