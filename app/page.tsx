"use client"

import { useState } from "react"
import { SignalRProvider } from "@/contexts/signalr-context"
import LocationSender from "@/components/location-sender"
import LocationReceiver from "@/components/location-receiver"
import LocationStatus from "@/components/location-status"

function AppContent() {
  const [activeTab, setActiveTab] = useState("sender")

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Real-Time Location Sharing</h1>

        {/* Global Location Status */}
        <LocationStatus />

        <div className="max-w-4xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex mb-6 bg-white rounded-lg shadow-sm p-1">
            <button
              onClick={() => setActiveTab("sender")}
              className={`flex-1 py-3 px-6 rounded-md font-medium transition-colors ${
                activeTab === "sender" ? "bg-blue-500 text-white" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Send Location (User A)
            </button>
            <button
              onClick={() => setActiveTab("receiver")}
              className={`flex-1 py-3 px-6 rounded-md font-medium transition-colors ${
                activeTab === "receiver" ? "bg-blue-500 text-white" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Receive Location (User B)
            </button>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow-lg">
            {activeTab === "sender" ? <LocationSender /> : <LocationReceiver />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <SignalRProvider>
      <AppContent />
    </SignalRProvider>
  )
}
