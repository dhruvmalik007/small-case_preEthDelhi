"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { SELF_CONFIG, type VerificationStatus } from "../self-config";

// Contract ABI for SafePassport
const SAFE_PASSPORT_ABI = [
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "clientVerified",
    "outputs": [{"name": "ok", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "pmVerified", 
    "outputs": [{"name": "ok", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "lastNationality",
    "outputs": [{"name": "nationality", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "getUserConfig",
    "outputs": [
      {
        "components": [
          {"name": "minAge", "type": "uint256"},
          {"name": "countryRestrictions", "type": "bool[]"},
          {"name": "ofacLevel", "type": "uint256"},
          {"name": "isActive", "type": "bool"}
        ],
        "name": "config",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export function useVerificationStatus() {
  const { address } = useAccount();
  const [status, setStatus] = useState<VerificationStatus>({
    clientVerified: false,
    pmVerified: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Read client verification status
  const { data: clientVerified, refetch: refetchClient } = useReadContract({
    address: SELF_CONFIG.verificationContract as `0x${string}`,
    abi: SAFE_PASSPORT_ABI,
    functionName: "clientVerified",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && SELF_CONFIG.verificationContract !== "0x0000000000000000000000000000000000000000",
    },
  });

  // Read PM verification status
  const { data: pmVerified, refetch: refetchPm } = useReadContract({
    address: SELF_CONFIG.verificationContract as `0x${string}`,
    abi: SAFE_PASSPORT_ABI,
    functionName: "pmVerified",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && SELF_CONFIG.verificationContract !== "0x0000000000000000000000000000000000000000",
    },
  });

  // Read nationality
  const { data: nationality } = useReadContract({
    address: SELF_CONFIG.verificationContract as `0x${string}`,
    abi: SAFE_PASSPORT_ABI,
    functionName: "lastNationality",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && SELF_CONFIG.verificationContract !== "0x0000000000000000000000000000000000000000",
    },
  });

  // Read user config
  const { data: userConfig } = useReadContract({
    address: SELF_CONFIG.verificationContract as `0x${string}`,
    abi: SAFE_PASSPORT_ABI,
    functionName: "getUserConfig",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && SELF_CONFIG.verificationContract !== "0x0000000000000000000000000000000000000000",
    },
  });

  useEffect(() => {
    if (!address) {
      setStatus({
        clientVerified: false,
        pmVerified: false,
      });
      setLoading(false);
      return;
    }

    if (SELF_CONFIG.verificationContract === "0x0000000000000000000000000000000000000000") {
      setError("Contract not deployed. Please deploy the SafePassport contract first.");
      setLoading(false);
      return;
    }

    setStatus({
      clientVerified: clientVerified || false,
      pmVerified: pmVerified || false,
      nationality: nationality || undefined,
      lastVerified: Date.now(),
    });
    setLoading(false);
  }, [address, clientVerified, pmVerified, nationality]);

  const refetch = async () => {
    setLoading(true);
    try {
      await Promise.all([refetchClient(), refetchPm()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch verification status");
    } finally {
      setLoading(false);
    }
  };

  return {
    status,
    loading,
    error,
    refetch,
    userConfig,
  };
}
