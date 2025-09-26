"use client";

import React, { useMemo, useState } from "react";
import { SelfQRcodeWrapper, SelfAppBuilder } from "@selfxyz/qrcode";
import {
  ACTION,
  ZERO_BYTES32,
  buildFrontendConfig,
  encodeUserData,
  getClientDisclosures,
  getPmDisclosures,
  type EndpointType,
} from "@smallcase_defi/safe-passport";

export type SafePassportWidgetProps = {
  mode: "client" | "pm";
  contractAddress?: `0x${string}`; // fallback to env
  userAddress: `0x${string}`;
  endpointType?: EndpointType; // fallback to env
  accessCode?: `0x${string}`; // optional
  minimumAge?: number; // for client mode (default 18)
  excludedCountries?: string[]; // for pm mode
};

export function SafePassportWidget(props: SafePassportWidgetProps) {
  const {
    mode,
    userAddress,
    contractAddress = process.env.NEXT_PUBLIC_SAFE_PASSPORT_ADDRESS as `0x${string}` | undefined,
    endpointType = (process.env.NEXT_PUBLIC_SELF_ENDPOINT_TYPE as EndpointType | undefined) ?? "staging_celo",
    accessCode = ZERO_BYTES32 as `0x${string}`,
    minimumAge = 18,
    excludedCountries = [],
  } = props;

  const [error, setError] = useState<string | null>(null);

  const disclosures = useMemo(() => {
    if (mode === "client") return getClientDisclosures({ minimumAge, requireNationality: true });
    return getPmDisclosures({ excludedCountries, requireNationality: true, requireIssuingState: true });
  }, [mode, minimumAge, excludedCountries]);

  const action = mode === "client" ? ACTION.CLIENT_VERIFY : ACTION.PM_VERIFY;
  const userDefinedData = encodeUserData(action, accessCode);

  if (!contractAddress) {
    return (
      <div className="rounded-md border p-4 text-sm text-red-600">
        Missing NEXT_PUBLIC_SAFE_PASSPORT_ADDRESS. Set it in your environment.
      </div>
    );
  }

  let selfApp: any = null;
  try {
    const cfg = buildFrontendConfig({
      contractAddress,
      userId: userAddress,
      endpointType,
      disclosures,
      userDefinedData,
    });
    selfApp = new SelfAppBuilder(cfg).build();
  } catch (e: any) {
    if (!error) setError(e?.message || "Failed to build Self app configuration.");
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        Scan the QR code with the Self mobile app to complete verification.
      </div>
      {error ? (
        <div className="rounded-md border p-3 text-sm text-red-600">{error}</div>
      ) : selfApp ? (
        <SelfQRcodeWrapper selfApp={selfApp} size={256} />
      ) : (
        <div className="rounded-md border p-3 text-sm text-muted-foreground">Preparing QR…</div>
      )}
    </div>
  );
}
