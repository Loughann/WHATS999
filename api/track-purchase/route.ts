import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Aqui você pode processar o evento de purchase via UTM
    // Por exemplo, salvar no banco de dados, enviar para analytics, etc.

    console.log("Purchase Event via UTM:", {
      event: body.event,
      value: body.value,
      currency: body.currency,
      utm_params: body.utm_params,
      timestamp: body.timestamp,
      ip: request.ip,
      userAgent: request.headers.get("user-agent"),
    })

    // Você pode integrar com outros serviços aqui
    // Exemplo: Google Analytics 4, Mixpanel, etc.

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao processar evento UTM:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
