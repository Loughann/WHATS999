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

export const trackAddToCart = (value: number, currency = "BRL") => {
  trackEvent("AddToCart", {
    value: value,
    currency: currency,
    content_type: "product",
    content_name: "Whats Espião Acesso",
  })
}

// Função simples para tracking de purchase
export const trackPurchase = (value: number, currency = "BRL") => {
  trackEvent("Purchase", {
    value: value,
    currency: currency,
    content_type: "product",
    content_name: "Whats Espião Acesso",
  })
}

export const trackUtmPurchase = (value: number, utmParams: string, currency = "BRL") => {
  trackEvent("Purchase", {
    value: value,
    currency: currency,
    content_type: "product",
    content_name: "Whats Espião Acesso",
    utm_params: utmParams,
  })

  // Enviar evento para a rota /api/track-purchase
  if (typeof window !== "undefined") {
    const timestamp = new Date().toISOString()

    navigator.sendBeacon(
      "/api/track-purchase",
      JSON.stringify({
        event: "Purchase",
        value: value,
        currency: currency,
        utm_params: utmParams,
        timestamp: timestamp,
      }),
    )
  }
}
