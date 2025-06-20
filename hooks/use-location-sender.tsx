"use client"

import { useState, useEffect, useRef } from "react"
import { useSignalR } from "@/contexts/signalr-context"

export function useLocationSender() {
  const [email, setEmail] = useState("")
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [isAutoSending, setIsAutoSending] = useState(false)
  const [lastSent, setLastSent] = useState<string | null>(null)
  const [sendCount, setSendCount] = useState(0)
  const [useMockMode, setUseMockMode] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const { isConnected, sendLocation } = useSignalR()

  // Auto-send location - this runs regardless of which tab is active
  useEffect(() => {
    if (isAutoSending && email && latitude && longitude) {
      const sendLocationData = async () => {
        let success = false

        if (useMockMode || !isConnected) {
          // Mock mode - simulate sending
          console.log("Mock sending location:", {
            lat: Number.parseFloat(latitude),
            lon: Number.parseFloat(longitude),
            userName: email,
          })
          success = true

          // Simulate some random movement for demo
          const currentLat = Number.parseFloat(latitude) || 25.73736464
          const currentLon = Number.parseFloat(longitude) || 90.3644747
          const newLat = currentLat + (Math.random() - 0.5) * 0.001
          const newLon = currentLon + (Math.random() - 0.5) * 0.001
          setLatitude(newLat.toFixed(8))
          setLongitude(newLon.toFixed(8))
        } else {
          // Real SignalR sending
          success = await sendLocation(Number.parseFloat(latitude), Number.parseFloat(longitude), email)
        }

        if (success) {
          setLastSent(new Date().toLocaleTimeString())
          setSendCount((prev) => prev + 1)
        }
      }

      // Send immediately
      sendLocationData()

      // Set up interval for continuous sending
      intervalRef.current = setInterval(sendLocationData, 5000)
    } else {
      // Clear interval if auto-sending is disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isAutoSending, email, latitude, longitude, isConnected, useMockMode, sendLocation])

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toString())
          setLongitude(position.coords.longitude.toString())
        },
        (error) => {
          console.error("Error getting location:", error)
          setLatitude("25.73736464")
          setLongitude("90.3644747")
        },
      )
    } else {
      setLatitude("25.73736464")
      setLongitude("90.3644747")
    }
  }

  const handleSendLocation = async () => {
    if (!email || !latitude || !longitude) {
      alert("Please fill in all fields")
      return
    }

    let success = false

    if (useMockMode || !isConnected) {
      console.log("Mock sending location:", {
        lat: Number.parseFloat(latitude),
        lon: Number.parseFloat(longitude),
        userName: email,
      })
      success = true
    } else {
      success = await sendLocation(Number.parseFloat(latitude), Number.parseFloat(longitude), email)
    }

    if (success) {
      setLastSent(new Date().toLocaleTimeString())
      setSendCount((prev) => prev + 1)
    }
  }

  const handleSimulateMovement = () => {
    const currentLat = Number.parseFloat(latitude) || 25.73736464
    const currentLon = Number.parseFloat(longitude) || 90.3644747

    const newLat = currentLat + (Math.random() - 0.5) * 0.001
    const newLon = currentLon + (Math.random() - 0.5) * 0.001

    setLatitude(newLat.toFixed(8))
    setLongitude(newLon.toFixed(8))
  }

  const sendTestLocation = async () => {
    const testEmail = email || "test@example.com"
    const testLat = 25.73736464 + (Math.random() - 0.5) * 0.01
    const testLon = 90.3644747 + (Math.random() - 0.5) * 0.01

    let success = false

    if (useMockMode || !isConnected) {
      console.log("Sending test location:", { lat: testLat, lon: testLon, userName: testEmail })
      success = true
    } else {
      success = await sendLocation(testLat, testLon, testEmail)
    }

    if (success) {
      setLastSent(new Date().toLocaleTimeString())
      setSendCount((prev) => prev + 1)
    }
  }

  return {
    email,
    setEmail,
    latitude,
    setLatitude,
    longitude,
    setLongitude,
    isAutoSending,
    setIsAutoSending,
    lastSent,
    sendCount,
    useMockMode,
    setUseMockMode,
    getCurrentLocation,
    handleSendLocation,
    handleSimulateMovement,
    sendTestLocation,
  }
}
