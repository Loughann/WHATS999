import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Heart } from "lucide-react"

export function CheckoutSummary() {
  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <Card>
        <CardHeader className="bg-gray-400 text-white p-3 text-center">
          <span className="font-bold">RESUMO DA COMPRA</span>
        </CardHeader>
      </Card>

      {/* Product Summary */}
      <Card className="bg-white">
        <CardContent className="p-6 text-center">
          {/* Product Icon - Spy with hat */}
          <div className="w-32 h-32 bg-gray-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
              <div className="relative">
                {/* Hat */}
                <div className="w-12 h-4 bg-black rounded-full mb-1"></div>
                <div className="w-8 h-2 bg-black rounded-full mx-auto mb-1"></div>
                {/* Face */}
                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                  <div className="text-white text-lg">👤</div>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-bold mb-2">ESPIÃO 3.0</h2>
          <p className="text-gray-600 text-sm mb-6">ÚLTIMAS UNIDADES - R$ 47,00</p>

          <div className="bg-gray-50 rounded-lg overflow-hidden">
            <div className="bg-gray-200 p-3 flex justify-between font-medium">
              <span>Total Hoje:</span>
              <span className="text-green-600 font-bold">R$ 47,00</span>
            </div>
            <div className="p-3 flex justify-between">
              <span>ESPIÃO 3.0</span>
              <span className="text-green-600 font-bold">R$ 47,00</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Info */}
      <div className="text-center text-sm text-gray-600">
        <p>
          <span className="font-medium">E-MAIL DE SUPORTE:</span> whatsdetect.app@gmail.com
        </p>
      </div>

      {/* Secure Purchase */}
      <Button className="w-full bg-green-500 hover:bg-green-600 text-white h-12 font-bold">
        <Heart className="w-4 h-4 mr-2 fill-current" />
        COMPRA 100% SEGURA
      </Button>

      {/* Legal Info */}
      <div className="text-xs text-gray-500 text-center space-y-2">
        <p>Esta compra será processada por: PerfectPay © 2025 - Todos os direitos reservados.</p>
        <p>** Taxa de 2,99% a.m.</p>
        <p>
          Ao continuar nesta compra, você concorda com os{" "}
          <span className="text-blue-600 underline cursor-pointer">Termos de Compra</span> e{" "}
          <span className="text-blue-600 underline cursor-pointer">Termos de Privacidade</span>.
        </p>
      </div>
    </div>
  )
}
