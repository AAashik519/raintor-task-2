"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import * as signalR from "@microsoft/signalr"

const HUB_URL = "https://tech-test.raintor.com/Hub"

export function useSignalR() {
  const [connection, setConnection] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState("Disconnected")
  const connectionRef = useRef(null)
  const retryTimeoutRef = useRef(null)

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

    const startConnection = async () => {
      try {
        setConnectionStatus("Connecting...")
        setError(null)

        await newConnection.start()
        setIsConnected(true)
        setConnectionStatus("Connected")
        setError(null)
        console.log("SignalR Connected successfully")
      } catch (err) {
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

    newConnection.onclose((error) => {
      setIsConnected(false)
      setConnectionStatus("Disconnected")
      if (error) {
        setError(`Connection closed: ${error.message}`)
        console.log("SignalR Disconnected with error:", error)
      } else {
        console.log("SignalR Disconnected")
      }
    })

    newConnection.onreconnecting((error) => {
      setIsConnected(false)
      setConnectionStatus("Reconnecting...")
      console.log("SignalR Reconnecting...", error)
    })

    newConnection.onreconnected((connectionId) => {
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
    async (lat, lon, userName) => {
      if (connection && isConnected) {
        try {
          await connection.invoke("SendLatLon", lat, lon, userName)
          console.log("Location sent successfully:", { lat, lon, userName })
          return true
        } catch (err) {
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
    (callback) => {
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
      } catch (err) {
        setError(`Reconnection failed: ${err.message}`)
        setConnectionStatus("Connection Failed")
      }
    }
  }, [connection])

  return {
    connection,
    isConnected,
    error,
    connectionStatus,
    sendLocation,
    onReceiveLocation,
    reconnect,
  }
}
