import { DEFAULT_MIN_AGE, DEFAULT_ENDPOINT_TYPE, ACTION, ZERO_BYTES32, type EndpointType } from './constants';
import { encodeUserData } from './encoding';
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
    scope: 'safe-passport',
    userId,
    disclosures,
    userDefinedData,
  } as const;
}

/**
 * Build a full Self app config for the Investor flow (Client verify)
 * Server-safe utility for API routes to return a JSON configuration.
 */
export function buildInvestorSelfConfig(params: {
  contractAddress: `0x${string}`;
  investorAddress: `0x${string}`;
  endpointType?: EndpointType;
  minimumAge?: number;
  accessCode?: `0x${string}`;
}) {
  const { contractAddress, investorAddress, endpointType, minimumAge = DEFAULT_MIN_AGE, accessCode = ZERO_BYTES32 } = params;
  const disclosures = getClientDisclosures({ minimumAge, requireNationality: true });
  const userDefinedData = encodeUserData(ACTION.CLIENT_VERIFY, accessCode);
  return buildFrontendConfig({
    contractAddress,
    userId: investorAddress,
    endpointType,
    disclosures,
    userDefinedData,
  });
}

/**
 * Build a full Self app config for the Portfolio Manager flow (PM verify)
 */
export function buildPmSelfConfig(params: {
  contractAddress: `0x${string}`;
  pmAddress: `0x${string}`;
  endpointType?: EndpointType;
  excludedCountries?: string[];
  accessCode?: `0x${string}`;
}) {
  const { contractAddress, pmAddress, endpointType, excludedCountries = [], accessCode = ZERO_BYTES32 } = params;
  const disclosures = getPmDisclosures({ excludedCountries, requireNationality: true, requireIssuingState: true });
  const userDefinedData = encodeUserData(ACTION.PM_VERIFY, accessCode);
  return buildFrontendConfig({
    contractAddress,
    userId: pmAddress,
    endpointType,
    disclosures,
    userDefinedData,
  });
}
