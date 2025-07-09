// Função para disparar eventos do Facebook Pixel
declare global {
  interface Window {
    fbq: any
  }
}

export const trackEvent = (eventName: string, parameters?: any) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, parameters)
    console.log(`📊 Facebook Pixel Event: ${eventName}`, parameters)
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

export const trackPurchase = (value: number, currency = "BRL") => {
  trackEvent("Purchase", {
    value: value,
    currency: currency,
    content_type: "product",
    content_name: "Whats Espião Acesso",
  })
}

export const trackViewContent = (contentName: string, value?: number) => {
  trackEvent("ViewContent", {
    content_name: contentName,
    content_type: "product",
    value: value,
    currency: "BRL",
  })
}

export const trackCompleteRegistration = () => {
  trackEvent("CompleteRegistration", {
    content_name: "Whats Espião Acesso - Dados Preenchidos",
  })
}

// Função para tracking via UTM (não usa Facebook Pixel)
export const trackUtmPurchase = (value: number, utmParams: string) => {
  if (typeof window !== "undefined") {
    console.log("🎯 UTM Purchase Event:", {
      value: value,
      currency: "BRL",
      utm_params: utmParams,
      event: "purchase",
      timestamp: new Date().toISOString(),
    })

    // Envio para endpoint personalizado
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
      console.error("❌ Erro ao enviar evento UTM:", error)
    })
  }
}

// Função para tracking de eventos customizados
export const trackCustomEvent = (eventName: string, data: any) => {
  if (typeof window !== "undefined") {
    console.log(`🔥 Custom Event: ${eventName}`, data)

    // Enviar para seu endpoint de analytics
    fetch("/api/track-custom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: eventName,
        data: data,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        utm_params: new URLSearchParams(window.location.search).toString(),
      }),
    }).catch((error) => {
      console.error("❌ Erro ao enviar evento customizado:", error)
    })
  }
}
