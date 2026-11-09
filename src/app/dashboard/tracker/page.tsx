"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  AlertCircle,
  CheckCircle2,
  CircleDot,
  Clock3,
  MapPin,
  Package,
  Plus,
  Radio,
  Route,
  ShieldCheck,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface AssignmentOption {
  id: string;
  title: string;
  location?: string | null;
  assigneeId?: string | null;
}

interface InventoryOption {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  unit: string;
  warehouse?: {
    name: string;
    address?: string | null;
    city?: string | null;
    country?: string | null;
  } | null;
}

interface Shipment {
  id: string;
  assignmentId: string;
  inventoryItemId: string;
  quantity: number;
  destination: string;
  status: "PREPARING" | "IN_TRANSIT" | "DELIVERED" | "DELAYED";
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  locationAccuracy?: number | null;
  lastLocationAt?: string | null;
  deliveredAt?: string | null;
  assignment?: AssignmentOption | null;
  inventoryItem?: InventoryOption | null;
}

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const LOCATION_INTERVAL_MS = 15_000;

function getWarehouseAddress(item?: InventoryOption | null) {
  const warehouse = item?.warehouse;
  return [warehouse?.address, warehouse?.city, warehouse?.country]
    .filter(Boolean)
    .join(", ") || warehouse?.name || "";
}

function formatLocationTime(value?: string | null) {
  if (!value) return "No GPS update yet";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Location time unavailable" : date.toLocaleString();
}

function statusLabel(status: Shipment["status"]) {
  return {
    PREPARING: "Awaiting driver",
    IN_TRANSIT: "In transit",
    DELIVERED: "Delivered",
    DELAYED: "Delayed",
  }[status];
}

