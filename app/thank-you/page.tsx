"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { MatrixBackground } from "@/components/matrix-background"

export default function ThankYouPage() {
  const router = useRouter()

  useEffect(() => {
    // Redireciona imediatamente para o link externo
    router.push("https://premiumespiao.netlify.app/")
  }, [router]) // Adicionar router como dependência

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10 bg-background text-foreground">
      <MatrixBackground />
      <div className="relative z-10 text-center space-y-4">
        <h1 className="text-2xl font-semibold text-blue-400 text-glow-blue">Redirecionando...</h1>
        <p className="text-muted-foreground text-sm">Por favor, aguarde.</p>
      </div>
    </div>
  )
}
