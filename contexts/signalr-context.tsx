"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react"
import * as signalR from "@microsoft/signalr"

const HUB_URL = "https://tech-test.raintor.com/Hub"

interface LocationData {
  userName: string
  lat: number
  lon: number
  timestamp?: string
  id?: number
}

interface SignalRContextType {
  connection: any
  isConnected: boolean
  error: string | null
  connectionStatus: string
  sendLocation: (lat: number, lon: number, userName: string) => Promise<boolean>
  onReceiveLocation: (callback: (data: LocationData) => void) => (() => void) | undefined
  reconnect: () => Promise<void>
  receivedLocations: LocationData[]
}

const SignalRContext = createContext<SignalRContextType | undefined>(undefined)

export function SignalRProvider({ children }: { children: ReactNode }) {
  const [connection, setConnection] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState("Disconnected")
  const [receivedLocations, setReceivedLocations] = useState<LocationData[]>([])
  const connectionRef = useRef<any>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        skipNegotiation: false,
        transport:
          signalR.HttpTransportType.WebSockets |
          signalR.HttpTransportType.ServerSentEvents |
          signalR.HttpTransportType.LongPolling,
        withCredentials: false,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount === 0) {
            return 0
          }
          return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000)
        },
      })
      .configureLogging(signalR.LogLevel.Information)
      .build()

    connectionRef.current = newConnection
    setConnection(newConnection)

    // Set up location receiving
    newConnection.on("ReceiveLatLon", (locationData: LocationData) => {
      console.log("Received location:", locationData)
      const newLocation = {
        ...locationData,
        timestamp: new Date().toLocaleTimeString(),
        id: Date.now() + Math.random(),
      }
      setReceivedLocations((prev) => [newLocation, ...prev.slice(0, 49)])
    })

    const startConnection = async () => {
      try {
        setConnectionStatus("Connecting...")
        setError(null)

        await newConnection.start()
        setIsConnected(true)
        setConnectionStatus("Connected")
        setError(null)
        console.log("SignalR Connected successfully")
      } catch (err: any) {
        setIsConnected(false)
        setConnectionStatus("Connection Failed")
        setError(`Connection failed: ${err.message}. This might be due to CORS policy or server unavailability.`)
        console.error("SignalR Connection Error:", err)

        // Retry connection after 5 seconds
        retryTimeoutRef.current = setTimeout(() => {
          console.log("Retrying connection...")
          startConnection()
        }, 5000)
      }
    }

    startConnection()

    newConnection.onclose((error: any) => {
      setIsConnected(false)
      setConnectionStatus("Disconnected")
      if (error) {
        setError(`Connection closed: ${error.message}`)
        console.log("SignalR Disconnected with error:", error)
      } else {
        console.log("SignalR Disconnected")
      }
    })

    newConnection.onreconnecting((error: any) => {
      setIsConnected(false)
      setConnectionStatus("Reconnecting...")
      console.log("SignalR Reconnecting...", error)
    })

    newConnection.onreconnected((connectionId: string) => {
      setIsConnected(true)
      setConnectionStatus("Reconnected")
      setError(null)
      console.log("SignalR Reconnected with ID:", connectionId)
    })

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
      if (newConnection) {
        newConnection.stop()
      }
    }
  }, [])

  const sendLocation = useCallback(
    async (lat: number, lon: number, userName: string) => {
      if (connection && isConnected) {
        try {
          await connection.invoke("SendLatLon", lat, lon, userName)
          console.log("Location sent successfully:", { lat, lon, userName })
          return true
        } catch (err: any) {
          console.error("Error sending location:", err)
          setError(`Failed to send location: ${err.message}`)
          return false
        }
      } else {
        setError("Cannot send location: Not connected to SignalR hub")
        return false
      }
    },
    [connection, isConnected],
  )

  const onReceiveLocation = useCallback(
    (callback: (data: LocationData) => void) => {
      if (connection) {
        connection.on("ReceiveLatLon", callback)
        return () => {
          connection.off("ReceiveLatLon", callback)
        }
      }
    },
    [connection],
  )

  const reconnect = useCallback(async () => {
    if (connection) {
      try {
        setConnectionStatus("Reconnecting...")
        setError(null)
        await connection.start()
      } catch (err: any) {
        setError(`Reconnection failed: ${err.message}`)
        setConnectionStatus("Connection Failed")
      }
    }
  }, [connection])

  const clearReceivedLocations = useCallback(() => {
    setReceivedLocations([])
  }, [])

  return (
    <SignalRContext.Provider
      value={{
        connection,
        isConnected,
        error,
        connectionStatus,
        sendLocation,
        onReceiveLocation,
        reconnect,
        receivedLocations,
      }}
    >
      {children}
    </SignalRContext.Provider>
  )
}

export function useSignalR() {
  const context = useContext(SignalRContext)
  if (context === undefined) {
    throw new Error("useSignalR must be used within a SignalRProvider")
  }
  return context
}
