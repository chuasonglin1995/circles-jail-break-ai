"use client";

import { useEffect, useState, useRef } from "react";
import { checkRecentPayment } from "@/lib/circles";

export type PaymentWatchStatus = "idle" | "waiting" | "confirmed" | "error";

export type PaymentResult = {
  txHash: string;
  from: string;
  timestamp: string;
};

interface PaymentWatchOptions {
  enabled: boolean;
  recipientAddress: string;
  claimedTxHashes: Set<string>;
  intervalMs?: number;
}

export function usePaymentWatcher({
  enabled,
  recipientAddress,
  claimedTxHashes,
  intervalMs = 3000
}: PaymentWatchOptions) {
  const [status, setStatus] = useState<PaymentWatchStatus>("idle");
  const [payment, setPayment] = useState<PaymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use ref to track claimedTxHashes to avoid re-triggering effect on every render
  const claimedRef = useRef(claimedTxHashes);
  claimedRef.current = claimedTxHashes;

  useEffect(() => {
    setPayment(null);
    setError(null);

    if (!enabled || !recipientAddress) {
      setStatus("idle");
      return;
    }

    let cancelled = false;
    let timeoutId: NodeJS.Timeout | null = null;

    const poll = async () => {
      if (cancelled) return;
      setStatus((prev) => (prev === "confirmed" ? prev : "waiting"));

      try {
        const found = await checkRecentPayment(
          recipientAddress,
          claimedRef.current
        );

        if (cancelled) return;

        if (found) {
          setPayment(found);
          setStatus("confirmed");
          return;
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Payment check error:", err);
        // Keep polling on error, don't set error state unless repeated failures
      }

      if (!cancelled) {
        timeoutId = setTimeout(poll, intervalMs);
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [enabled, recipientAddress, intervalMs]);

  return { status, payment, error };
}
