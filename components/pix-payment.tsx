"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Copy, ArrowRight, Loader2 } from "lucide-react"
import { trackUtmPurchase } from "@/lib/facebook-pixel"

interface PixPaymentProps {
  formData: {
    name: string
    email: string
    phone: string
  }
  orderValue: number
}

interface PixResponse {
  pixCode: string
  transactionId: string
}

interface PaymentStatus {
  status: "pending" | "completed"
}

// Remove tudo que não for dígito (útil para CPF e telefone)
const sanitizeNumber = (str: string) => (str ? str.replace(/\D/g, "") : "")

// Função para capturar todos os parâmetros da URL
const getUrlParams = () => {
  if (typeof window === "undefined") return ""

  const urlParams = new URLSearchParams(window.location.search)
  const params: string[] = []

  urlParams.forEach((value, key) => {
    params.push(`${key}=${value}`)
  })

  return params.join("&")
}

// Função para redirecionar com parâmetros UTM
const redirectToSuccess = (utmParams: string) => {
  const baseUrl = "https://premiumespiao.netlify.app/?loaded=true"
  const finalUrl = utmParams ? `${baseUrl}&${utmParams}` : baseUrl

  console.log("🔄 Redirecionando para:", finalUrl)

  if (typeof window !== "undefined") {
    window.location.href = finalUrl
  }
}

