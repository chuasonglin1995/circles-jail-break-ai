"use client";

import { useState, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import { Copy, Check, Loader2, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { circlesConfig } from "@/lib/circles";
import { usePaymentWatcher, type PaymentWatchStatus } from "@/hooks/use-payment-watcher";

interface PaymentGateProps {
  claimedTxHashes: Set<string>;
  onPaymentConfirmed: (txHash: string) => void;
  onCancel: () => void;
}

export function PaymentGate({ claimedTxHashes, onPaymentConfirmed, onCancel }: PaymentGateProps) {
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  const recipientAddress = circlesConfig.defaultRecipientAddress;
  const amountCRC = circlesConfig.paymentAmountCRC;

  // Generate Gnosis payment deep link
  const paymentLink = `https://app.gnosis.io/transfer/${recipientAddress}/crc?amount=${amountCRC}`;

  // Generate QR code from payment deep link
  useEffect(() => {
    QRCode.toDataURL(paymentLink, {
      width: 200,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    }).then(setQrCodeDataUrl);
  }, [paymentLink]);

  const { status, payment } = usePaymentWatcher({
    enabled: true,
    recipientAddress,
    claimedTxHashes,
    intervalMs: 3000,
  });

  useEffect(() => {
    if (status === "confirmed" && payment) {
      onPaymentConfirmed(payment.txHash);
    }
  }, [status, payment, onPaymentConfirmed]);

  const handleCopyAddress = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(recipientAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [recipientAddress]);

  const getStatusDisplay = (watchStatus: PaymentWatchStatus) => {
    switch (watchStatus) {
      case "waiting":
        return (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Waiting for payment...</span>
          </div>
        );
      case "confirmed":
        return (
          <div className="flex items-center gap-2 text-sm text-success">
            <Check className="h-4 w-4" />
            <span>Payment confirmed!</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Initializing...</span>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-lg">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Coins className="h-6 w-6 text-primary" />
          </div>

          <h2 className="text-lg font-semibold text-foreground">
            Pay {amountCRC} CRC for 3 messages
          </h2>

          <p className="text-center text-sm text-muted-foreground">
            Scan the QR code or copy the address below. No special note required.
          </p>

          {qrCodeDataUrl ? (
            <div className="rounded-lg border border-border bg-white p-2">
              <img
                src={qrCodeDataUrl}
                alt="Payment QR Code"
                className="h-48 w-48"
              />
            </div>
          ) : (
            <div className="flex h-52 w-52 items-center justify-center rounded-lg border border-border bg-secondary">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          <div className="w-full rounded-lg border border-border bg-secondary p-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Recipient Address
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-foreground break-all">
                {recipientAddress}
              </code>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 shrink-0 p-0"
                onClick={handleCopyAddress}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex w-full items-center justify-center border-t border-border pt-4">
            {getStatusDisplay(status)}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
