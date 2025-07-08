"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Lock, Shield, ArrowRight } from "lucide-react"

interface CheckoutStep3Props {
  onPrev: () => void
  onComplete: () => void
}

export function CheckoutStep3({ onPrev, onComplete }: CheckoutStep3Props) {
  return (
    <div className="space-y-4">
      {/* Step 3 Header */}
      <Card>
        <CardHeader className="bg-gray-400 text-white p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white text-gray-400 rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <span className="font-bold">COMPRE JUNTO</span>
          </div>
        </CardHeader>
      </Card>

      {/* Offer Banner */}
      <Card className="bg-green-500 text-white">
        <CardContent className="p-4">
          <div className="text-center font-bold text-lg">APROVEITE!</div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-gray-600">
            <span className="font-bold text-black">68% das pessoas</span> que compraram{" "}
            <span className="text-blue-600 font-bold">ESPIÃO 3.0</span> também se interessaram por:
          </p>
        </CardContent>
      </Card>

      {/* Main Offer */}
      <Card className="border-2 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Checkbox id="addon" />
                <label htmlFor="addon" className="text-sm font-medium text-green-600">
                  ADQUIRIR TAMBÉM ACESSO TOTAL
                </label>
              </div>
              <div className="text-green-600 font-bold">À VISTA POR R$ 29,90</div>

              <div className="mt-3 space-y-2 text-sm">
                <div className="text-red-600 font-bold">
                  🔓 DESBLOQUEIE TUDO! ACESSO TOTAL ao WhatsApp, Facebook, Telegram, Tiktok, e até à localização em
                  tempo real!
                </div>

                <div className="text-green-600">
                  ✅ Além de garantir Acesso VITALÍCIO com direito a TODAS as atualizações do APP para usar quantas
                  vezes quiser!
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complete Purchase Button */}
      <Button className="w-full bg-green-500 hover:bg-green-600 text-white h-12 text-lg font-bold" onClick={onComplete}>
        Finalizar Compra <ArrowRight className="w-5 h-5 ml-2" />
      </Button>

      {/* Security Info */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-green-600 text-sm">
          <Shield className="w-4 h-4" />
          <span>Pagamento 100% seguro, processado com criptografia 128bits.</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">Produto digital, os dados para acesso serão enviados por email.</p>
      </div>

      {/* Navigation */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={onPrev} className="flex-1 bg-transparent">
          Voltar
        </Button>
      </div>
    </div>
  )
}
