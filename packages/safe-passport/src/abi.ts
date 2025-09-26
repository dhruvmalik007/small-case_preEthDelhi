import { Abi } from 'viem';

export const SAFE_PASSPORT_ABI: Abi = [
  {
    "type": "constructor",
    "inputs": [
      { "name": "identityVerificationHubV2", "type": "address", "internalType": "address" },
      { "name": "scope_", "type": "uint256", "internalType": "uint256" },
      { "name": "clientConfigId", "type": "bytes32", "internalType": "bytes32" },
      { "name": "pmConfigId", "type": "bytes32", "internalType": "bytes32" }
    ],
    "stateMutability": "nonpayable"
  },
  { "type": "function", "name": "clientVerificationConfigId", "inputs": [], "outputs": [{"type":"bytes32"}], "stateMutability": "view" },
  { "type": "function", "name": "pmVerificationConfigId", "inputs": [], "outputs": [{"type":"bytes32"}], "stateMutability": "view" },
  { "type": "function", "name": "clientVerified", "inputs": [{"name":"","type":"address"}], "outputs": [{"type":"bool"}], "stateMutability": "view" },
  { "type": "function", "name": "pmVerified", "inputs": [{"name":"","type":"address"}], "outputs": [{"type":"bool"}], "stateMutability": "view" },
  { "type": "function", "name": "lastNationality", "inputs": [{"name":"","type":"address"}], "outputs": [{"type":"string"}], "stateMutability": "view" },
  { "type": "function", "name": "lastUserData", "inputs": [{"name":"","type":"address"}], "outputs": [{"type":"bytes"}], "stateMutability": "view" },
  { "type": "function", "name": "setConfigIds", "inputs": [{"name":"clientConfigId","type":"bytes32"},{"name":"pmConfigId","type":"bytes32"}], "outputs": [], "stateMutability": "nonpayable" },
  { "type": "function", "name": "setScope", "inputs": [{"name":"newScope","type":"uint256"}], "outputs": [], "stateMutability": "nonpayable" },
  { "type": "event", "name": "ClientVerified", "inputs": [{"name":"user","type":"address","indexed":true},{"name":"nationality","type":"string","indexed":false}], "anonymous": false },
  { "type": "event", "name": "PMVerified", "inputs": [{"name":"user","type":"address","indexed":true},{"name":"nationality","type":"string","indexed":false}], "anonymous": false },
  { "type": "event", "name": "ConfigIdsUpdated", "inputs": [{"name":"clientConfigId","type":"bytes32","indexed":false},{"name":"pmConfigId","type":"bytes32","indexed":false}], "anonymous": false },
  { "type": "event", "name": "ScopeUpdated", "inputs": [{"name":"scope","type":"uint256","indexed":false}], "anonymous": false }
];
