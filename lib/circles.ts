const DEFAULT_CIRCLES_RPC_URL = "https://rpc.aboutcircles.com/";
const DEFAULT_RECIPIENT_ADDRESS = "0x7B8a5a4673fcd082b742304032eA49D6bC6e01f5";

export type CirclesTransferEvent = {
  transactionHash: string;
  from: string;
  to: string;
  amount: string;
  blockNumber: string;
  timestamp: string;
  transactionIndex: string;
  logIndex: string;
};

export const circlesConfig = {
  rpcUrl: process.env.NEXT_PUBLIC_CIRCLES_RPC_URL || DEFAULT_CIRCLES_RPC_URL,
  defaultRecipientAddress:
    process.env.NEXT_PUBLIC_PAYMENT_RECIPIENT_ADDRESS ||
    DEFAULT_RECIPIENT_ADDRESS,
  paymentAmountCRC: Number(process.env.NEXT_PUBLIC_PAYMENT_AMOUNT_CRC) || 1,
};

async function queryRecentTransfers(
  recipientAddress: string,
  limit: number = 50
): Promise<CirclesTransferEvent[]> {
  // Address MUST be lowercase for query to match
  const normalizedAddress = recipientAddress.toLowerCase();

  const body = {
    jsonrpc: "2.0",
    id: 1,
    method: "circles_query",
    params: [{
      Namespace: "V_CrcV2",
      Table: "Transfers",
      Columns: ["blockNumber", "timestamp", "transactionHash", "from", "to", "value"],
      Filter: [{
        Type: "FilterPredicate",
        FilterType: "Equals",
        Column: "to",
        Value: normalizedAddress
      }],
      Order: [{ Column: "blockNumber", SortOrder: "DESC" }],
      Limit: limit
    }]
  };

  const response = await fetch(circlesConfig.rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`circles_query failed: ${response.status}`);
  }

  const payload = await response.json();
  if (payload.error) {
    throw new Error(payload.error.message);
  }

  // Map rows to CirclesTransferEvent
  // Result format: { columns: [...], rows: [[val1, val2, ...], ...] }
  const { columns, rows } = payload.result || { columns: [], rows: [] };

  return rows.map((row: unknown[]) => ({
    blockNumber: String(row[0] ?? ""),
    timestamp: String(row[1] ?? ""),
    transactionHash: String(row[2] ?? ""),
    from: String(row[3] ?? ""),
    to: String(row[4] ?? ""),
    amount: String(row[5] ?? "0"),
    transactionIndex: "",
    logIndex: ""
  }));
}

export async function fetchTransferEvents(
  recipientAddress: string
): Promise<CirclesTransferEvent[]> {
  if (!recipientAddress) return [];
  return queryRecentTransfers(recipientAddress);
}

function normalizeString(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeAddress(value: string): string | null {
  const trimmed = normalizeString(value);
  if (!trimmed) return null;
  return trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
}

function addressesMatch(a: string, b: string): boolean {
  const left = normalizeAddress(a);
  const right = normalizeAddress(b);
  return Boolean(left && right && left === right);
}

/**
 * Check for recent unclaimed payments to the recipient address.
 * Returns the first valid payment found that hasn't been claimed yet.
 */
export async function checkRecentPayment(
  recipientAddress: string,
  claimedTxHashes: Set<string>,
  maxAgeMs: number = 300000 // 5 minutes
): Promise<{ txHash: string; from: string; timestamp: string } | null> {
  const events = await fetchTransferEvents(recipientAddress);
  const now = Date.now();

  for (const event of events) {
    // Skip already claimed transactions
    if (claimedTxHashes.has(event.transactionHash)) continue;

    // Check age (within maxAgeMs)
    const eventTime = Number(event.timestamp) * 1000; // Unix seconds to ms
    if (now - eventTime > maxAgeMs) continue;

    // Check recipient matches
    if (!addressesMatch(event.to, recipientAddress)) continue;

    // Found valid unclaimed payment
    return {
      txHash: event.transactionHash,
      from: event.from,
      timestamp: event.timestamp
    };
  }

  return null;
}
