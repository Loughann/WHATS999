import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Log do evento customizado
    console.log("🔥 Custom Event Received:", {
      event: body.event,
      data: body.data,
      timestamp: body.timestamp,
      url: body.url,
      utm_params: body.utm_params,
      ip: request.ip,
      userAgent: request.headers.get("user-agent"),
    })

    // Aqui você pode integrar com outros serviços
    // Exemplo: Google Analytics 4, Mixpanel, Amplitude, etc.

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Erro ao processar evento customizado:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