export default function GoodsTrackerPage() {
  const { data: session } = useSession();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [assignments, setAssignments] = useState<AssignmentOption[]>([]);
  const [inventory, setInventory] = useState<InventoryOption[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [trackingShipmentId, setTrackingShipmentId] = useState<string | null>(null);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [newShipmentOpen, setNewShipmentOpen] = useState(false);
  const [assignmentId, setAssignmentId] = useState("");
  const [inventoryItemId, setInventoryItemId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [destination, setDestination] = useState("");
  const [lastGpsError, setLastGpsError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);
  const lastSentAt = useRef(0);

  const userRole = session?.user?.role;
  const canCreate = userRole === "ADMINISTRATOR" || userRole === "OPERATIONS_MANAGER";
  const selectedShipment = shipments.find((shipment) => shipment.id === selectedId) ?? null;
  const selectedInventory = inventory.find((item) => item.id === inventoryItemId);

  const loadShipments = useCallback(async () => {
    const response = await fetch("/api/shipments");
    if (!response.ok) throw new Error("Unable to load tracked shipments.");
    const data: unknown = await response.json();
    if (!Array.isArray(data)) throw new Error("The shipment response was invalid.");
    const nextShipments = data as Shipment[];
    setShipments(nextShipments);
    setSelectedId((current) =>
      nextShipments.some((shipment) => shipment.id === current)
        ? current
        : nextShipments[0]?.id ?? "",
    );
  }, []);

  useEffect(() => {
    let active = true;

    async function loadPage() {
      setLoading(true);
      setPageError(null);
      try {
        await loadShipments();
        if (canCreate) {
          const [assignmentResponse, inventoryResponse] = await Promise.all([
            fetch("/api/assignments"),
            fetch("/api/inventory"),
          ]);
          if (!assignmentResponse.ok || !inventoryResponse.ok) {
            throw new Error("Unable to load assignments and inventory for a new shipment.");
          }
          const [assignmentData, inventoryData]: [unknown, unknown] = await Promise.all([
            assignmentResponse.json(),
            inventoryResponse.json(),
          ]);
          if (!Array.isArray(assignmentData) || !Array.isArray(inventoryData)) {
            throw new Error("Assignment or inventory data was invalid.");
          }
          if (!active) return;
          setAssignments(assignmentData as AssignmentOption[]);
          setInventory(inventoryData as InventoryOption[]);
        }
      } catch (error) {
        if (active) setPageError(error instanceof Error ? error.message : "Unable to load tracker.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPage();
    const interval = window.setInterval(() => {
      void loadShipments().catch((error: unknown) => {
        if (active) setPageError(error instanceof Error ? error.message : "Unable to refresh shipment locations.");
      });
    }, 20_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [canCreate, loadShipments]);

  useEffect(() => () => {
    if (watchId.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current);
    }
  }, []);

  const origin = useMemo(() => {
    if (!selectedShipment) return "";
    if (
      typeof selectedShipment.currentLatitude === "number" &&
      typeof selectedShipment.currentLongitude === "number"
    ) {
      return `${selectedShipment.currentLatitude},${selectedShipment.currentLongitude}`;
    }
    return getWarehouseAddress(selectedShipment.inventoryItem);
  }, [selectedShipment]);

  const mapEmbedUrl = useMemo(() => {
    if (
      MAPS_API_KEY &&
      selectedShipment &&
      origin &&
      typeof selectedShipment.currentLatitude === "number" &&
      typeof selectedShipment.currentLongitude === "number"
    ) {
      const params = new URLSearchParams({
        key: MAPS_API_KEY,
        origin,
        destination: selectedShipment.destination,
        mode: "driving",
      });
      return {
        src: `https://www.google.com/maps/embed/v1/directions?${params.toString()}`,
        title: `Google Maps route for ${selectedShipment.inventoryItem?.name || "tracked goods"}`,
        provider: "Google Maps",
      };
    }

    const latitude = selectedShipment?.currentLatitude;
    const longitude = selectedShipment?.currentLongitude;
    const hasLocation = typeof latitude === "number" && typeof longitude === "number";
    const span = hasLocation ? 0.12 : 29.3;
    const centerLat = hasLocation ? latitude : 21.1;
    const centerLon = hasLocation ? longitude : 82.8;
    const params = new URLSearchParams({
      bbox: `${centerLon - span / 2},${centerLat - span / 2},${centerLon + span / 2},${centerLat + span / 2}`,
      layer: "mapnik",
    });
    if (hasLocation) params.set("marker", `${latitude},${longitude}`);
    return {
      src: `https://www.openstreetmap.org/export/embed.html?${params.toString()}`,
      title: hasLocation
        ? `Map showing the latest reported goods location`
        : "Map preview centered on India",
      provider: "OpenStreetMap",
    };
  }, [origin, selectedShipment]);

  const googleMapsUrl = useMemo(() => {
    if (!selectedShipment) return "";
    const params = new URLSearchParams({
      api: "1",
      destination: selectedShipment.destination,
      travelmode: "driving",
    });
    if (origin) params.set("origin", origin);
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }, [origin, selectedShipment]);

  function stopTracking() {
    if (watchId.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setTrackingShipmentId(null);
    setSharingLocation(false);
  }

  function startTracking(shipment: Shipment) {
    setLastGpsError(null);
    setPageError(null);
    if (!navigator.geolocation) {
      setLastGpsError("This browser does not support phone location.");
      return;
    }
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    lastSentAt.current = 0;
    setTrackingShipmentId(shipment.id);
    setSharingLocation(true);

    watchId.current = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();
        if (now - lastSentAt.current < LOCATION_INTERVAL_MS) return;
        lastSentAt.current = now;
        try {
          const response = await fetch(`/api/shipments/${shipment.id}/location`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            }),
          });
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to send GPS update.");
          }
          setLastGpsError(null);
          await loadShipments();
        } catch (error) {
          lastSentAt.current = 0;
          setLastGpsError(error instanceof Error ? error.message : "Failed to send GPS update.");
        }
      },
      (error) => {
        setLastGpsError(error.message || "Location access was not available.");
        stopTracking();
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 },
    );
  }

  async function createShipment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const response = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId,
          inventoryItemId,
          quantity: Number(quantity),
          destination,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create shipment.");
      setNewShipmentOpen(false);
      setDestination("");
      setQuantity("1");
      await loadShipments();
      setSelectedId(data.id);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to create shipment.");
    } finally {
      setSaving(false);
    }
  }

  async function markDelivered(shipment: Shipment) {
    setPageError(null);
    try {
      const response = await fetch(`/api/shipments/${shipment.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DELIVERED" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update delivery status.");
      if (trackingShipmentId === shipment.id) stopTracking();
      await loadShipments();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not update delivery status.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Goods movement</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Goods Tracker</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Connect an inventory item to an assignment and destination, then share a driver&apos;s phone GPS while the tracker is active.
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setNewShipmentOpen((open) => !open)}>
            <Plus className="mr-2 h-4 w-4" /> {newShipmentOpen ? "Close form" : "Track goods"}
          </Button>
        )}
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
        <p>
          Phone GPS is shared only after the driver starts tracking and grants browser permission. Updates stop when tracking is stopped or this page is closed; this is not background tracking or an emergency service.
        </p>
      </div>

      {pageError && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {pageError}
        </div>
      )}

      {newShipmentOpen && canCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Connect goods to a delivery</CardTitle>
            <CardDescription>
              Select an existing assignment and inventory item. Creating a tracker record does not deduct stock from inventory.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createShipment} className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                Assignment
                <select
                  required
                  value={assignmentId}
                  onChange={(event) => {
                    const selected = assignments.find((item) => item.id === event.target.value);
                    setAssignmentId(event.target.value);
                    if (!destination && selected?.location) setDestination(selected.location);
                  }}
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                >
                  <option value="">Select an assignment</option>
                  {assignments.map((assignment) => (
                    <option key={assignment.id} value={assignment.id}>{assignment.title}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                Goods / inventory item
                <select
                  required
                  value={inventoryItemId}
                  onChange={(event) => setInventoryItemId(event.target.value)}
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                >
                  <option value="">Select inventory goods</option>
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.sku}) · {item.quantity} {item.unit}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                Quantity
                <Input
                  required
                  type="number"
                  min="1"
                  max={selectedInventory?.quantity ?? 100_000}
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                />
              </label>
              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                Delivery destination
                <Input
                  required
                  minLength={3}
                  maxLength={500}
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  placeholder="Enter a destination address"
                />
              </label>
              {formError && <p role="alert" className="text-sm text-red-700 md:col-span-2">{formError}</p>}
              <div className="md:col-span-2">
                <Button type="submit" disabled={saving || !assignments.length || !inventory.length}>
                  {saving ? "Creating tracker..." : "Create shipment tracker"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.8fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Package className="h-5 w-5" /> Tracked goods</CardTitle>
            <CardDescription>Locations refresh every 20 seconds.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-slate-500">Loading shipments...</p>
            ) : shipments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center">
                <Package className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-3 text-sm font-medium text-slate-800">No goods are being tracked yet</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {canCreate ? "Create a tracker to connect an assignment and inventory item." : "An operations manager can create a tracker for an assignment."}
                </p>
              </div>
            ) : (
              shipments.map((shipment) => (
                <button
                  key={shipment.id}
                  type="button"
                  onClick={() => setSelectedId(shipment.id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    selectedId === shipment.id
                      ? "border-blue-300 bg-blue-50 ring-1 ring-blue-100"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{shipment.inventoryItem?.name || "Goods item"}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{shipment.assignment?.title || "Assignment"}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                      shipment.status === "DELIVERED"
                        ? "bg-emerald-100 text-emerald-800"
                        : shipment.status === "IN_TRANSIT"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-100 text-slate-700"
                    }`}>{statusLabel(shipment.status)}</span>
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-600">
                    <MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{shipment.destination}</span>
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Clock3 className="h-3.5 w-3.5 shrink-0" />{formatLocationTime(shipment.lastLocationAt)}
                  </p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg"><Route className="h-5 w-5" /> Route and location</CardTitle>
                <CardDescription className="mt-1">
                  {selectedShipment
                    ? `${selectedShipment.quantity} ${selectedShipment.inventoryItem?.unit || "units"} of ${selectedShipment.inventoryItem?.name || "goods"}`
                    : "Select or create a shipment to view its route."}
                </CardDescription>
              </div>
              {selectedShipment && selectedShipment.status !== "DELIVERED" && (
                <div className="flex flex-wrap gap-2">
                  {trackingShipmentId === selectedShipment.id ? (
                    <Button variant="outline" size="sm" onClick={stopTracking} disabled={!sharingLocation}>
                      <Square className="mr-1.5 h-3.5 w-3.5" /> Stop GPS sharing
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => startTracking(selectedShipment)}
                      disabled={trackingShipmentId !== null}
                    >
                      <Radio className="mr-1.5 h-3.5 w-3.5" /> Start phone GPS
                    </Button>
                  )}
                  {selectedShipment.status === "IN_TRANSIT" && (
                    <Button variant="outline" size="sm" onClick={() => void markDelivered(selectedShipment)}>
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Mark delivered
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedShipment ? (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Last GPS update</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{formatLocationTime(selectedShipment.lastLocationAt)}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Current coordinates</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {selectedShipment.currentLatitude != null && selectedShipment.currentLongitude != null
                        ? `${selectedShipment.currentLatitude.toFixed(5)}, ${selectedShipment.currentLongitude.toFixed(5)}`
                        : "Waiting for driver GPS"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Destination</p>
                    <p className="mt-1 flex items-start gap-1.5 text-sm font-semibold text-slate-900">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />{selectedShipment.destination}
                    </p>
                  </div>
                </div>

                {trackingShipmentId === selectedShipment.id && (
                  <p className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                    <CircleDot className="h-4 w-4 animate-pulse" /> Phone location sharing is active while this page remains open.
                  </p>
                )}
                {lastGpsError && (
                  <p role="alert" className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {lastGpsError}
                  </p>
                )}

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  <iframe
                    title={mapEmbedUrl.title}
                    src={mapEmbedUrl.src}
                    className="h-[360px] w-full border-0 sm:h-[440px]"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    {selectedShipment.currentLatitude != null && selectedShipment.currentLongitude != null
                      ? `${mapEmbedUrl.provider} · GPS accuracy reported by device: about ${Math.round(selectedShipment.locationAccuracy ?? 0)} m`
                      : `${mapEmbedUrl.provider} map preview${selectedShipment.lastLocationAt ? ` · Last update: ${formatLocationTime(selectedShipment.lastLocationAt)}` : " · Live location appears after the driver starts sharing GPS"}`}
                  </p>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-blue-700 hover:text-blue-900"
                  >
                    Open directions in Google Maps
                  </a>
                </div>
              </>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <iframe
                  title={mapEmbedUrl.title}
                  src={mapEmbedUrl.src}
                  className="h-[300px] w-full border-0 sm:h-[380px]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
