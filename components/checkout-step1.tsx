"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ShoppingCart } from "lucide-react"

interface CheckoutStep1Props {
  formData: {
    name: string
    email: string
    phone: string
  }
  updateFormData: (data: any) => void
  onNext: () => void
}

export function CheckoutStep1({ formData, updateFormData, onNext }: CheckoutStep1Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-red-900 text-white">
        <CardContent className="p-4 flex items-center gap-3">
          <ShoppingCart className="w-6 h-6" />
          <div>
            <div className="font-medium">VOCÊ ESTÁ ADQUIRINDO:</div>
            <div className="text-lg font-bold">ESPIÃO 3.0</div>
          </div>
        </CardContent>
      </Card>

      {/* Step 1 - Personal Data */}
      <Card>
        <CardHeader className="bg-gray-400 text-white p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white text-gray-400 rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <span className="font-bold">DADOS PESSOAIS</span>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                Nome completo
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                placeholder="juliana paes"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData({ email: e.target.value })}
                placeholder="juju7762@gmail.com"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-sm font-medium">
                Telefone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateFormData({ phone: e.target.value })}
                placeholder="11980987756"
                className="mt-1"
                required
              />
            </div>

            <Button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white">
              Continuar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
