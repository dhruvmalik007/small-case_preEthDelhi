import { DEFAULT_MIN_AGE, DEFAULT_ENDPOINT_TYPE, type EndpointType } from './constants';

/**
 * Frontend helper to build SelfAppBuilder disclosures for Client verification
 * - minimumAge >= 18
 * - ofac check enabled
 * - optional nationality exposure
 */
export function getClientDisclosures(options?: { minimumAge?: number; requireNationality?: boolean }) {
  const { minimumAge = DEFAULT_MIN_AGE, requireNationality = true } = options || {};
  return {
    minimumAge,
    ofac: true,
    nationality: requireNationality,
  } as const;
}

/**
 * Frontend helper to build SelfAppBuilder disclosures for Portfolio Manager (PM)
 * - KYC within jurisdiction (via excludedCountries or allowlist)
 * - RIA Certification disclosure (modeled via a custom attribute; implementation depends on Self config)
 *
 * Note: This returns a shape compatible with SelfAppBuilder; exact keys may require adjustment
 * based on the chosen verification configuration in tools.self.xyz.
 */
export function getPmDisclosures(options?: {
  excludedCountries?: string[];
  requireNationality?: boolean;
  requireIssuingState?: boolean;
}) {
  const { excludedCountries = [], requireNationality = true, requireIssuingState = true } = options || {};
  return {
    excludedCountries,
    nationality: requireNationality,
    issuing_state: requireIssuingState,
  } as const;
}

export function buildFrontendConfig(params: {
  contractAddress: `0x${string}`;
  userId: `0x${string}`;
  endpointType?: EndpointType;
  version?: 1 | 2;
  disclosures: Record<string, any>;
  userDefinedData?: `0x${string}` | string;
}) {
  const { contractAddress, userId, endpointType = DEFAULT_ENDPOINT_TYPE as EndpointType, version = 2, disclosures, userDefinedData = '0x' } = params;
  return {
    endpoint: contractAddress,
    endpointType,
    userIdType: 'hex',
    version,
    appName: 'Safe Passport',
    scope: 'defi-smallcases',
    userId,
    disclosures,
    userDefinedData,
  } as const;
}
