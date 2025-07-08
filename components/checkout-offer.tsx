"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Lock, Shield, ArrowRight } from "lucide-react"

interface CheckoutOfferProps {
  onComplete: () => void
}

export function CheckoutOffer({ onComplete }: CheckoutOfferProps) {
  const [acceptOffer, setAcceptOffer] = useState(false)

  return (
    <div className="space-y-4">
      {/* Step 3 Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold">3</div>
        <span className="bg-gray-400 text-white px-4 py-1 rounded-full font-bold text-sm">COMPRE JUNTO</span>
      </div>

      {/* Offer Banner */}
      <div className="bg-green-500 text-white px-4 py-2 rounded font-bold text-center">APROVEITE!</div>

      {/* Statistics */}
      <div className="bg-white p-4 rounded">
        <p className="text-sm">
          <span className="font-bold text-black">68% das pessoas</span>{" "}
          <span className="text-blue-600 underline">que compraram</span>{" "}
          <span className="font-bold text-black">ESPIÃO 3.0</span>{" "}
          <span className="text-blue-600 underline">também se interessaram por:</span>
        </p>
      </div>

      {/* Main Offer Card */}
      <Card className="bg-white border-2 border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Green Lock Icon */}
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Lock className="w-10 h-10 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-start gap-3 mb-4">
                <Checkbox
                  id="addon"
                  checked={acceptOffer}
                  onCheckedChange={(checked) => setAcceptOffer(checked as boolean)}
                  className="mt-1 w-5 h-5 border-2 border-gray-300"
                />
                <div>
                  <div className="text-sm font-medium text-blue-600 mb-1">ADQUIRIR TAMBÉM ACESSO TOTAL</div>
                  <div className="text-green-600 font-bold text-lg">À VISTA POR R$ 29,90</div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-red-600 text-lg">🔓</span>
                  <span className="text-red-600 font-bold leading-tight">
                    DESBLOQUEIE TUDO! ACESSO TOTAL ao WhatsApp, Facebook, Telegram, Tiktok, e até à localização em tempo
                    real!
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-green-600 text-lg">✅</span>
                  <span className="text-green-600 font-medium leading-tight">
                    Além de garantir Acesso VITALÍCIO com direito a TODAS as atualizações do APP para usar quantas vezes
                    quiser!
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complete Purchase Button */}
      <Button
        className="w-full bg-green-500 hover:bg-green-600 text-white h-14 text-lg font-bold rounded-lg"
        onClick={onComplete}
      >
        Finalizar Compra <ArrowRight className="w-5 h-5 ml-2" />
      </Button>

      {/* Security Info */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2 text-green-600 text-sm font-medium">
          <Shield className="w-4 h-4" />
          <span>Pagamento 100% seguro, processado com criptografia 128bits.</span>
        </div>
        <p className="text-sm text-gray-600">Produto digital, os dados para acesso serão enviados por email.</p>
      </div>
    </div>
  )
}
