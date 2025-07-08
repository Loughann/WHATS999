"use client"

import { useState, useEffect } from "react"
import { CheckoutForm } from "@/components/checkout-form"
import { CheckoutOffer } from "@/components/checkout-offer"
import { CheckoutSummary } from "@/components/checkout-summary"
import { PixPayment } from "@/components/pix-payment"
import { trackInitiateCheckout } from "@/lib/facebook-pixel"

export default function CheckoutPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [orderData, setOrderData] = useState({
    totalValue: 14.9,
    hasOrderBump: false,
  })
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    paymentMethod: "pix",
  })

  // Disparar evento InitiateCheckout quando a página carregar
  useEffect(() => {
    trackInitiateCheckout(14.9)
  }, [])

  const handleStep1Complete = (totalValue: number, hasOrderBump: boolean) => {
    setOrderData({ totalValue, hasOrderBump })
    setCurrentStep(4) // Vai direto para a página de pagamento PIX
  }

  const handleStep2Complete = () => {
    setCurrentStep(3)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-md mx-auto">
        {currentStep === 1 && (
          <div className="py-4 px-4">
            <CheckoutForm formData={formData} setFormData={setFormData} onComplete={handleStep1Complete} />
          </div>
        )}

        {currentStep === 2 && (
          <div className="py-4 px-4">
            <CheckoutOffer onComplete={handleStep2Complete} />
          </div>
        )}

        {currentStep === 3 && (
          <div className="py-4 px-4">
            <CheckoutSummary />
          </div>
        )}

        {currentStep === 4 && <PixPayment formData={formData} orderValue={orderData.totalValue} />}
      </div>
    </div>
  )
}
