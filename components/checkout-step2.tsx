"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CreditCard } from "lucide-react"

interface CheckoutStep2Props {
  formData: {
    paymentMethod: string
  }
  updateFormData: (data: any) => void
  onNext: () => void
  onPrev: () => void
}

export function CheckoutStep2({ formData, updateFormData, onNext, onPrev }: CheckoutStep2Props) {
  const handlePaymentSelect = (method: string) => {
    updateFormData({ paymentMethod: method })
    setTimeout(onNext, 500)
  }

  return (
    <div className="space-y-4">
      {/* Step 2 - Payment */}
      <Card>
        <CardHeader className="bg-gray-400 text-white p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white text-gray-400 rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <span className="font-bold">PAGAMENTO</span>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12 flex items-center gap-2 bg-transparent"
              onClick={() => handlePaymentSelect("credit")}
            >
              <CreditCard className="w-4 h-4" />
              Cartão de Crédito
            </Button>

            <Button
              variant="outline"
              className="h-12 bg-green-50 border-green-300 text-green-700 hover:bg-green-100 relative"
              onClick={() => handlePaymentSelect("pix")}
            >
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              Pix
            </Button>
          </div>

          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <span className="text-teal-600 font-bold">01.</span>
              <p>Pagamento em segundos, sem complicações</p>
            </div>

            <div>
              <span className="text-teal-600 font-bold">02.</span>
              <p>Basta escanear, com o aplicativo do seu banco, o QRCode que iremos gerar sua compra</p>
            </div>

            <div>
              <span className="text-teal-600 font-bold">03.</span>
              <p>O PIX foi desenvolvido pelo Banco Central para facilitar suas compras e é 100% seguro.</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onPrev} className="flex-1 bg-transparent">
              Voltar
            </Button>
            <Button className="flex-1 bg-green-500 hover:bg-green-600" onClick={() => handlePaymentSelect("pix")}>
              Continuar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
