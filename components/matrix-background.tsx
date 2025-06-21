"use client"

import { useEffect, useRef } from "react"

export function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener("resize", resizeCanvas)
    resizeCanvas() // Initial resize

    const font_size = 16
    const columns = canvas.width / font_size
    const drops: number[] = []

    // Initialize drops to the top of the canvas
    for (let i = 0; i < columns; i++) {
      drops[i] = 1
    }

    const draw = () => {
      // Black background with opacity to create the trail effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = "#0F0" // Green text
      ctx.font = `${font_size}px monospace`

      for (let i = 0; i < drops.length; i++) {
        // A random binary character
        const text = Math.random() < 0.5 ? "0" : "1"
        ctx.fillText(text, i * font_size, drops[i] * font_size)

        // Sending the drop back to the top randomly after it has crossed the screen
        // Adding a randomness to the reset to make it look more natural
        if (drops[i] * font_size > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }

        // Incrementing Y coordinate
        drops[i]++
      }

      animationFrameId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full z-0" // Ensure it covers the whole screen and is behind content
    />
  )
}
