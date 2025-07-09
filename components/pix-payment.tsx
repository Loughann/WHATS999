"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Copy, ArrowRight, Loader2, ArrowLeft } from "lucide-react"
import { trackUtmPurchase, trackPurchase, trackCustomEvent } from "@/lib/facebook-pixel"

interface PixPaymentProps {
  formData: {
    name: string
    email: string
    phone: string
  }
  orderValue: number
  onBackToCheckout?: () => void // Nova prop para voltar ao checkout
}

interface PixResponse {
  pixCode: string
  transactionId: string
}

interface PaymentStatus {
  status: "pending" | "completed"
}

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

// Função para gerar CPF válido (apenas para exemplo - em produção use CPF real do cliente)
const generateValidCPF = () => {
  return "11144477735" // CPF válido para testes
}

export function PixPayment({ formData, orderValue, onBackToCheckout }: PixPaymentProps) {
  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutos
  const [copied, setCopied] = useState(false)
  const [pixData, setPixData] = useState<PixResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "completed" | "expired">("pending")
  const [error, setError] = useState<string | null>(null)
  const [utmParams] = useState(getUrlParams()) // Captura os parâmetros uma vez
  const [retryCount, setRetryCount] = useState(0)

  const orderId = `PIX${Date.now().toString().slice(-8)}`

  // Track quando PIX é gerado
  useEffect(() => {
    trackCustomEvent("PIX_Generated", {
      order_id: orderId,
      value: orderValue,
      customer_name: formData.name,
      customer_email: formData.email,
    })
  }, [])

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
      trackCustomEvent("PIX_Expired", {
        order_id: orderId,
        value: orderValue,
      })
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

      const payload = {
        amount: Math.round(orderValue * 100), // Converter para centavos
        description: "Pix",
        customer: {
          name: formData.name,
          document: generateValidCPF(), // CPF válido
          phone: formData.phone,
          email: formData.email,
        },
        item: {
          title: "Whats Espião Acesso",
          price: Math.round(orderValue * 100),
          quantity: 1,
        },
        utm: utmParams || "checkout-espiao",
      }

      console.log("📊 Gerando PIX com payload:", payload)

      const response = await fetch(
        "https://api-checkoutinho.up.railway.app/1C36QB3oc7mI08Ja0q6HQt61qk1LYou-cor-7zNGVWfG_w8AQnI_Y4dN2AWYDWXRNRTvdYiIBeMC9sHzb2q5hQ",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Erro na resposta da API:", errorText)
        throw new Error(`Erro ao gerar PIX: ${response.status}`)
      }

      const data: PixResponse = await response.json()
      console.log("✅ PIX gerado com sucesso:", data)
      setPixData(data)
      setRetryCount(0) // Reset retry count on success

      // Track PIX code gerado
      trackCustomEvent("PIX_Code_Generated", {
        transaction_id: data.transactionId,
        order_id: orderId,
        value: orderValue,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido"
      setError("Erro ao gerar PIX. Verifique os dados e tente novamente.")
      console.error("❌ Erro ao gerar PIX:", err)

      trackCustomEvent("PIX_Generation_Error", {
        error: errorMessage,
        order_id: orderId,
        value: orderValue,
        retry_count: retryCount,
      })

      setRetryCount((prev) => prev + 1)

      // Se falhou 3 vezes ou mais, redirecionar automaticamente para o checkout
      if (retryCount >= 2) {
        console.log("🔄 Muitas tentativas falharam, redirecionando para checkout...")

        trackCustomEvent("PIX_Max_Retries_Reached", {
          error: errorMessage,
          order_id: orderId,
          value: orderValue,
          retry_count: retryCount + 1,
        })

        // Aguardar 3 segundos antes de redirecionar
        setTimeout(() => {
          if (onBackToCheckout) {
            onBackToCheckout()
          } else {
            // Fallback: recarregar a página para voltar ao checkout
            window.location.reload()
          }
        }, 3000)
      }
    } finally {
      setLoading(false)
    }
  }

  const verifyPayment = async (transactionId: string) => {
    try {
      console.log("🔍 Verificando pagamento para transactionId:", transactionId)

      const response = await fetch("https://api-checkoutinho.up.railway.app/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      console.log("📋 Status do pagamento:", data)

      if (data.status === "completed") {
        setPaymentStatus("completed")

        // 🎉 PAGAMENTO APROVADO - Disparar todos os eventos
        console.log("🎉 PAGAMENTO APROVADO!")

        // 1. Facebook Pixel Purchase
        trackPurchase(orderValue, "BRL")

        // 2. UTM Purchase (seu tracking personalizado)
        trackUtmPurchase(orderValue, utmParams)

        // 3. Custom Event
        trackCustomEvent("Payment_Completed", {
          transaction_id: transactionId,
          order_id: orderId,
          value: orderValue,
          customer_name: formData.name,
          customer_email: formData.email,
          utm_params: utmParams,
        })

        // 4. Redirecionar automaticamente
        let redirectUrl = "https://premiumespiao.netlify.app/?loaded=true"
        if (utmParams) {
          redirectUrl += `&${utmParams}`
        }

        console.log("🔄 Redirecionando para:", redirectUrl)

        // Aguardar 2 segundos antes de redirecionar para garantir que eventos foram enviados
        setTimeout(() => {
          window.location.href = redirectUrl
        }, 2000)
      }
    } catch (err) {
      console.error("❌ Erro ao verificar pagamento:", err)
    }
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

      // Track copy event
      trackCustomEvent("PIX_Code_Copied", {
        transaction_id: pixData.transactionId,
        order_id: orderId,
      })
    }
  }

  const handleBackToCheckout = () => {
    trackCustomEvent("User_Back_To_Checkout", {
      order_id: orderId,
      error_occurred: !!error,
      retry_count: retryCount,
    })

    if (onBackToCheckout) {
      onBackToCheckout()
    } else {
      // Fallback: recarregar a página
      window.location.reload()
    }
  }

  const progressPercentage = ((15 * 60 - timeLeft) / (15 * 60)) * 100

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Gerando PIX...</p>
          {retryCount > 0 && <p className="text-sm text-gray-600 mt-2">Tentativa {retryCount + 1} de 3</p>}
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
            <p className="text-gray-600 mb-4">{error}</p>

            {retryCount < 3 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">Tentativa {retryCount} de 3</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleBackToCheckout} className="flex-1 bg-transparent">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar ao Checkout
                  </Button>
                  <Button onClick={generatePix} className="flex-1">
                    Tentar Novamente
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-red-600 font-medium">
                  Muitas tentativas falharam. Redirecionando para o checkout...
                </p>
                <div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full mx-auto"></div>
                <Button variant="outline" onClick={handleBackToCheckout} className="w-full bg-transparent">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Checkout Agora
                </Button>
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
              O tempo para pagamento expirou. Você pode gerar um novo PIX ou voltar ao checkout.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBackToCheckout} className="flex-1 bg-transparent">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Checkout
              </Button>
              <Button
                onClick={() => {
                  setTimeLeft(15 * 60)
                  setPaymentStatus("pending")
                  generatePix()
                }}
                className="flex-1"
              >
                Gerar Novo PIX
              </Button>
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
              <span className="text-white text-2xl">✅</span>
            </div>
            <h2 className="text-xl font-bold text-green-600 mb-2">Pagamento Aprovado!</h2>
            <p className="text-gray-600 mb-4">
              Seu pagamento foi confirmado. Você será redirecionado automaticamente...
            </p>
            <div className="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full mx-auto"></div>
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
            {/* Header com botão de voltar */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToCheckout}
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar
              </Button>
              <div className="text-center">
                <p className="text-gray-600 text-sm">
                  Pedido: <span className="font-medium">{orderId}</span>
                </p>
              </div>
            </div>

            {/* Order Value */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2">
                <span className="text-gray-600 text-sm">Valor:</span>
                <span className="text-blue-600 font-bold text-lg">R$ {orderValue.toFixed(2).replace(".", ",")}</span>
                <div className="w-8 h-6 bg-teal-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">PIX</span>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            {paymentStatus === "pending" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />
                  <span className="text-yellow-800 text-sm font-medium">Aguardando pagamento...</span>
                </div>
              </div>
            )}

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
                <Button
                  variant="outline"
                  className="w-full text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent"
                  disabled={!pixData}
                >
                  Pagar com QR Code
                </Button>

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
                A compra será confirmada automaticamente após o pagamento e você receberá imediatamente sua compra.
              </p>
            </div>

            {/* Help Section */}
            <div>
              <h3 className="font-bold text-gray-800 mb-3">Está com dúvidas de como realizar o pagamento?</h3>

              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex gap-2">
                  <span className="font-bold text-blue-600">1.</span>
                  <span>Abra o aplicativo do seu banco;</span>
                </div>

                <div className="flex gap-2">
                  <span className="font-bold text-blue-600">2.</span>
                  <div>
                    <span>Selecione a opção </span>
                    <span className="font-bold">PIX copia e cola</span>
                    <span>, e cole o código. Ou você pode escanear o QR Code utilizando a opção de </span>
                    <span className="font-bold">Pagar com Pix / Escanear QR code</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="font-bold text-blue-600">3.</span>
                  <span>
                    Após o pagamento, você receberá por email os dados de acesso à sua compra. Lembre-se de verificar a
                    caixa de SPAM.
                  </span>
                </div>
              </div>
            </div>

            {/* Debug Info */}
            <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
              <p>
                <strong>📊 Tracking Status:</strong>
              </p>
              <p>• Transaction ID: {pixData?.transactionId}</p>
              <p>• Status: {paymentStatus}</p>
              <p>• UTM: {utmParams || "Nenhum"}</p>
              <p>• Order ID: {orderId}</p>
              <p>• Retry Count: {retryCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
