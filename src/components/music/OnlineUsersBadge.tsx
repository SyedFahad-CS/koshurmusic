"use client";

import React, { useState, useEffect } from "react";
import { Headphones } from "lucide-react";

export function OnlineUsersBadge() {
  const [onlineCount, setOnlineCount] = useState<number>(1);

  useEffect(() => {
    // Generate or retrieve persistent tab session ID from sessionStorage
    let sessionId = sessionStorage.getItem("koshur_session_id");
    if (!sessionId) {
      sessionId =
        "sess_" +
        Math.random().toString(36).substring(2, 11) +
        "_" +
        Date.now().toString(36);
      sessionStorage.setItem("koshur_session_id", sessionId);
    }

    const sendHeartbeat = async () => {
      try {
        const res = await fetch("/api/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.count === "number") {
            setOnlineCount(data.count);
          }
        }
      } catch {
        // Fallback: maintain current count gracefully
      }
    };

    // Initial heartbeat ping
    sendHeartbeat();

    // Send periodic heartbeat every 12 seconds
    const interval = setInterval(sendHeartbeat, 12000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className="text-xs font-mono text-emerald-400/90 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-emerald-500/20 shadow-sm select-none"
      title={`${onlineCount} real concurrent listener${onlineCount === 1 ? "" : "s"} online`}
    >
      <Headphones size={13} className="text-emerald-400 shrink-0" />
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span className="tracking-wide font-medium">
        {onlineCount} {onlineCount === 1 ? "LISTENING NOW" : "LISTENING TOGETHER"}
      </span>
    </div>
  );
}