export function PixPayment({ formData, orderValue }: PixPaymentProps) {
  const [timeLeft, setTimeLeft] = useState(5 * 60) // 5 minutos
  const [copied, setCopied] = useState(false)
  const [pixData, setPixData] = useState<PixResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "completed" | "expired">("pending")
  const [error, setError] = useState<string | null>(null)
  const [utmParams] = useState(getUrlParams())

  const orderId = `PIX${Date.now().toString().slice(-8)}`

  // Gerar PIX ao carregar componente
  useEffect(() => {
    generatePix()
  }, [])

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && paymentStatus === "pending") {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      setPaymentStatus("expired")
    }
  }, [timeLeft, paymentStatus])

  // Verificar status do pagamento a cada 5 segundos
  useEffect(() => {
    if (pixData?.transactionId && paymentStatus === "pending") {
      const interval = setInterval(() => {
        verifyPayment(pixData.transactionId)
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [pixData, paymentStatus])

  const generatePix = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("🔄 Iniciando geração do PIX...")
      console.log("📊 Dados do formulário:", formData)
      console.log("💰 Valor do pedido:", orderValue)
      console.log("🏷️ UTM Params:", utmParams)

      // CPF válido (exemplo). Altere quando capturar CPF real.
      const fallbackCpf = "39053344705"

      const amountInCents = Math.round(orderValue * 100)

      const payload = {
        amount: amountInCents,
        description: "Pix",
        customer: {
          name: formData.name || "Cliente",
          // Usa CPF do formulário (se existir) ou fallback válido
          document: fallbackCpf,
          phone: sanitizeNumber(formData.phone) || "11999999999",
          email: formData.email || "cliente@email.com",
        },
        item: {
          title: "Whats Espião Acesso",
          price: amountInCents, // obrigatoriamente igual a amount
          quantity: 1,
        },
        utm: utmParams || "checkout-espiao",
      }

      console.log("📦 Payload enviado:", payload)
      console.log("✅ CPF usado:", payload.customer.document)

      const response = await fetch(
        "https://api-checkoutinho.up.railway.app/1JqoJpjex_cm1OSwUAC8BFJ5hHJmF11XNu0ap4eQaXDOFtg36ch_Eqv9lqCTtutKm_AfJcE8MoG7qgqnX-U2OQ",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        },
      )

      console.log("📡 Status da resposta:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Erro da API:", errorText)
        throw new Error(`Erro ${response.status}: ${errorText}`)
      }

      const data: PixResponse = await response.json()
      console.log("✅ PIX gerado com sucesso:", data)

      if (!data.pixCode || !data.transactionId) {
        throw new Error("Resposta da API inválida: pixCode ou transactionId ausente")
      }

      setPixData(data)
    } catch (err: any) {
      const errorMessage = err.message || "Erro desconhecido ao gerar PIX"
      console.error("❌ Erro completo:", err)
      if (err instanceof Error) {
        console.error("🛑 Mensagem:", err.message)
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const verifyPayment = async (transactionId: string) => {
    try {
      console.log("🔍 Verificando pagamento:", transactionId)

      const response = await fetch("https://api-checkoutinho.up.railway.app/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          paymentId: transactionId,
        }),
      })

      if (!response.ok) {
        console.error("❌ Erro ao verificar pagamento:", response.status)
        return
      }

      const data: PaymentStatus = await response.json()
      console.log("📊 Status do pagamento:", data)

      if (data.status === "completed") {
        console.log("✅ Pagamento confirmado!")
        handlePaymentSuccess()
      } else {
        console.log("⏳ Pagamento ainda pendente...")
      }
    } catch (err) {
      console.error("❌ Erro ao verificar pagamento:", err)
    }
  }

  // Função para simular pagamento aprovado (TESTE)
  const simulatePaymentSuccess = () => {
    console.log("🧪 TESTE: Simulando pagamento aprovado...")
    console.log("📊 UTM Params capturados:", utmParams)
    handlePaymentSuccess()
  }

  // Função centralizada para lidar com pagamento aprovado
  const handlePaymentSuccess = () => {
    setPaymentStatus("completed")

    // Disparar evento de Purchase via UTM
    trackUtmPurchase(orderValue, utmParams)

    // Redirecionar para página de sucesso com parâmetros UTM após 2 segundos
    setTimeout(() => {
      redirectToSuccess(utmParams)
    }, 2000)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const copyToClipboard = () => {
    if (pixData?.pixCode) {
      navigator.clipboard.writeText(pixData.pixCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const progressPercentage = ((5 * 60 - timeLeft) / (5 * 60)) * 100

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Gerando PIX...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4 flex items-center justify-center">
        <Card className="bg-white max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">❌</span>
            </div>
            <h2 className="text-xl font-bold text-red-600 mb-2">Erro ao Gerar PIX</h2>
            <p className="text-gray-600 mb-4 text-sm">{error}</p>

            <div className="space-y-3">
              <Button onClick={generatePix} className="w-full">
                Tentar Novamente
              </Button>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded text-left text-xs">
              <p className="font-medium mb-1">🔍 Debug Info:</p>
              <p>Valor: R$ {orderValue.toFixed(2)}</p>
              <p>Valor em centavos: {Math.round(orderValue * 100)}</p>
              <p>UTM: {utmParams || "Nenhum"}</p>
              <p>Nome: {formData.name}</p>
              <p>Email: {formData.email}</p>
              <p>Telefone: {formData.phone}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (paymentStatus === "completed") {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4 flex items-center justify-center">
        <Card className="bg-white max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">✓</span>
            </div>
            <h2 className="text-xl font-bold text-green-600 mb-2">Pagamento Confirmado!</h2>
            <p className="text-gray-600 mb-4">
              Seu pagamento foi processado com sucesso. Redirecionando para o acesso...
            </p>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm text-gray-500">Redirecionando em instantes...</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Pedido: <span className="font-medium">{orderId}</span>
            </p>

            {utmParams && (
              <div className="bg-blue-50 p-3 rounded text-left text-xs">
                <p className="font-medium text-blue-800 mb-1">🔗 URL de destino:</p>
                <p className="text-blue-600 break-all">https://premiumespiao.netlify.app/?loaded=true&{utmParams}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (paymentStatus === "expired") {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4 flex items-center justify-center">
        <Card className="bg-white max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">⚠</span>
            </div>
            <h2 className="text-xl font-bold text-red-600 mb-2">PIX Expirado</h2>
            <p className="text-gray-600 mb-4">
              O tempo para pagamento expirou. Clique no botão abaixo para gerar um novo PIX.
            </p>
            <Button
              onClick={() => {
                setTimeLeft(5 * 60)
                setPaymentStatus("pending")
                generatePix()
              }}
            >
              Gerar Novo PIX
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-md mx-auto">
        <Card className="bg-white">
          <CardContent className="p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <p className="text-gray-600 text-sm mb-1">
                Pedido: <span className="font-medium">{orderId}</span>
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-gray-600 text-sm">Valor:</span>
                <span className="font-bold text-lg text-[rgba(50,188,173,1)]">
                  R$ {orderValue.toFixed(2).replace(".", ",")}
                </span>
                <img src="/images/pix_flag.webp" alt="PIX" className="w-12 h-8 object-contain" />
              </div>
            </div>

            {/* Main Instructions */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-center mb-4">Realize o pagamento do PIX</h2>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex gap-2">
                  <span className="font-bold">1.</span>
                  <span>
                    <span className="font-bold">Copie</span> o código abaixo
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold">2.</span>
                  <span>
                    Abra o <span className="font-bold">app do seu banco</span>
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold">3.</span>
                  <span>
                    Cole o código na opção <span className="font-bold">PIX Copia e Cola</span>.
                  </span>
                </div>
              </div>

              {/* PIX Code */}
              {pixData && (
                <div className="bg-gray-100 p-3 rounded border mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 text-xs font-mono break-all text-gray-700">{pixData.pixCode}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      className="flex-shrink-0 bg-transparent"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      {copied ? "Copiado!" : "Copiar"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button className="w-full bg-green-500 hover:bg-green-600 text-white" disabled={!pixData}>
                  Confirmar Compra <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* Timer Warning */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">!</span>
                </div>
                <span className="text-red-500 text-sm font-medium">
                  Faltam {formatTime(timeLeft)} minutos para o pix expirar...
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>

              <p className="text-gray-600 text-xs">
                A compra será confirmada automaticamente após o pagamento e você será redirecionado para o acesso.
              </p>
            </div>

            {/* Debug Info */}
            {pixData && (
              <div className="mt-4 p-2 bg-gray-50 rounded text-xs text-gray-500">
                <p>Transaction ID: {pixData.transactionId}</p>
              </div>
            )}

            {/* Help Section */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold text-gray-800 mb-3 text-center">
                Está com dúvidas de como realizar o pagamento?
              </h3>

              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex gap-2">
                  <span className="font-bold text-blue-600 min-w-[20px]">1.</span>
                  <span>Abra o aplicativo do seu banco;</span>
                </div>

                <div className="flex gap-2">
                  <span className="font-bold text-blue-600 min-w-[20px]">2.</span>
                  <div>
                    <span>Selecione a opção </span>
                    <span className="font-bold">PIX copia e cola</span>
                    <span>, e cole o código. Ou você pode escanear o QR Code utilizando a opção de </span>
                    <span className="font-bold">Pagar com Pix / Escanear QR code</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="font-bold text-blue-600 min-w-[20px]">3.</span>
                  <span>
                    Após o pagamento, você receberá por email os dados de acesso à sua compra. Lembre-se de verificar a
                    caixa de
                    <span className="font-bold"> SPAM</span>.
                  </span>
                </div>
              </div>
            </div>

            {/* Security Badge */}
            <div className="mt-6 flex justify-center items-center gap-2 text-green-600">
              <span className="text-sm font-medium">Site 100% seguro</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
