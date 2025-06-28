"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Loader2, ShieldCheck, Lock, Clock, Square, Star, Zap } from "lucide-react"
import QRCode from "react-qr-code"
import { MatrixBackground } from "@/components/matrix-background"

// -------- TIPAGENS --------
interface Customer {
  name: string
  document: string
  phone: string
  email: string
}

interface Item {
  title: string
  price: number
  quantity: number
}

interface GeneratePixPayload {
  amount: number
  description: string
  customer: Customer
  item: Item
  utm: string
}

interface GeneratePixResponse {
  pixCode: string
  transactionId: string
}

interface VerifyPixPayload {
  paymentId: string
}

interface VerifyPixResponse {
  status: "pending" | "completed" | "failed"
}

// -------- COMPONENTE --------
export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pixCode, setPixCode] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "completed" | "failed" | null>(null)
  const [isLoadingPix, setIsLoadingPix] = useState(false)
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const bonusTimerRef = useRef<NodeJS.Timeout | null>(null)
  const entryTimerRef = useRef<NodeJS.Timeout | null>(null)

  const [customerEmail, setCustomerEmail] = useState("")

  const itemTitle = "BLCKX7"
  const itemPrice = 19.9
  const totalAmount = 19.9

  const description = "Pagamento do BLCKX7"

  const [showOrderBumps, setShowOrderBumps] = useState(false)
  const [selectedOrderBumps, setSelectedOrderBumps] = useState({
    investigacao: false,
    localizacao: false,
    relatorio: false,
  })

  const [showInstructions, setShowInstructions] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [showBonusPopup, setShowBonusPopup] = useState(false)
  const [bonusTimeLeft, setBonusTimeLeft] = useState(300)
  const [orderBumpTimeLeft, setOrderBumpTimeLeft] = useState(180)
  const [bonusPopupShown, setBonusPopupShown] = useState(false)
  const [bonusPopupShownAfterCopy, setBonusPopupShownAfterCopy] = useState(false)
  const [pixExpirationTime, setPixExpirationTime] = useState(600)

  // Estados para o pop-up de entrada
  const [showEntryBonus, setShowEntryBonus] = useState(false)
  const [entryBonusTimeLeft, setEntryBonusTimeLeft] = useState(300)
  const [entryBonusAccepted, setEntryBonusAccepted] = useState(false)

  // Estados para o pop-up de alerta após 60 segundos
  const [showTimeAlert, setShowTimeAlert] = useState(false)
  const [timeAlertShown, setTimeAlertShown] = useState(false)
  const timeAlertTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Função para disparar eventos de tracking
  const trackEvent = (eventName: string, eventData?: any) => {
    // Facebook Pixel - APENAS InitiateCheckout
    if (typeof window !== "undefined" && (window as any).fbq) {
      if (eventName === "InitiateCheckout") {
        ;(window as any).fbq("track", "InitiateCheckout")
      }
    }

    // UTMify - Manter todos os eventos
    if (typeof window !== "undefined" && (window as any).pixel) {
      if (eventName === "InitiateCheckout") {
        ;(window as any).pixel("track", "InitiateCheckout")
      } else if (eventName === "AddToCart") {
        ;(window as any).pixel("track", {
          value: eventData?.value || 0,
          currency: "BRL",
        })
      } else if (eventName === "Purchase") {
        ;(window as any).pixel("track", {
          value: eventData?.value || 0,
          currency: "BRL",
          transaction_id: eventData?.transaction_id || "",
        })
      }
    }
  }

  async function handleGeneratePix() {
    if (!customerEmail) {
      alert("Por favor, insira seu e-mail.")
      return
    }

    setOrderBumpTimeLeft(180)
    setShowOrderBumps(true)
  }

  async function processPixGeneration() {
    setShowOrderBumps(false)
    setIsLoadingPix(true)
    setPixCode(null)
    setTransactionId(null)
    setPaymentStatus(null)
    setPixExpirationTime(600)

    let finalAmount = totalAmount
    if (selectedOrderBumps.investigacao) {
      finalAmount += 11.9
    }
    if (selectedOrderBumps.localizacao) {
      finalAmount += 6.9
    }
    if (selectedOrderBumps.relatorio) {
      finalAmount += 7.9
    }

    // Capturar TODOS os parâmetros da URL como string
    const urlParams = new URLSearchParams(window.location.search)
    const allParams: string[] = []

    // Iterar por todos os parâmetros e criar array de strings
    urlParams.forEach((value, key) => {
      allParams.push(`${key}=${value}`)
    })

    // Juntar todos os parâmetros em uma string
    const utmString = allParams.length > 0 ? allParams.join("&") : "checkout-v0"

    const payload: GeneratePixPayload = {
      amount: Math.round(finalAmount * 100),
      description,
      customer: {
        name: "Cliente Tinder",
        document: "000.000.000-00",
        phone: "00000000000",
        email: customerEmail,
      },
      item: {
        title: itemTitle,
        price: Math.round(finalAmount * 100),
        quantity: 1,
      },
      utm: utmString,
    }

    try {
      const res = await fetch(
        "https://api-checkoutinho.up.railway.app/dS7qHk8CkcE98ysGlGebPpX0SQFo36b_T8lU5f5wUeVeKu7THWa43qO-kSh-Q_8EbY8PyveP5oRAqV5Ti34sOg",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      )
      if (!res.ok) throw new Error(res.statusText)

      const data: GeneratePixResponse = await res.json()
      setPixCode(data.pixCode)
      setTransactionId(data.transactionId)
      setPaymentStatus("pending")

      // 🎯 TRACKING: AddToCart quando PIX é gerado
      trackEvent("AddToCart", {
        value: finalAmount,
        currency: "BRL",
        content_name: "WHATS ESPIÃO",
        content_ids: ["whats-espiao"],
        content_type: "product",
      })
    } catch (err) {
      console.error(err)
      alert("Erro ao gerar PIX.")
      setPaymentStatus("failed")
    } finally {
      setIsLoadingPix(false)
    }
  }

  async function handleVerifyPix(paymentId: string) {
    setIsVerifyingPayment(true)
    try {
      const res = await fetch("https://api-checkoutinho.up.railway.app/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId } as VerifyPixPayload),
      })
      if (!res.ok) throw new Error(res.statusText)
      const data: VerifyPixResponse = await res.json()
      setPaymentStatus(data.status)

      // 🎯 TRACKING: Purchase quando pagamento é aprovado
      if (data.status === "completed") {
        const finalAmount =
          totalAmount +
          (selectedOrderBumps.investigacao ? 11.9 : 0) +
          (selectedOrderBumps.localizacao ? 6.9 : 0) +
          (selectedOrderBumps.relatorio ? 7.9 : 0)

        trackEvent("Purchase", {
          value: finalAmount,
          currency: "BRL",
          content_name: "WHATS ESPIÃO",
          content_ids: ["whats-espiao"],
          content_type: "product",
          transaction_id: paymentId,
        })
      }
    } catch (err) {
      console.error(err)
      setPaymentStatus("failed")
    } finally {
      setIsVerifyingPayment(false)
    }
  }

  // Timer principal da barra de escassez
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Mostrar pop-up de entrada após 3 segundos
  useEffect(() => {
    console.log("Configurando timer do pop-up de entrada...")

    entryTimerRef.current = setTimeout(() => {
      console.log("Mostrando pop-up de entrada!")
      setShowEntryBonus(true)
      setEntryBonusTimeLeft(timeLeft) // Sincronizado com a barra
    }, 3000)

    return () => {
      if (entryTimerRef.current) {
        clearTimeout(entryTimerRef.current)
      }
    }
  }, []) // Executar apenas uma vez quando o componente monta

  // Sincronizar tempo do desafio com a barra de escassez
  useEffect(() => {
    if (showEntryBonus) {
      setEntryBonusTimeLeft(timeLeft)
    }
  }, [timeLeft, showEntryBonus])

  // Fechar pop-up quando tempo da barra acabar
  useEffect(() => {
    if (timeLeft <= 0 && showEntryBonus) {
      setShowEntryBonus(false)
    }
  }, [timeLeft, showEntryBonus])

  // Verificação de pagamento e redirecionamento
  useEffect(() => {
    // 🎯 TRACKING: InitiateCheckout quando página carrega
    trackEvent("InitiateCheckout")

    if (transactionId && paymentStatus === "pending") {
      intervalRef.current = setInterval(() => handleVerifyPix(transactionId), 4000)
    }
    if (paymentStatus === "completed") {
      window.location.href = "https://premiumespiao.netlify.app"
      if (intervalRef.current) clearInterval(intervalRef.current)
    } else if (paymentStatus !== "pending" && intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [transactionId, paymentStatus, router])

  const startBonusTimer = () => {
    if (bonusTimerRef.current) {
      clearTimeout(bonusTimerRef.current)
    }

    bonusTimerRef.current = setTimeout(() => {
      if (document.visibilityState === "visible" && !showInstructions && !bonusPopupShown) {
        setBonusTimeLeft(300)
        setShowBonusPopup(true)
        setBonusPopupShown(true)
      }
    }, 12000)
  }

  const stopBonusTimer = () => {
    if (bonusTimerRef.current) {
      clearTimeout(bonusTimerRef.current)
      bonusTimerRef.current = null
    }
  }

  useEffect(() => {
    if (pixCode && paymentStatus === "pending" && !showInstructions && !bonusPopupShown && !bonusPopupShownAfterCopy) {
      if (document.visibilityState === "visible") {
        startBonusTimer()
      }

      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          if (!showInstructions && !showBonusPopup && !bonusPopupShown && !bonusPopupShownAfterCopy) {
            startBonusTimer()
          }
        } else {
          stopBonusTimer()
        }
      }

      document.addEventListener("visibilitychange", handleVisibilityChange)

      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange)
        stopBonusTimer()
      }
    } else {
      stopBonusTimer()
    }
  }, [pixCode, paymentStatus, showInstructions, showBonusPopup, bonusPopupShown, bonusPopupShownAfterCopy])

  useEffect(() => {
    if (showBonusPopup && bonusTimeLeft > 0) {
      const timer = setInterval(() => {
        setBonusTimeLeft((prev) => {
          if (prev <= 1) {
            setShowBonusPopup(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [showBonusPopup, bonusTimeLeft])

  useEffect(() => {
    const timer = setInterval(() => {
      setOrderBumpTimeLeft((prev) => {
        if (prev <= 1) {
          setShowOrderBumps(false)
          processPixGeneration()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [showOrderBumps, processPixGeneration])

  useEffect(() => {
    if (pixCode && pixExpirationTime > 0) {
      const timer = setInterval(() => {
        setPixExpirationTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [pixCode, pixExpirationTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatBonusTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatOrderBumpTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatPixTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatEntryBonusTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getAvailableOffersInvestigacao = () => {
    const totalTime = 180
    const timeElapsed = totalTime - orderBumpTimeLeft

    let offersReduction = 0

    if (timeElapsed <= 30) {
      offersReduction = Math.floor(timeElapsed / 6)
    } else {
      const fastReduction = Math.floor(30 / 6)
      const slowTimeElapsed = timeElapsed - 30
      const slowReduction = Math.floor(slowTimeElapsed / 10)
      offersReduction = fastReduction + slowReduction
    }

    const availableOffers = Math.max(1, 8 - offersReduction)
    return availableOffers
  }

  const getAvailableOffersLocalizacao = () => {
    const totalTime = 180
    const timeElapsed = totalTime - orderBumpTimeLeft

    let offersReduction = 0

    if (timeElapsed <= 50) {
      offersReduction = Math.floor(timeElapsed / 10)
    } else {
      const fastReduction = Math.floor(50 / 10)
      const slowTimeElapsed = timeElapsed - 50
      const slowReduction = Math.floor(slowTimeElapsed / 25)
      offersReduction = fastReduction + slowReduction
    }

    const availableOffers = Math.max(1, 9 - offersReduction)
    return availableOffers
  }

  const getAvailableOffersRelatorio = () => {
    const totalTime = 180
    const timeElapsed = totalTime - orderBumpTimeLeft

    let offersReduction = 0

    if (timeElapsed <= 45) {
      offersReduction = Math.floor(timeElapsed / 9)
    } else {
      const fastReduction = Math.floor(45 / 9)
      const slowTimeElapsed = timeElapsed - 45
      const slowReduction = Math.floor(slowTimeElapsed / 15)
      offersReduction = fastReduction + slowReduction
    }

    const availableOffers = Math.max(1, 7 - offersReduction)
    return availableOffers
  }

  const processPixGenerationRef = useRef(processPixGeneration)

  useEffect(() => {
    processPixGenerationRef.current = processPixGeneration
  }, [processPixGeneration])

  useEffect(() => {
    if (showOrderBumps && orderBumpTimeLeft > 0) {
      const timer = setInterval(() => {
        setOrderBumpTimeLeft((prev) => {
          if (prev <= 1) {
            setShowOrderBumps(false)
            processPixGenerationRef.current()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [showOrderBumps, orderBumpTimeLeft])

  // Timer para mostrar alerta após 60 segundos sem gerar PIX
  useEffect(() => {
    if (!pixCode && !timeAlertShown) {
      timeAlertTimerRef.current = setTimeout(() => {
        if (!pixCode && !timeAlertShown) {
          setShowTimeAlert(true)
          setTimeAlertShown(true)
        }
      }, 60000) // 60 segundos
    }

    return () => {
      if (timeAlertTimerRef.current) {
        clearTimeout(timeAlertTimerRef.current)
      }
    }
  }, [pixCode, timeAlertShown])

  // Limpar timer quando PIX for gerado
  useEffect(() => {
    if (pixCode && timeAlertTimerRef.current) {
      clearTimeout(timeAlertTimerRef.current)
      setTimeAlertShown(true)
    }
  }, [pixCode])

  // Debug: Adicionar logs para verificar o estado
  console.log("Estados do pop-up:", {
    showEntryBonus,
    entryBonusTimeLeft,
    timeLeft,
    entryBonusAccepted,
  })

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10 pt-20">
      {/* BARRA DE ESCASSEZ */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border p-3 text-center">
        <div className="flex flex-col items-center justify-center">
          {timeLeft > 0 ? (
            <>
              <p className="text-base font-semibold text-[#15FF00] text-glow-green flex items-center justify-center animate-pulse">
                <Clock className="h-5 w-5 mr-2" />
                Restam {formatTime(timeLeft)} minutos para o fim do desafio!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Seu bônus está ativado! Realize o pagamento agora antes que seja tarde
              </p>
            </>
          ) : (
            <>
              <p className="text-base font-semibold text-red-500 flex items-center justify-center animate-pulse">
                <Clock className="h-5 w-5 mr-2" />
                GARANTIR AGORA
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Últimas unidades disponíveis! Garante já o seu relatório
              </p>
            </>
          )}
        </div>
      </div>
      <MatrixBackground />

      <Card className="w-full max-w-md shadow-lg rounded-lg bg-card text-card-foreground relative z-10">
        <CardContent className="p-6 space-y-8">
          {/* HEADER */}
          <div className="text-center">
            <h1 className="text-6xl font-extrabold uppercase text-[#15FF00] text-glow-green mb-2">{"WHATS ESPIÃO"}</h1>
            <p className="text-4xl font-extrabold text-pink-500 mb-2">R$ {totalAmount.toFixed(2).replace(".", ",")}</p>
            <p className="text-sm text-muted">Desconto especial até {new Date().toLocaleDateString("pt-BR")}</p>
          </div>

          {/* BENEFÍCIOS */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: ShieldCheck, text: "Pagamento Seguro" },
              { icon: Lock, text: "100% Anônimo" },
              { icon: Clock, text: "Acesso Imediato" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex flex-col items-center p-3 bg-muted/20 rounded-lg border border-border text-center"
              >
                <Icon className="h-6 w-6 text-pink-500 mb-1" />
                <span className="text-xs text-muted-foreground">{text}</span>
              </div>
            ))}
          </div>

          {/* ESTATÍSTICAS */}
          <div className="text-center space-y-4">
            <p className="text-foreground font-semibold text-center">
              Mais de 50.000 pessoas já descobriram a verdade usando nosso APP{" "}
              <span className="inline-flex items-center gap-1">
                Oficial
                <img src="/whatsapp-icon.webp" alt="WhatsApp" className="h-[0.9em] w-[0.9em]" />
              </span>
            </p>
            <div className="flex justify-around">
              <Stat value="50k+" label="Relatórios gerados" />
              <Stat value="99%" label="Taxa de sucesso" />
              <Stat
                value={
                  <>
                    4.9
                    <Star className="inline h-5 w-5 fill-pink-500 text-pink-500 -mt-1 ml-0.5" />
                  </>
                }
                label="Avaliação média"
              />
            </div>
          </div>

          {/* SEÇÃO DE AVALIAÇÕES E SELOS DE SEGURANÇA */}
          <div className="space-y-6">
            {/* Avaliações */}
            <div className="text-center space-y-4">
              <h3 className="text-lg font-bold text-[#15FF00] text-glow-green">
                ⭐ Avaliado por mais de 15.000 clientes
              </h3>

              <div className="flex justify-center items-center space-x-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 fill-yellow-500 text-yellow-500" />
                ))}
                <span className="ml-2 text-xl font-bold text-foreground">4.9/5</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted/20 border border-border rounded-lg p-2">
                  <div className="text-lg font-bold text-[#15FF00]">98%</div>
                  <div className="text-xs text-muted-foreground">Descobriram a verdade</div>
                </div>
                <div className="bg-muted/20 border border-border rounded-lg p-2">
                  <div className="text-lg font-bold text-[#15FF00]">24h</div>
                  <div className="text-xs text-muted-foreground">Tempo médio de entrega</div>
                </div>
                <div className="bg-muted/20 border border-border rounded-lg p-2">
                  <div className="text-lg font-bold text-[#15FF00]">100%</div>
                  <div className="text-xs text-muted-foreground">Satisfação garantida</div>
                </div>
              </div>
            </div>

            {/* Selos de Segurança */}
            <div className="bg-gradient-to-r from-green-900/10 to-emerald-900/10 border border-green-500/20 rounded-lg p-4">
              <h4 className="text-center text-sm font-bold text-[#15FF00] mb-3">🔒 CERTIFICAÇÕES E GARANTIAS</h4>

              <div className="grid grid-cols-2 gap-3">
                {/* SSL Certificado */}
                <div className="flex items-center space-x-2 bg-muted/10 border border-border rounded-lg p-2">
                  <div className="bg-green-500 rounded-full p-1">
                    <ShieldCheck className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">SSL 256-bit</div>
                    <div className="text-xs text-muted-foreground">Criptografia máxima</div>
                  </div>
                </div>

                {/* Pagamento Seguro */}
                <div className="flex items-center space-x-2 bg-muted/10 border border-border rounded-lg p-2">
                  <div className="bg-blue-500 rounded-full p-1">
                    <Lock className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">PIX Seguro</div>
                    <div className="text-xs text-muted-foreground">Banco Central</div>
                  </div>
                </div>

                {/* Dados Protegidos */}
                <div className="flex items-center space-x-2 bg-muted/10 border border-border rounded-lg p-2">
                  <div className="bg-purple-500 rounded-full p-1">
                    <ShieldCheck className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">LGPD</div>
                    <div className="text-xs text-muted-foreground">Dados protegidos</div>
                  </div>
                </div>

                {/* Garantia */}
                <div className="flex items-center space-x-2 bg-muted/10 border border-border rounded-lg p-2">
                  <div className="bg-yellow-500 rounded-full p-1">
                    <Star className="h-4 w-4 text-white fill-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">Garantia 7 dias</div>
                    <div className="text-xs text-muted-foreground">Dinheiro de volta</div>
                  </div>
                </div>
              </div>

              {/* Selo Principal */}
              <div className="mt-4 text-center">
                <div className="inline-flex items-center bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-full px-4 py-2">
                  <ShieldCheck className="h-5 w-5 text-[#15FF00] mr-2" />
                  <span className="text-sm font-bold text-[#15FF00]">PAGAMENTO VERIFICADO E LICENCIADO</span>
                  <ShieldCheck className="h-5 w-5 text-[#15FF00] ml-2" />
                </div>
              </div>
            </div>
          </div>

          {/* INFO PAGAMENTO */}
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center mb-4">
              <Square className="h-5 w-5 fill-green-500 text-green-500 mr-2" />
              Informações de Pagamento
            </h2>

            <Label className="text-foreground font-medium mb-2 block">Método de Pagamento</Label>
            <div className="w-full flex justify-start items-center border border-border font-normal py-2 px-3 rounded-md bg-white text-black mt-1">
              <Square className="h-5 w-5 fill-green-500 text-green-500 mr-3" />
              PIX - Pagamento Instantâneo
            </div>
          </div>

          {/* QR CODE OU INSTRUÇÃO */}
          <div className="flex items-center justify-center min-h-[150px] bg-muted/20 border border-border rounded-lg p-4">
            {isLoadingPix ? (
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            ) : pixCode ? (
              <div className="space-y-3 w-full">
                <p className="text-center text-muted-foreground text-sm">
                  Escaneie o código QR com seu app do banco ou copie o código PIX
                </p>
                {pixCode && (
                  <Button
                    variant="ghost"
                    className="w-full hover:text-blue-600 text-sm underline mt-2 text-[rgba(37,211,102,1)]"
                    onClick={() => setShowInstructions(true)}
                  >
                    Como fazer pagamento?
                  </Button>
                )}

                <div className="flex flex-col items-center">
                  <QRCode value={pixCode} size={150} level="H" />
                  <p className="text-sm text-muted-foreground mt-1">
                    Expira em {formatPixTime(pixExpirationTime)} minutos.
                  </p>
                  <p className="text-lg font-bold text-[#15FF00] mt-2">
                    Valor: R${" "}
                    {(
                      totalAmount +
                      (selectedOrderBumps.investigacao ? 11.9 : 0) +
                      (selectedOrderBumps.localizacao ? 6.9 : 0) +
                      (selectedOrderBumps.relatorio ? 7.9 : 0)
                    )
                      .toFixed(2)
                      .replace(".", ",")}
                  </p>
                  <div className="flex items-center justify-center border border-border rounded-full px-4 py-2 mt-2 bg-muted/20">
                    <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-sm text-muted-foreground">Status: Aguardando Pagamento</span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full justify-center border border-border font-semibold py-2 px-4 rounded-md bg-white text-black animate-pulse mt-4"
                    onClick={() => {
                      navigator.clipboard.writeText(pixCode)
                      alert("Código Pix copiado!")

                      if (!bonusPopupShown && !bonusPopupShownAfterCopy) {
                        setBonusPopupShownAfterCopy(true)
                        setTimeout(() => {
                          if (document.visibilityState === "visible" && !showInstructions && !showBonusPopup) {
                            setBonusTimeLeft(300)
                            setShowBonusPopup(true)
                            setBonusPopupShown(true)
                          }
                        }, 7000)
                      }
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Código PIX
                  </Button>

                  <div className="text-center mt-4 p-3 bg-muted/10 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground">ID da Transação</p>
                    <p className="text-base font-semibold break-all text-[rgba(37,211,102,1)]">{transactionId}</p>
                  </div>

                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-4">
                    <li>O pagamento será confirmado automaticamente</li>
                    <li>Após o pagamento, você receberá o relatório por e-mail</li>
                    <li>Em caso de dúvidas, guarde o ID da transação</li>
                    <li>Satisfação com relatório ou dinheiro de volta</li>
                    <li>Relatório completo válido por tempo limitado</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground text-sm">
                <div className="w-24 h-24 bg-muted/30 rounded-md mx-auto mb-2" />
                Preencha seu e-mail e clique em "Gerar PIX" para continuar
              </div>
            )}
          </div>

          {/* COBRANÇA */}
          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">Envio do relatório completo</h2>
            <Label htmlFor="customerEmail" className="text-foreground font-medium">
              E-mail *
            </Label>
            <Input
              id="customerEmail"
              type="email"
              placeholder="seu.email@exemplo.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              required
              disabled={pixCode !== null}
              className={`bg-white border-border text-black mt-1 placeholder:text-gray-600 ${
                !customerEmail && !pixCode && paymentStatus !== "completed" ? "border-red-500" : ""
              } ${pixCode !== null ? "opacity-50 cursor-not-allowed" : ""}`}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Precisamos apenas do seu e-mail para enviar o relatório completo de forma segura e anônima
            </p>
          </div>

          {/* BOTÃO PRINCIPAL */}
          <Button
            onClick={handleGeneratePix}
            disabled={isLoadingPix || paymentStatus === "completed" || !customerEmail || pixCode !== null}
            className={`w-full py-6 text-lg font-bold bg-gradient-to-r from-[#25D366] to-[#15FF00] hover:from-[#25D366]/90 hover:to-[#15FF00]/90 text-white ${
              !isLoadingPix && paymentStatus !== "completed" && customerEmail && pixCode === null
                ? "animate-pulse-green"
                : ""
            } text-black`}
          >
            {isLoadingPix ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Gerando PIX...
              </>
            ) : paymentStatus === "completed" ? (
              "Pagamento Concluído"
            ) : pixCode !== null ? (
              "Aguardando o pagamento..."
            ) : (
              `Gerar PIX - R$ ${totalAmount.toFixed(2).replace(".", ",")}`
            )}
          </Button>

          {/* SEÇÃO DE SEGURANÇA */}
          <div className="text-center mt-4">
            <p className="text-muted-foreground text-sm flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-muted mr-1" />
              Pagamento 100% seguro e criptografado
            </p>
            <p className="text-xs text-muted-foreground mt-1">Seus dados estão protegidos por SSL de 256 bits</p>
          </div>

          {/* SEÇÃO DE DEPOIMENTOS */}
          <div className="w-full space-y-6 pt-4">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-[#15FF00] text-glow-green flex items-center justify-center gap-3">
                <img src="/whatsapp-testimonials.png" alt="WhatsApp" className="h-8 w-8" />O QUE NOSSOS CLIENTES DIZEM
                <img src="/whatsapp-testimonials.png" alt="WhatsApp" className="h-8 w-8" />
              </h2>
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center bg-green-500/20 border border-green-500/50 rounded-full px-3 py-1">
                  <ShieldCheck className="h-4 w-4 text-[#15FF00] mr-2" />
                  <span className="text-xs font-bold text-[#15FF00]">100% Verificado</span>
                </div>
                <div className="flex items-center bg-green-500/20 border border-green-500/50 rounded-full px-3 py-1">
                  <Star className="h-4 w-4 text-[#15FF00] mr-2 fill-[#15FF00]" />
                  <span className="text-xs font-bold text-[#15FF00]">Avaliações Reais</span>
                </div>
              </div>
            </div>
            <TestimonialCarousel />

            {/* Updated verification text */}
            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                ✅ Todas as avaliações são verificadas e autenticadas •
                <span className="text-[#15FF00] font-bold"> +15.000 clientes satisfeitos</span>
              </p>
              <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <ShieldCheck className="h-3 w-3 text-[#15FF00] mr-1" />
                  <span>Identidade verificada</span>
                </div>
                <div className="flex items-center">
                  <Star className="h-3 w-3 text-[#15FF00] mr-1 fill-[#15FF00]" />
                  <span>Compra confirmada</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* POP-UP DE DESAFIO BÔNUS - ENTRADA */}
      {showEntryBonus && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[60] animate-in fade-in-0 zoom-in-95">
          <Card className="w-full max-w-md bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/50 text-card-foreground">
            <CardContent className="p-6 space-y-4">
              {/* Timer do desafio */}
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-5 w-5 text-[#15FF00] mr-2" />
                  <span className="text-[#15FF00] font-bold text-lg">
                    Desafio acaba em {formatEntryBonusTime(entryBonusTimeLeft)} minutos
                  </span>
                </div>
                <div className="w-full bg-green-900/30 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-[#15FF00] to-green-400 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${(entryBonusTimeLeft / 300) * 100}%` }}
                  />
                </div>
              </div>

              <div className="text-center space-y-4">
                <div className="flex justify-center mb-2">
                  <img src="/whatsapp-challenge.png" alt="WhatsApp" className="w-16 h-16" />
                </div>
                <h2 className="text-2xl font-bold text-[#15FF00] text-glow-green">🚀DESAFIO SECRETO ATIVADO!</h2>

                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4 space-y-3">
                  <p className="text-foreground font-semibold text-lg leading-tight">
                    <span className="text-[#15FF00]">MISSÃO:</span> Pague seu PIX em até 5 minutos
                  </p>

                  <div className="bg-green-900/20 border border-green-500/30 rounded p-3">
                    <p className="text-[#15FF00] font-bold text-center">🎁 RECOMPENSA: +1 Relatório Extra GRÁTIS</p>
                    <p className="text-sm text-muted-foreground text-center mt-1">
                      Descubra ainda mais segredos com análise dupla
                    </p>
                  </div>

                  <p className="text-red-500 font-bold text-center animate-pulse text-lg">
                    ⏰ Apenas quem quer saber a verdade rápido ganham essa recompensa!
                  </p>
                </div>

                <div className="bg-muted/10 rounded-lg p-3 border border-border">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="text-yellow-500 font-bold text-sm">O que você ganha:</span>
                  </div>
                  <div className="text-left space-y-1 text-sm text-muted-foreground">
                    <p>✅ Relatório principal completo</p>
                    <p>✅ +1 Relatório bônus (mesmo valor)</p>
                    <p>✅ Análise dupla de segurança</p>
                    <p>✅ Mais dados para descobrir a verdade</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={() => {
                    console.log("Botão clicado - fechando pop-up")
                    setShowEntryBonus(false)
                    setEntryBonusAccepted(true)
                  }}
                  className="w-full py-4 px-12 text-lg font-bold bg-transparent border-2 border-[#15FF00] text-[#15FF00] hover:bg-[#15FF00]/10 animate-pulse relative overflow-hidden group"
                  style={{
                    boxShadow: "0 0 20px rgba(21, 255, 0, 0.5), inset 0 0 20px rgba(21, 255, 0, 0.1)",
                    textShadow: "0 0 10px rgba(21, 255, 0, 0.8)",
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#15FF00]/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <div className="flex items-center justify-center relative z-10">
                    <img src="/whatsapp-challenge.png" alt="WhatsApp" className="w-5 h-5 mr-3 relative z-10" />
                    <span className="relative z-10 text-center">SABER DE TODA A VERDADE AGORA</span>
                  </div>
                </Button>
              </div>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">🎯 Desafio disponível apenas uma vez</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAIS EXISTENTES - Mantendo todos os modais anteriores */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-background text-foreground max-h-[90vh] overflow-y-auto border border-border">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-[#15FF00] text-glow-green">💡 Como fazer o pagamento PIX</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInstructions(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div className="bg-muted/20 border border-border rounded-lg p-4">
                  <div className="space-y-3 text-sm text-foreground">
                    <div className="flex items-start space-x-3">
                      <span className="bg-[#15FF00] text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        1
                      </span>
                      <div>
                        <p className="font-semibold">Abra o app do seu banco</p>
                        <p className="text-muted-foreground">Nubank, Inter, Itaú, Bradesco, Santander, etc.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="bg-[#15FF00] text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        2
                      </span>
                      <div>
                        <p className="font-semibold">Procure a opção "PIX"</p>
                        <p className="text-muted-foreground">Geralmente fica no menu principal</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="bg-[#15FF00] text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        3
                      </span>
                      <div>
                        <p className="font-semibold">Selecione "PIX Copia e Cola"</p>
                        <p className="text-muted-foreground">Ou "Pagar com código PIX"</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="bg-[#15FF00] text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        4
                      </span>
                      <div>
                        <p className="font-semibold">Cole o código PIX</p>
                        <p className="text-muted-foreground">Use o botão abaixo para copiar</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="bg-[#15FF00] text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        ✓
                      </span>
                      <div>
                        <p className="font-semibold text-[#15FF00]">Confirme o pagamento</p>
                        <p className="text-muted-foreground">Verifique o valor e confirme</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(pixCode!)
                    alert("Código PIX copiado!")

                    if (!bonusPopupShown && !bonusPopupShownAfterCopy) {
                      setBonusPopupShownAfterCopy(true)
                      setTimeout(() => {
                        if (document.visibilityState === "visible" && !showInstructions && !showBonusPopup) {
                          setBonusTimeLeft(300)
                          setShowBonusPopup(true)
                          setBonusPopupShown(true)
                        }
                      }, 7000)
                    }
                  }}
                  className="w-full py-3 text-lg font-bold bg-gradient-to-r from-[#25D366] to-[#15FF00] hover:from-[#25D366]/90 hover:to-[#15FF00]/90 text-black animate-pulse-green"
                >
                  <Copy className="h-5 w-5 mr-2" />
                  Copiar Código PIX
                </Button>

                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Após copiar, volte para o app do seu banco e cole o código
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showOrderBumps && (
        <div className="fixed inset-0 bg-black/80 flex items-start justify-center p-2 z-50 overflow-y-auto">
          <Card className="w-full max-w-md bg-card text-card-foreground mt-4 mb-4">
            <CardContent className="p-4 space-y-4">
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-4 w-4 text-[#15FF00] mr-2" />
                  <span className="text-[#15FF00] font-bold text-sm">
                    Ofertas especiais acabam em {formatOrderBumpTime(orderBumpTimeLeft)} minutos
                  </span>
                </div>
              </div>

              <div className="text-center">
                <h2 className="text-xl font-bold text-[#15FF00] text-glow-green mb-1">🎯 OFERTA ESPECIAL!</h2>
                <p className="text-muted-foreground text-xs">Aproveite essas ofertas exclusivas antes de finalizar</p>
              </div>

              <div className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="investigacao"
                    checked={selectedOrderBumps.investigacao}
                    onChange={(e) =>
                      setSelectedOrderBumps((prev) => ({
                        ...prev,
                        investigacao: e.target.checked,
                      }))
                    }
                    className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <label htmlFor="investigacao" className="cursor-pointer">
                      <h3 className="font-bold text-foreground text-lg leading-tight">
                        ✅ 2 Investigações pelo Preço de 1 (EXCLUSIVO)
                      </h3>
                      <p className="text-muted-foreground text-sm mt-1 leading-tight">
                        Descubra tudo sobre duas pessoas diferentes com um único clique ou descubra mais da mesma
                        pessoa!
                      </p>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <span className="text-muted-foreground line-through text-xs">De R$ 49,90</span>
                        <span className="text-green-500 font-bold text-lg">R$ 19,90</span>
                        <span className="bg-green-500 text-white text-xs px-1 py-0.5 rounded">50% OFF</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center bg-green-500/20 border border-green-500/50 rounded px-2 py-1">
                          <span className="text-[#15FF00] text-xs font-bold">
                            🔥 Restam apenas {getAvailableOffersInvestigacao()}/10 ofertas disponíveis
                          </span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="localizacao"
                    checked={selectedOrderBumps.localizacao}
                    onChange={(e) =>
                      setSelectedOrderBumps((prev) => ({
                        ...prev,
                        localizacao: e.target.checked,
                      }))
                    }
                    className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <label htmlFor="localizacao" className="cursor-pointer">
                      <h3 className="font-bold text-foreground text-lg leading-tight">
                        📱 Whats Premium: Acesso Espelhado
                      </h3>
                      <p className="text-muted-foreground text-sm mt-1 leading-tight">
                        Veja tudo o que acontece no WhatsApp dela sem ela saber no seu celular. Mais praticidade, mais
                        controle.
                      </p>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <span className="text-muted-foreground line-through text-xs">De R$ 9,90</span>
                        <span className="text-green-500 font-bold text-lg">R$ 6,90</span>
                        <span className="bg-green-500 text-white text-xs px-1 py-0.5 rounded">25% OFF</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center bg-green-500/20 border border-green-500/50 rounded px-2 py-1">
                          <span className="text-[#15FF00] text-xs font-bold">
                            🔥 Restam apenas {getAvailableOffersLocalizacao()}/10 ofertas disponíveis
                          </span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="relatorio"
                    checked={selectedOrderBumps.relatorio}
                    onChange={(e) =>
                      setSelectedOrderBumps((prev) => ({
                        ...prev,
                        relatorio: e.target.checked,
                      }))
                    }
                    className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <label htmlFor="relatorio" className="cursor-pointer">
                      <h3 className="font-bold text-foreground text-lg leading-tight">
                        📊 Atualizações Secretas por 7 Dias
                      </h3>
                      <p className="text-muted-foreground text-sm mt-1 leading-tight">
                        Receba relatórios semanais detalhados sem levantar suspeitas. 😱 Ideal para acompanhar mudanças!
                      </p>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <span className="text-muted-foreground line-through text-xs">De R$ 25,90</span>
                        <span className="text-green-500 font-bold text-lg">R$ 7,90</span>
                        <span className="bg-green-500 text-white text-xs px-1 py-0.5 rounded">69% OFF</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center bg-green-500/20 border border-green-500/50 rounded px-2 py-1">
                          <span className="text-[#15FF00] text-xs font-bold">
                            🔥 Restam apenas {getAvailableOffersRelatorio()}/10 ofertas disponíveis
                          </span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-muted/20 rounded-lg p-3">
                <h4 className="font-bold text-foreground mb-2 text-sm">Resumo:</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>WHATS ESPIÃO</span>
                    <span>R$ {totalAmount.toFixed(2).replace(".", ",")}</span>
                  </div>
                  {selectedOrderBumps.investigacao && (
                    <div className="flex justify-between text-green-500">
                      <span>+ 2 Investigações</span>
                      <span>R$ 11,90</span>
                    </div>
                  )}
                  {selectedOrderBumps.localizacao && (
                    <div className="flex justify-between text-green-500">
                      <span>+ Whats Premium</span>
                      <span>R$ 6,90</span>
                    </div>
                  )}
                  {selectedOrderBumps.relatorio && (
                    <div className="flex justify-between text-green-500">
                      <span>+ Atualizações 7 Dias</span>
                      <span>R$ 7,90</span>
                    </div>
                  )}
                  <hr className="border-border" />
                  <div className="flex justify-between font-bold text-sm">
                    <span>Total:</span>
                    <span className="text-green-500">
                      R${" "}
                      {(
                        totalAmount +
                        (selectedOrderBumps.investigacao ? 11.9 : 0) +
                        (selectedOrderBumps.localizacao ? 6.9 : 0) +
                        (selectedOrderBumps.relatorio ? 7.9 : 0)
                      )
                        .toFixed(2)
                        .replace(".", ",")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={processPixGeneration}
                  className="w-full py-3 text-sm font-bold bg-gradient-to-r from-[#25D366] to-[#15FF00] hover:from-[#25D366]/90 hover:to-[#15FF00]/90 text-black animate-pulse-green"
                >
                  🚀 CONTINUAR COM OFERTAS
                </Button>
                <Button
                  onClick={() => {
                    setSelectedOrderBumps({ investigacao: false, localizacao: false, relatorio: false })
                    processPixGeneration()
                  }}
                  variant="outline"
                  className="w-full py-2 text-xs border-border text-muted-foreground hover:text-foreground"
                >
                  Não, continuar apenas com relatório completo
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground">⚡ Oferta válida apenas nesta tela!</p>
            </CardContent>
          </Card>
        </div>
      )}

      {showBonusPopup && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-card text-card-foreground border border-border animate-in fade-in-0 zoom-in-95">
            <CardContent className="p-6 space-y-4">
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-4 w-4 text-[#15FF00] mr-2" />
                  <span className="text-[#15FF00] font-bold text-sm">
                    Oferta acaba em {formatBonusTime(bonusTimeLeft)} minutos
                  </span>
                </div>
                <div className="w-full bg-green-900/30 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-[#15FF00] to-green-400 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${(bonusTimeLeft / 300) * 100}%` }}
                  />
                </div>
              </div>

              <div className="text-center">
                <div className="text-4xl mb-2">🎁</div>
                <h2 className="text-2xl font-bold text-[#15FF00] text-glow-green mb-2">VOCÊ GANHOU BÔNUS ESPECIAL!</h2>
                <p className="text-lg font-semibold text-card-foreground mb-1">Pague AGORA e ganhe:</p>
                <div className="bg-gradient-to-r from-green-500/10 to-[#15FF00]/10 border border-green-500/20 rounded-lg p-3 mb-4">
                  <p className="text-[#15FF00] font-bold text-lg">RELATÓRIO COMPLETO VIP + BÔNUS 🎁</p>
                  <p className="text-sm text-muted-foreground">
                    Análise completa de redes sociais + histórico de 3 meses
                  </p>
                  <div className="flex items-center justify-center mt-2 gap-3">
                    <span className="text-xl font-bold text-muted-foreground line-through">R$19,90</span>
                    <span className="text-2xl font-extrabold text-[#15FF00] bg-green-400/20 px-3 py-1 rounded-full border border-green-400/50 animate-pulse">
                      GRÁTIS
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-center p-3 bg-muted/10 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-2">Seu código PIX:</p>
                  <div className="bg-background/30 p-2 rounded border text-xs break-all font-mono">{pixCode}</div>
                </div>

                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(pixCode!)
                    alert("Código PIX copiado! Cole no seu banco e finalize o pagamento para garantir o bônus!")
                  }}
                  className="w-full py-4 text-lg font-bold bg-gradient-to-r from-green-500 to-[#15FF00] hover:from-green-600 hover:to-[#15FF00]/90 text-black animate-pulse"
                >
                  <Copy className="h-5 w-5 mr-2" />
                  COPIAR PIX E GARANTIR BÔNUS
                </Button>

                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2">
                    ⚡ Oferta válida apenas para pagamentos realizados até {(() => {
                      const now = new Date()
                      const futureTime = new Date(now.getTime() + 5 * 60 * 1000)
                      return futureTime.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })
                    })()}
                  </p>
                  <Button
                    onClick={() => setShowBonusPopup(false)}
                    variant="ghost"
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* POP-UP DE ALERTA APÓS 60 SEGUNDOS */}
      {showTimeAlert && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[70] animate-in fade-in-0 zoom-in-95">
          <Card className="w-full max-w-md bg-gradient-to-br from-red-900/20 to-orange-900/20 border border-red-500/50 text-card-foreground">
            <CardContent className="p-6 space-y-4">
              {/* Timer de urgência */}
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-5 w-5 text-red-500 mr-2 animate-pulse" />
                  <span className="text-red-500 font-bold text-lg animate-pulse">
                    ⚠️ TEMPO ESGOTANDO: {formatTime(timeLeft)} restantes!
                  </span>
                </div>
                <div className="w-full bg-red-900/30 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-red-500 to-orange-400 h-2 rounded-full transition-all duration-1000 animate-pulse"
                    style={{ width: `${(timeLeft / 300) * 100}%` }}
                  />
                </div>
              </div>

              <div className="text-center space-y-4">
                <div className="flex justify-center mb-2">
                  <div className="text-4xl animate-bounce">⏰</div>
                </div>
                <h2 className="text-2xl font-bold text-red-500 animate-pulse">🚨 ÚLTIMA CHANCE!</h2>

                <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-lg p-4 space-y-3">
                  <p className="text-foreground font-semibold text-lg leading-tight">
                    <span className="text-red-500">ATENÇÃO:</span> Você ainda não gerou seu PIX!
                  </p>

                  <div className="bg-red-900/20 border border-red-500/30 rounded p-3">
                    <p className="text-yellow-500 font-bold text-center">🎁 RECOMPENSA AINDA DISPONÍVEL!</p>
                    <p className="text-sm text-muted-foreground text-center mt-1">
                      Gere seu PIX AGORA e ganhe +1 Relatório Extra GRÁTIS
                    </p>
                  </div>

                  <p className="text-orange-500 font-bold text-center text-lg">
                    ⚡ Restam apenas {formatTime(timeLeft)} minutos para garantir sua recompensa!
                  </p>
                </div>

                <div className="bg-muted/10 rounded-lg p-3 border border-border">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="text-yellow-500 font-bold text-sm">O que você está perdendo:</span>
                  </div>
                  <div className="text-left space-y-1 text-sm text-muted-foreground">
                    <p>❌ Relatório principal completo</p>
                    <p>❌ +1 Relatório bônus (mesmo valor)</p>
                    <p>❌ Análise dupla de segurança</p>
                    <p>❌ Desconto especial por tempo limitado</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setShowTimeAlert(false)
                    // Scroll para o campo de email
                    document.getElementById("customerEmail")?.scrollIntoView({ behavior: "smooth" })
                    document.getElementById("customerEmail")?.focus()
                  }}
                  className="w-full py-4 px-12 text-lg font-bold bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white animate-pulse relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <div className="flex items-center justify-center relative z-10">
                    <Clock className="w-5 h-5 mr-3 relative z-10" />
                    <span className="relative z-10 text-center">GERAR PIX AGORA E GARANTIR BÔNUS</span>
                  </div>
                </Button>
              </div>

              <div className="text-center">
                <p className="text-xs text-red-400 animate-pulse">
                  🔥 Esta é sua última chance de garantir a recompensa!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function TestimonialCard({ name, text }: { name: string; text: string }) {
  return (
    <Card className="bg-muted/20 border border-border">
      <CardContent className="p-3 space-y-3">
        {/* Header with stars and verification */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-[#15FF00] text-black text-xs px-2 py-1 rounded-full font-bold flex items-center">
              <ShieldCheck className="h-3 w-3 mr-1 text-black" />
              Verificado
            </div>
          </div>
        </div>

        {/* Review text */}
        <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>

        {/* Footer with name and trust badges */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {name.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">{name}</p>
              <p className="text-xs text-muted-foreground">Cliente verificado</p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <div className="bg-green-500/20 border border-green-500/50 text-green-500 text-xs px-2 py-1 rounded-full font-bold flex items-center">
              <Star className="h-3 w-3 mr-1 fill-green-500" />
              Original
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const testimonials = [
    {
      name: "Mariana M.",
      text: "Eu sempre desconfiei, mas ele era bom de papo… dizia q apagava as conversas pq 'não queria briga'. Quando vi o relatório, veio tudo à tona. Msg com ex, coraçãozinho, chamada de vídeo… sério, foi a prova q eu precisava pra dar um basta",
    },
    {
      name: "Larissa S.",
      text: "O relatório é incrível! Mostrou conversas que ele jurava que nunca existiram, horários de atividade suspeitos, até contatos que ele tinha bloqueado do meu WhatsApp. Valeu cada centavo, me salvou de anos de mentira.",
    },
    {
      name: "Juliana R.",
      text: "Sou mãe, trabalho o dia inteiro, e ainda tinha que lidar com as mentiras dele? O relatório foi minha salvação. Me mostrou tudo que eu não queria ver, mas precisava. Agora ele que lide com o silêncio.",
    },
    {
      name: "Camila T.",
      text: "Ele sempre deixava o celular virado pra baixo e saía pra atender ligação. O relatório mostrou que ele tinha 3 conversas ativas no Tinder. Pelo menos agora sei que não era paranoia minha.",
    },
    {
      name: "Fernanda L.",
      text: "Descobri que ele estava conversando com a ex há meses. Dizia que era só amizade, mas as mensagens que vi no relatório contavam outra história. Me livrei de um mentiroso.",
    },
    {
      name: "Beatriz C.",
      text: "Gastei anos da minha vida com alguém que me traía. O relatório me deu coragem pra terminar e seguir em frente. Hoje sou muito mais feliz sozinha do que era com ele.",
    },
    {
      name: "Amanda P.",
      text: "O relatório é muito detalhado! Mostra até os grupos que a pessoa participa, últimas visualizações, padrões de comportamento... Descobri coisas que nem imaginava. Recomendo demais!",
    },
    {
      name: "Gabriela F.",
      text: "Descobri que ele tinha perfil em 5 apps de relacionamento diferentes. Dizia que me amava, mas estava procurando outras. O relatório salvou minha vida amorosa.",
    },
    {
      name: "Rafaela M.",
      text: "Ele apagava tudo, mas o relatório mostrou conversas de madrugada, fotos íntimas trocadas… Fiquei chocada, mas pelo menos agora sei a verdade e posso recomeçar.",
    },
    {
      name: "Patrícia D.",
      text: "Sempre desconfiei das 'reuniões de trabalho' até tarde. O relatório mostrou que ele estava saindo com colegas de trabalho. Pelo menos agora sei que não era trabalho mesmo.",
    },
    {
      name: "Carolina B.",
      text: "Fiquei impressionada com a qualidade do relatório. Muito completo, com capturas de tela, horários, frequência de mensagens... Tudo organizadinho. Agora tenho certeza do que estava acontecendo.",
    },
    {
      name: "Vanessa K.",
      text: "Descobri que ele estava marcando encontros enquanto eu cuidava dos nossos filhos. O relatório me deu a prova que eu precisava pra pedir o divórcio. Melhor decisão da minha vida.",
    },
    {
      name: "Priscila A.",
      text: "Bom, no meu caso o relatório mostrou que eu estava sendo paranóica mesmo. Ele não estava fazendo nada demais, era só trabalho e família. Pelo menos agora tenho certeza e posso confiar mais nele.",
    },
    {
      name: "Renata F.",
      text: "O relatório é bem detalhado e profissional. No final das contas, descobri que minhas suspeitas eram infundadas. Ele realmente estava só conversando com amigos e colegas de trabalho. Me ajudou a ter paz de espírito.",
    },
    {
      name: "Luciana M.",
      text: "Pensei que ia descobrir traição, mas o relatório mostrou que era tudo coisa da minha cabeça. Ele só conversa com a família e alguns amigos. Pelo menos agora sei que posso confiar nele 100%.",
    },
    {
      name: "Daniela S.",
      text: "O relatório é muito bom e completo! Mostra tudo: contatos, grupos, atividades... No meu caso, felizmente não tinha nada suspeito. Meu marido é fiel mesmo. Valeu a pena pela tranquilidade.",
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 10_000)
    return () => clearInterval(interval)
  }, [testimonials.length])

  const getVisibleTestimonials = () => {
    const visible: typeof testimonials = []
    for (let i = 0; i < 3; i++) {
      const index = (currentIndex + i) % testimonials.length
      visible.push(testimonials[index])
    }
    return visible
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {getVisibleTestimonials().map((t, idx) => (
          <TestimonialCard key={`${currentIndex}-${idx}`} name={t.name} text={t.text} />
        ))}
      </div>

      <div className="flex justify-center space-x-2">
        {Array.from({ length: Math.ceil(testimonials.length / 3) }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx * 3)}
            className={`w-2 h-2 rounded-full transition-colors ${
              Math.floor(currentIndex / 3) === idx ? "bg-[#15FF00]" : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl font-bold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}
