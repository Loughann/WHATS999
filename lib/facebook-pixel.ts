// Função para disparar eventos do Facebook Pixel
declare global {
  interface Window {
    fbq: any
  }
}

export const trackEvent = (eventName: string, parameters?: any) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, parameters)
  }
}

export const trackInitiateCheckout = (value: number, currency = "BRL") => {
  trackEvent("InitiateCheckout", {
    value: value,
    currency: currency,
    content_type: "product",
    content_name: "Whats Espião Acesso",
  })
}

// Função para tracking via UTM (não usa Facebook Pixel)
export const trackUtmPurchase = (value: number, utmParams: string) => {
  if (typeof window !== "undefined") {
    // Aqui você pode implementar o tracking via UTM
    // Por exemplo, enviar para um endpoint personalizado ou Google Analytics
    console.log("UTM Purchase Event:", {
      value: value,
      currency: "BRL",
      utm_params: utmParams,
      event: "purchase",
      timestamp: new Date().toISOString(),
    })

    // Exemplo de envio para um endpoint personalizado
    fetch("/api/track-purchase", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "purchase",
        value: value,
        currency: "BRL",
        utm_params: utmParams,
        timestamp: new Date().toISOString(),
      }),
    }).catch((error) => {
      console.error("Erro ao enviar evento UTM:", error)
    })
  }
}

export const trackAddToCart = (value: number, currency = "BRL") => {
  trackEvent("AddToCart", {
    value: value,
    currency: currency,
    content_type: "product",
    content_name: "Whats Espião Acesso",
  })
}
