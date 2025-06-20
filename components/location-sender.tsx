"use client"

import { useSignalR } from "@/contexts/signalr-context"
import { useLocationSender } from "@/hooks/use-location-sender"

export default function LocationSender() {
  const { isConnected } = useSignalR()
  const {
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
  } = useLocationSender()

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Send Your Location</h2>

      {/* Mock Mode Toggle */}
      <div className="mb-6 flex items-center">
        <input
          type="checkbox"
          id="mockMode"
          checked={useMockMode}
          onChange={(e) => setUseMockMode(e.target.checked)}
          className="mr-2"
        />
        <label htmlFor="mockMode" className="text-sm text-gray-700">
          Use Mock Mode (for testing when SignalR is unavailable)
        </label>
      </div>

      {/* Form */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Your Email (Username)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
            <input
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="25.73736464"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
            <input
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="90.3644747"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={getCurrentLocation}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
        >
          Get Current Location
        </button>

        <button
          onClick={handleSimulateMovement}
          className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
        >
          Simulate Movement
        </button>

        <button
          onClick={handleSendLocation}
          disabled={!email || !latitude || !longitude}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Send Location Once
        </button>

        <button
          onClick={sendTestLocation}
          className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
        >
          Send Test Location
        </button>
      </div>

      {/* Auto Send Toggle */}
      <div className="flex items-center mb-6">
        <input
          type="checkbox"
          id="autoSend"
          checked={isAutoSending}
          onChange={(e) => setIsAutoSending(e.target.checked)}
          disabled={!email || !latitude || !longitude}
          className="mr-2"
        />
        <label htmlFor="autoSend" className="text-sm text-gray-700">
          Auto-send location every 5 seconds {useMockMode ? "(Mock Mode)" : ""}
        </label>
      </div>

      {/* Status */}
      <div className="bg-gray-50 p-4 rounded-md">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Mode:</span> {useMockMode ? "Mock" : "Real SignalR"}
          </div>
          <div>
            <span className="text-gray-600">Total Sent:</span> {sendCount}
          </div>
          {lastSent && (
            <>
              <div>
                <span className="text-gray-600">Last Sent:</span> {lastSent}
              </div>
              <div>
                <span className="text-gray-600">Coordinates:</span> {latitude}, {longitude}
              </div>
            </>
          )}
        </div>

        {isAutoSending && (
          <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-800">
            <strong>Auto-sending is active!</strong> Your location will continue to be sent every 5 seconds even when
            you switch to the "Receive Location" tab.
          </div>
        )}
      </div>
    </div>
  )
}
