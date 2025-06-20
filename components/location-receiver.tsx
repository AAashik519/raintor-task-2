"use client"

import { useState, useEffect, useRef } from "react"
import { useSignalR } from "@/contexts/signalr-context"

export default function LocationReceiver() {
  const [selectedLocation, setSelectedLocation] = useState<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<any>(null)
  const markersRef = useRef<any>({})
  const leafletRef = useRef<any>(null)

  const { receivedLocations } = useSignalR()

  // Initialize Leaflet map
  useEffect(() => {
    if (typeof window !== "undefined" && mapRef.current && !leafletMapRef.current) {
      // Set up Leaflet CSS first
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      // Load Leaflet script
      const script = document.createElement("script")
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      script.onload = () => {
        try {
          const L = (window as any).L
          leafletRef.current = L

          // Initialize map
          leafletMapRef.current = L.map(mapRef.current).setView([25.73736464, 90.3644747], 13)

          // Add tile layer
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
          }).addTo(leafletMapRef.current)

          // Add a default marker to test
          const defaultMarker = L.marker([25.73736464, 90.3644747])
            .addTo(leafletMapRef.current)
            .bindPopup("Default Location<br>Dhaka, Bangladesh")

          setMapLoaded(true)
          console.log("Map initialized successfully")
        } catch (error) {
          console.error("Error initializing map:", error)
          setMapError("Failed to initialize map")
        }
      }
      script.onerror = () => {
        setMapError("Failed to load Leaflet library")
      }
      document.head.appendChild(script)
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
        setMapLoaded(false)
      }
    }
  }, [])

  // Update map when new locations are received
  useEffect(() => {
    if (receivedLocations.length > 0 && leafletMapRef.current && leafletRef.current && mapLoaded) {
      try {
        const L = leafletRef.current
        const latestLocation = receivedLocations[0]
        const { userName, lat, lon } = latestLocation

        console.log("Adding marker for:", { userName, lat, lon })

        // Remove existing marker for this user
        if (markersRef.current[userName]) {
          leafletMapRef.current.removeLayer(markersRef.current[userName])
        }

        // Create custom icon (optional)
        const customIcon = L.divIcon({
          html: `<div style="background-color: #3B82F6; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
          className: "custom-marker",
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })

        // Add new marker
        const marker = L.marker([lat, lon], { icon: customIcon })
          .addTo(leafletMapRef.current)
          .bindPopup(`
            <div style="font-family: Arial, sans-serif;">
              <strong>${userName}</strong><br>
              Lat: ${typeof lat === "number" ? lat.toFixed(6) : lat}<br>
              Lon: ${typeof lon === "number" ? lon.toFixed(6) : lon}<br>
              <small>Time: ${latestLocation.timestamp}</small>
            </div>
          `)

        markersRef.current[userName] = marker

        // Center map on latest location
        leafletMapRef.current.setView([lat, lon], Math.max(leafletMapRef.current.getZoom(), 15))

        console.log("Marker added successfully")
      } catch (error) {
        console.error("Error adding marker:", error)
      }
    }
  }, [receivedLocations, mapLoaded])

  const handleLocationClick = (location: any) => {
    setSelectedLocation(location)
    if (leafletMapRef.current && mapLoaded) {
      leafletMapRef.current.setView([location.lat, location.lon], 16)
      if (markersRef.current[location.userName]) {
        markersRef.current[location.userName].openPopup()
      }
    }
  }

  const clearLocations = () => {
    setSelectedLocation(null)
    // Clear all markers except default
    Object.values(markersRef.current).forEach((marker: any) => {
      if (leafletMapRef.current) {
        leafletMapRef.current.removeLayer(marker)
      }
    })
    markersRef.current = {}
  }

  const centerOnLocation = (location: any) => {
    if (leafletMapRef.current && mapLoaded) {
      leafletMapRef.current.setView([location.lat, location.lon], 16)
      if (markersRef.current[location.userName]) {
        markersRef.current[location.userName].openPopup()
      }
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Receive Locations</h2>

      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Locations are automatically received and displayed here in real-time.
          {mapLoaded && <span className="text-green-600 ml-2">✓ Map loaded</span>}
          {mapError && <span className="text-red-600 ml-2">✗ {mapError}</span>}
        </div>
        <button onClick={clearLocations} className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600">
          Clear Markers
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map */}
        <div className="order-2 lg:order-1">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Live Map</h3>
          <div
            ref={mapRef}
            className="w-full h-96 bg-gray-200 rounded-lg border relative"
            style={{ minHeight: "400px" }}
          >
            {!mapLoaded && !mapError && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500 bg-gray-100 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p>Loading map...</p>
                </div>
              </div>
            )}
            {mapError && (
              <div className="absolute inset-0 flex items-center justify-center text-red-500 bg-red-50 rounded-lg">
                <div className="text-center">
                  <p>Map Error: {mapError}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm"
                  >
                    Reload Page
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Location List */}
        <div className="order-1 lg:order-2">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Received Locations ({receivedLocations.length})</h3>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {receivedLocations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📍</div>
                <p>Waiting for location updates...</p>
                <p className="text-sm">Make sure User A is sending locations</p>
              </div>
            ) : (
              receivedLocations.map((location) => (
                <div
                  key={location.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedLocation?.id === location.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-gray-800">{location.userName}</span>
                    <span className="text-xs text-gray-500">{location.timestamp}</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <div>Lat: {typeof location.lat === "number" ? location.lat.toFixed(6) : location.lat}</div>
                    <div>Lon: {typeof location.lon === "number" ? location.lon.toFixed(6) : location.lon}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLocationClick(location)}
                      className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      Select
                    </button>
                    <button
                      onClick={() => centerOnLocation(location)}
                      className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                    >
                      Center Map
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Selected Location Details */}
      {selectedLocation && (
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Selected Location</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-600">User:</span> {selectedLocation.userName}
            </div>
            <div>
              <span className="text-blue-600">Time:</span> {selectedLocation.timestamp}
            </div>
            <div>
              <span className="text-blue-600">Latitude:</span>{" "}
              {typeof selectedLocation.lat === "number" ? selectedLocation.lat.toFixed(8) : selectedLocation.lat}
            </div>
            <div>
              <span className="text-blue-600">Longitude:</span>{" "}
              {typeof selectedLocation.lon === "number" ? selectedLocation.lon.toFixed(8) : selectedLocation.lon}
            </div>
          </div>
        </div>
      )}

      {/* Debug Info */}
      {receivedLocations.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
          <strong>Debug Info:</strong> Map loaded: {mapLoaded ? "Yes" : "No"}, Locations received:{" "}
          {receivedLocations.length}, Active markers: {Object.keys(markersRef.current).length}
        </div>
      )}
    </div>
  )
}
