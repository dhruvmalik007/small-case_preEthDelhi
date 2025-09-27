import { Abi } from 'viem';

export const SAFE_PASSPORT_ABI: Abi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_hubAddress', type: 'address' },
      { name: '_scope', type: 'uint256' },
      { name: '_clientConfigId', type: 'bytes32' },
      { name: '_pmConfigId', type: 'bytes32' },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'function', name: 'owner', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' },
  { type: 'function', name: 'clientVerificationConfigId', inputs: [], outputs: [{ type: 'bytes32' }], stateMutability: 'view' },
  { type: 'function', name: 'pmVerificationConfigId', inputs: [], outputs: [{ type: 'bytes32' }], stateMutability: 'view' },
  { type: 'function', name: 'clientVerified', inputs: [{ name: '', type: 'address' }], outputs: [{ type: 'bool' }], stateMutability: 'view' },
  { type: 'function', name: 'pmVerified', inputs: [{ name: '', type: 'address' }], outputs: [{ type: 'bool' }], stateMutability: 'view' },
  { type: 'function', name: 'lastNationality', inputs: [{ name: '', type: 'address' }], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { type: 'function', name: 'lastUserData', inputs: [{ name: '', type: 'address' }], outputs: [{ type: 'bytes' }], stateMutability: 'view' },
  { type: 'function', name: 'lastVerificationTimestamp', inputs: [{ name: '', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'setConfigIds', inputs: [{ name: '_clientConfigId', type: 'bytes32' }, { name: '_pmConfigId', type: 'bytes32' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'transferOwnership', inputs: [{ name: 'newOwner', type: 'address' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'setScope', inputs: [{ name: 'newScope', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'isClientVerified', inputs: [{ name: 'user', type: 'address' }], outputs: [{ type: 'bool' }], stateMutability: 'view' },
  { type: 'function', name: 'isPMVerified', inputs: [{ name: 'user', type: 'address' }], outputs: [{ type: 'bool' }], stateMutability: 'view' },
  { type: 'function', name: 'getLastVerificationTime', inputs: [{ name: 'user', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'getUserNationality', inputs: [{ name: 'user', type: 'address' }], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { type: 'function', name: 'resetVerification', inputs: [{ name: 'user', type: 'address' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'parseUserDataForTest', inputs: [{ name: 'data', type: 'bytes' }], outputs: [{ name: 'actionType', type: 'uint8' }], stateMutability: 'pure' },
  {
    type: 'event',
    name: 'ClientVerified',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'nationality', type: 'string', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'PMVerified',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'nationality', type: 'string', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ConfigUpdated',
    inputs: [
      { name: 'clientConfigId', type: 'bytes32', indexed: false },
      { name: 'pmConfigId', type: 'bytes32', indexed: false },
    ],
    anonymous: false,
  },
  { type: 'event', name: 'ScopeUpdated', inputs: [{ name: 'newScope', type: 'uint256', indexed: false }], anonymous: false },
];
