import { NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"
const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

async function checkBackendHealth() {
  const urls = [
    `${BACKEND_URL}/users`,
    `${PUBLIC_API_URL}/users`,
    `http://backend:8000/users`,
    `http://localhost:8000/users`,
  ]

  for (const url of urls) {
    try {
      console.log(`Health check attempting: ${url}`)
      const response = await fetch(url, {
        method: "HEAD",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        console.log(`Health check successful: ${url}`)
        return { connected: true, url }
      }
    } catch (error) {
      console.log(`Health check failed for ${url}:`, error)
      continue
    }
  }

  return { connected: false, url: null }
}

export async function GET() {
  try {
    const healthCheck = await checkBackendHealth()

    return NextResponse.json({
      status: "ok",
      backend: healthCheck.connected ? "connected" : "disconnected",
      backend_url: healthCheck.url,
      timestamp: new Date().toISOString(),
      environment: {
        BACKEND_URL: process.env.BACKEND_URL,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        backend: "disconnected",
        error: "Cannot connect to backend",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}
