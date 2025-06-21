"use client"

import type * as React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation" // Importar useRouter

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Loader2, ShieldCheck, Lock, Clock, Square, Star } from "lucide-react"
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
  const router = useRouter() // Inicializar useRouter
  const [pixCode, setPixCode] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "completed" | "failed" | null>(null)
  const [isLoadingPix, setIsLoadingPix] = useState(false)
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const [customerEmail, setCustomerEmail] = useState("")

  const itemTitle = "BLCKX7" // Nome do produto para a API
  const itemPrice = 9.9
  const totalAmount = 9.9

  const description = "Pagamento do BLCKX7" // Descrição para a API

  async function handleGeneratePix() {
    if (!customerEmail) {
      alert("Por favor, insira seu e-mail.")
      return
    }

    setIsLoadingPix(true)
    setPixCode(null)
    setTransactionId(null)
    setPaymentStatus(null)

    const payload: GeneratePixPayload = {
      amount: Math.round(totalAmount * 100),
      description,
      customer: {
        name: "Cliente Tinder",
        document: "000.000.000-00",
        phone: "00000000000",
        email: customerEmail,
      },
      item: {
        title: itemTitle, // Usando o nome do produto para a API
        price: Math.round(itemPrice * 100),
        quantity: 1,
      },
      utm: "checkout-v0",
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

      // Dispara o evento Purchase ao gerar o PIX
      if (typeof window !== "undefined" && (window as any).fbq) {
        ;(window as any).fbq("track", "Purchase", { value: totalAmount, currency: "BRL" })
      }
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

      // Dispara o evento Purchase ao confirmar o pagamento como concluído
      if (data.status === "completed" && typeof window !== "undefined" && (window as any).fbq) {
        ;(window as any).fbq("track", "Purchase", { value: totalAmount, currency: "BRL" })
      }
    } catch (err) {
      console.error(err)
      setPaymentStatus("failed")
    } finally {
      setIsVerifyingPayment(false)
    }
  }

  useEffect(() => {
    // Dispara o evento InitializeCheckout quando o componente é montado
    if (typeof window !== "undefined" && (window as any).fbq) {
      ;(window as any).fbq("track", "InitiateCheckout")
    }

    if (transactionId && paymentStatus === "pending") {
      intervalRef.current = setInterval(() => handleVerifyPix(transactionId), 5000)
    }
    if (paymentStatus === "completed") {
      // Redireciona para a página de obrigado quando o pagamento é concluído
      router.push("/thank-you")
      if (intervalRef.current) clearInterval(intervalRef.current)
    } else if (paymentStatus !== "pending" && intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [transactionId, paymentStatus, router])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <MatrixBackground />

      <Card className="w-full max-w-md shadow-lg rounded-lg bg-card text-card-foreground relative z-10">
        <CardContent className="p-6 space-y-8">
          {/* HEADER */}
          <div className="text-center">
            <h1 className="text-6xl font-extrabold uppercase text-[#15FF00] text-glow-green mb-2">{"WHATS ESPIÃO"}</h1>{" "}
            {/* Título exibido */}
            <p className="text-4xl font-extrabold text-pink-500 mb-2">R$ {totalAmount.toFixed(2).replace(".", ",")}</p>
            <p className="text-sm text-muted">Desconto especial por tempo limitado</p>
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
            <p className="text-foreground font-semibold">
              Mais de 75.000 pessoas já descobriram a verdade usando nosso APP Oficial
            </p>
            <div className="flex justify-around">
              <Stat value="75k+" label="Relatórios gerados" />
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

          {/* INFO PAGAMENTO */}
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center mb-4">
              <Square className="h-5 w-5 fill-green-500 text-green-500 mr-2" />
              Informações de Pagamento
            </h2>

            <Label className="text-foreground font-medium mb-2 block">Método de Pagamento</Label>
            {/* Ajustado para ter a mesma aparência do campo de e-mail */}
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
                {/* Novas informações e botão de copiar */}
                <p className="text-center text-muted-foreground text-sm">
                  Escaneie o código QR com seu app do banco ou copie o código PIX
                </p>
                <Button
                  variant="outline"
                  className="w-full justify-center border border-border font-semibold py-2 px-4 rounded-md bg-white text-black"
                  onClick={() => {
                    navigator.clipboard.writeText(pixCode)
                    alert("Código Pix copiado!")
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Código PIX
                </Button>
                {/* Fim das novas informações */}

                <div className="flex flex-col items-center">
                  <QRCode value={pixCode} size={150} level="H" />
                  <p className="text-sm text-muted-foreground mt-1">Válido por 30 minutos</p>
                  {/* Novo elemento de status */}
                  <div className="flex items-center justify-center border border-border rounded-full px-4 py-2 mt-2 bg-muted/20">
                    <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-sm text-muted-foreground">Status: Aguardando Pagamento</span>
                  </div>
                  {/* Fim do novo elemento de status */}

                  <div className="text-center mt-4 p-3 bg-muted/10 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground">ID da Transação</p>
                    <p className="text-base font-semibold break-all text-[rgba(37,211,102,1)]">{transactionId}</p>
                  </div>

                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-4">
                    <li>O pagamento será confirmado automaticamente</li>
                    <li>Após o pagamento, você receberá o relatório por e-mail</li>
                    <li>Em caso de dúvidas, guarde o ID da transação</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground text-sm">
                <div className="w-24 h-24 bg-muted/30 rounded-md mx-auto mb-2" />
                Preencha seu e-mail e clique em “Gerar PIX” para continuar
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
              className={`bg-white border-border text-black mt-1 placeholder:text-gray-600 ${
                !customerEmail && !pixCode && paymentStatus !== "completed" ? "border-red-500" : ""
              }`}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Precisamos apenas do seu e-mail para enviar o relatório completo de forma segura e anônima
            </p>
          </div>

          {/* BOTÃO PRINCIPAL */}
          <Button
            onClick={handleGeneratePix}
            disabled={isLoadingPix || paymentStatus === "completed" || !customerEmail}
            className={`w-full py-6 text-lg font-bold bg-gradient-to-r from-[#25D366] to-[#15FF00] hover:from-[#25D366]/90 hover:to-[#15FF00]/90 text-white ${
              !isLoadingPix && paymentStatus !== "completed" && customerEmail ? "animate-pulse-green" : ""
            } text-black`}
          >
            {isLoadingPix ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Gerando PIX...
              </>
            ) : paymentStatus === "completed" ? (
              "Pagamento Concluído"
            ) : (
              `Gerar PIX - R$ ${totalAmount.toFixed(2).replace(".", ",")}`
            )}
          </Button>

          {/* SEÇÃO DE SEGURANÇA AGORA DENTRO DO CARD */}
          <div className="text-center mt-4">
            <p className="text-muted-foreground text-sm flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-muted mr-1" />
              Pagamento 100% seguro e criptografado
            </p>
            <p className="text-xs text-muted-foreground mt-1">Seus dados estão protegidos por SSL de 256 bits</p>
          </div>

          {/* SEÇÃO DE DEPOIMENTOS AGORA DENTRO DO CARD */}
          <div className="w-full space-y-6 pt-4">
            <h2 className="text-xl font-bold text-foreground flex items-center">
              <Star className="h-6 w-6 fill-yellow-500 text-yellow-500 mr-2" />O que nossos clientes dizem
            </h2>
            <TestimonialCard
              name="Mariana M."
              text="Eu sempre desconfiei, mas ele era bom de papo… dizia q apagava as conversas pq ‘não queria briga’. Quando vi o relatório, veio tudo à tona. Msg com ex, coraçãozinho, chamada de vídeo… sério, foi a prova q eu precisava pra dar um basta"
            />
            <TestimonialCard
              name="Larissa S."
              text="Desconfiei por semanas, mas ele era do tipo ‘bom de lábia’. O relatório mostrou tudo: mensagens antigas, conversas que ele jurava que nunca existiram. Foi a melhor coisa que fiz. Abri meus olhos antes que fosse tarde demais."
            />
            <TestimonialCard
              name="Juliana R."
              text="Sou mãe, trabalho o dia inteiro, e ainda tinha que lidar com as mentiras dele? O relatório foi minha salvação. Me mostrou tudo que eu não queria ver, mas precisava. Agora ele que lide com o silêncio."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/** Componente auxiliar das estatísticas */
function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-pink-500 text-3xl font-bold">{value}</span>
      <span className="text-muted-foreground text-sm">{label}</span>
    </div>
  )
}

/** Componente auxiliar para os depoimentos */
function TestimonialCard({ name, text }: { name: string; text: string }) {
  return (
    <Card className="p-4 bg-card shadow-sm rounded-lg border border-border">
      <CardContent className="p-0">
        <div className="flex items-center mb-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-5 w-5 fill-yellow-500 text-yellow-500" />
          ))}
          <span className="font-semibold text-foreground ml-2">{name}</span>
        </div>
        <p className="text-muted-foreground italic text-sm">"{text}"</p>
      </CardContent>
    </Card>
  )
}
