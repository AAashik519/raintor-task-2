"use client"

import { useSignalR } from "@/contexts/signalr-context"
import { useLocationSender } from "@/hooks/use-location-sender"

export default function LocationStatus() {
  const { isConnected, connectionStatus, error, reconnect } = useSignalR()
  const { isAutoSending, email, sendCount, lastSent, useMockMode } = useLocationSender()

  return (
    <div className="max-w-4xl mx-auto mb-6">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-4">
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
              {connectionStatus}
            </div>

            {/* Auto-sending Status */}
            {isAutoSending && email && (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <div className="w-2 h-2 rounded-full mr-2 bg-blue-500 animate-pulse"></div>
                Auto-sending as {email} {useMockMode ? "(Mock)" : ""}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {sendCount > 0 && (
              <>
                <span>Sent: {sendCount}</span>
                {lastSent && <span>Last: {lastSent}</span>}
              </>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-red-800 text-sm font-medium">Connection Error:</div>
            <div className="text-red-700 text-sm mt-1">{error}</div>
            <button
              onClick={reconnect}
              className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Retry Connection
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
