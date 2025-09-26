import { type ActionCode } from './constants';

/**
 * Encodes userData: 1 byte actionType + 32-byte accessCode
 */
export function encodeUserData(actionType: ActionCode, accessCode: string): `0x${string}` {
  const actionHex = Number(actionType).toString(16).padStart(2, '0');
  const clean = accessCode.replace(/^0x/, '').padStart(64, '0');
  return `0x${actionHex}${clean}` as `0x${string}`;
}

/**
 * Decodes userData payload used in Self Verification V2 dynamic config routing.
 */
export function decodeUserData(userData: `0x${string}`): { actionType: number; accessCode: `0x${string}` } {
  const clean = userData.slice(2);
  const actionType = parseInt(clean.slice(0, 2), 16);
  const accessCode = `0x${clean.slice(2, 66)}` as `0x${string}`;
  return { actionType, accessCode };
}
