"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, RefreshCw, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import type { WebhookEndpoint, WebhookDelivery } from "@/lib/db/schema";

const VALID_EVENTS = [
  "page.viewed",
  "link.clicked",
  "page.updated",
  "block.created",
  "block.deleted",
] as const;

type ValidEvent = (typeof VALID_EVENTS)[number];

interface NewSecretBanner {
  endpointId: string;
  secret: string;
}

export default function WebhooksPage() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState<ValidEvent[]>(["link.clicked"]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [newSecretBanner, setNewSecretBanner] = useState<NewSecretBanner | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Record<string, WebhookDelivery[]>>({});

  useEffect(() => {
    fetch("/api/webhooks/endpoints")
      .then((r) => r.json())
      .then((data) => {
        setEndpoints(data.endpoints ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (newEvents.length === 0) {
      setCreateError("Select at least one event.");
      return;
    }
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/webhooks/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl, events: newEvents }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error ?? "Failed to create endpoint.");
        return;
      }
      setEndpoints((prev) => [...prev, data]);
      setNewSecretBanner({ endpointId: data.id, secret: data.secret });
      setShowCreate(false);
      setNewUrl("");
      setNewEvents(["link.clicked"]);
    } catch {
      setCreateError("Network error.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(endpointId: string) {
    if (!confirm("Delete this endpoint? This cannot be undone.")) return;
    await fetch(`/api/webhooks/endpoints/${endpointId}`, { method: "DELETE" });
    setEndpoints((prev) => prev.filter((e) => e.id !== endpointId));
    if (expandedId === endpointId) setExpandedId(null);
  }

  async function handleToggle(endpointId: string, isActive: boolean) {
    await fetch(`/api/webhooks/endpoints/${endpointId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setEndpoints((prev) =>
      prev.map((e) => (e.id === endpointId ? { ...e, isActive: !isActive } : e))
    );
  }

  async function handleExpand(endpointId: string) {
    if (expandedId === endpointId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(endpointId);
    if (!deliveries[endpointId]) {
      const res = await fetch(`/api/webhooks/endpoints/${endpointId}`);
      if (res.ok) {
        const data = await res.json();
        setDeliveries((prev) => ({ ...prev, [endpointId]: data.deliveries }));
      }
    }
  }

  async function handleRetry(deliveryId: string) {
    await fetch(`/api/webhooks/deliveries/${deliveryId}/retry`, { method: "POST" });
    // Optimistically show "pending"
    setDeliveries((prev) => {
      const updated: Record<string, WebhookDelivery[]> = {};
      for (const [k, ds] of Object.entries(prev)) {
        updated[k] = ds.map((d) =>
          d.id === deliveryId ? { ...d, statusCode: null, attempts: 0 } : d
        );
      }
      return updated;
    });
  }

  function toggleEvent(event: ValidEvent) {
    setNewEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#292d4c]">Webhooks</h1>
          <p className="mt-1 text-sm text-slate-500">
            Receive real-time events when actions happen on your pages.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-[#5f4dc5] px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          Add endpoint
        </button>
      </div>

      {/* One-time secret banner */}
      {newSecretBanner && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-amber-800">
                Save your webhook secret — it won't be shown again.
              </p>
              <code className="mt-2 block break-all rounded-md bg-amber-100 px-3 py-2 font-mono text-xs text-amber-900">
                {newSecretBanner.secret}
              </code>
            </div>
            <button
              onClick={() => setNewSecretBanner(null)}
              className="flex-shrink-0 text-amber-500 hover:text-amber-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="mb-4 text-base font-semibold text-[#292d4c]">New webhook endpoint</h2>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Endpoint URL</label>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://yourapp.com/webhooks/bio"
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#5f4dc5] focus:outline-none focus:ring-2 focus:ring-[#5f4dc5]/20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Events</label>
              <div className="flex flex-wrap gap-2">
                {VALID_EVENTS.map((event) => (
                  <label
                    key={event}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      newEvents.includes(event)
                        ? "border-[#5f4dc5] bg-[#5f4dc5]/10 text-[#5f4dc5]"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={newEvents.includes(event)}
                      onChange={() => toggleEvent(event)}
                    />
                    {event}
                  </label>
                ))}
              </div>
            </div>

            {createError && <p className="text-sm text-red-500">{createError}</p>}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-[#5f4dc5] px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
              >
                {creating ? "Creating…" : "Create endpoint"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Endpoint list */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : endpoints.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
          <p className="text-sm text-slate-400">No webhook endpoints yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {endpoints.map((endpoint) => (
            <div
              key={endpoint.id}
              className="rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex items-center gap-3 p-4">
                {/* Status dot */}
                <div
                  className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${
                    endpoint.isActive ? "bg-green-400" : "bg-slate-300"
                  }`}
                />

                {/* URL + events */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#292d4c]">
                    {endpoint.url}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {(endpoint.events as string[]).join(", ")}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => handleToggle(endpoint.id, endpoint.isActive)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      endpoint.isActive
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {endpoint.isActive ? "Active" : "Paused"}
                  </button>
                  <button
                    onClick={() => handleExpand(endpoint.id)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    title="View deliveries"
                  >
                    {expandedId === endpoint.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(endpoint.id)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Delivery log */}
              {expandedId === endpoint.id && (
                <div className="border-t border-slate-100">
                  {!deliveries[endpoint.id] ? (
                    <p className="px-4 py-3 text-xs text-slate-400">Loading deliveries…</p>
                  ) : deliveries[endpoint.id].length === 0 ? (
                    <p className="px-4 py-3 text-xs text-slate-400">No deliveries yet.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {deliveries[endpoint.id].map((d) => (
                        <li key={d.id} className="flex items-center gap-3 px-4 py-2.5">
                          {/* Status */}
                          {d.statusCode && d.statusCode >= 200 && d.statusCode < 300 ? (
                            <Check className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                          ) : d.statusCode === null ? (
                            <RefreshCw className="h-3.5 w-3.5 flex-shrink-0 animate-spin text-slate-400" />
                          ) : (
                            <X className="h-3.5 w-3.5 flex-shrink-0 text-red-500" />
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-slate-700">
                              {d.event}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {d.statusCode ? `HTTP ${d.statusCode}` : "Pending"} ·{" "}
                              {new Date(d.createdAt).toLocaleString()}
                            </p>
                          </div>

                          <button
                            onClick={() => handleRetry(d.id)}
                            className="flex-shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            title="Retry"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
