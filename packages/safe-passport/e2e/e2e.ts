import { createPublicClient, createWalletClient, http, parseAbi, toHex, zeroAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync } from 'fs';
import path from 'path';

const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
const PRIVATE_KEY = (process.env.PRIVATE_KEY || '').startsWith('0x')
  ? (process.env.PRIVATE_KEY as `0x${string}`)
  : (('0x' + (process.env.PRIVATE_KEY || '')) as `0x${string}`);

async function main() {
  if (!PRIVATE_KEY) {
    throw new Error('Set PRIVATE_KEY env var for an anvil account');
  }

  const account = privateKeyToAccount(PRIVATE_KEY);
  const publicClient = createPublicClient({ transport: http(RPC_URL) });
  const wallet = createWalletClient({ account, transport: http(RPC_URL) });

  // Read artifacts from Foundry build output
  const outDir = path.resolve(__dirname, '../contracts/out');
  const hubJson = JSON.parse(
    readFileSync(path.join(outDir, 'MockIdentityVerificationHub.sol', 'MockIdentityVerificationHub.json'), 'utf-8')
  );
  const safeJson = JSON.parse(
    readFileSync(path.join(outDir, 'SafePassport.sol', 'SafePassport.json'), 'utf-8')
  );

  // Deploy MockIdentityVerificationHub
  const hubHash = await wallet.deployContract({
    abi: hubJson.abi,
    bytecode: hubJson.bytecode.object as `0x${string}`,
    args: [],
  });
  const hubReceipt = await publicClient.waitForTransactionReceipt({ hash: hubHash });
  const hubAddress = hubReceipt.contractAddress!;
  console.log('Mock Hub deployed at', hubAddress);

  // Deploy SafePassport with dummy config IDs
  const clientCfg = '0x' + '11'.padEnd(64, '0');
  const pmCfg = '0x' + '22'.padEnd(64, '0');
  const scope = 0n;
  const safeHash = await wallet.deployContract({
    abi: safeJson.abi,
    bytecode: safeJson.bytecode.object as `0x${string}`,
    args: [hubAddress, scope, clientCfg, pmCfg],
  });
  const safeReceipt = await publicClient.waitForTransactionReceipt({ hash: safeHash });
  const safeAddress = safeReceipt.contractAddress!;
  console.log('SafePassport deployed at', safeAddress);

  // Prepare output struct and userData for client flow (action = 1)
  const nameArr = ['Alice', '', 'Doe'];
  const ofac = [true, false, false] as const;
  const output = {
    attestationId: toHex(0, { size: 32 }),
    userIdentifier: BigInt(account.address),
    nullifier: 0n,
    forbiddenCountriesListPacked: [0n, 0n, 0n, 0n],
    issuingState: 'DEU',
    name: nameArr,
    idNumber: 'X1234567',
    nationality: 'DEU',
    dateOfBirth: '01-01-90',
    gender: 'F',
    expiryDate: '01-01-30',
    olderThan: 18n,
    ofac: [true, false, false] as [boolean, boolean, boolean],
  };

  // userData: action (1 byte) + accessCode (32 bytes)
  const action = 1;
  const accessCode = '0x' + ''.padEnd(64, '0');
  const userData = (('0x' + action.toString(16).padStart(2, '0') + accessCode.slice(2)) as `0x${string}`);

  // Call hub.submitVerification(receiver, output, userData)
  const submitHash = await wallet.writeContract({
    address: hubAddress as `0x${string}`,
    abi: hubJson.abi,
    functionName: 'submitVerification',
    args: [safeAddress, output, userData],
  });
  await publicClient.waitForTransactionReceipt({ hash: submitHash });
  console.log('Submitted verification via mock hub');

  // Read state from SafePassport
  const clientVerified = await publicClient.readContract({
    address: safeAddress as `0x${string}`,
    abi: safeJson.abi,
    functionName: 'clientVerified',
    args: [account.address],
  });
  console.log('clientVerified?', clientVerified);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
