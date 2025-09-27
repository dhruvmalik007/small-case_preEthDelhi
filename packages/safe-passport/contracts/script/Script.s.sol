// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {SafePassport} from "../src/SafePassport.sol";
import {SelfUtils} from "@selfxyz/contracts/contracts/libraries/SelfUtils.sol";

contract DeploySafePassport is Script {
    function run() external {
        // Deployer private key
        uint256 deployerPk = 0x226d232dbf829ca3dab5966f7ba764799091b5757e85b723ada77a89c8190332;
        address deployer = vm.addr(deployerPk);

        vm.startBroadcast(deployerPk);

        // Celo Alfajores testnet Self IdentityVerificationHub V2
        address hub = 0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74;
        
        // Scope seed for Self Protocol (≤31 ASCII bytes as per docs)
        string memory scopeSeed = "defi-smallcases";

        // Deploy SafePassport contract with proper Self Protocol integration
        SafePassport safe = new SafePassport(hub, scopeSeed);

        console.log("Deployment complete:");
        console.log("deployer", deployer);
        console.log("hub", hub);
        console.log("safe", address(safe));
        console.log("scopeSeed", scopeSeed);
        console.log("clientConfigId:");
        console.logBytes32(safe.clientVerificationConfigId());
        console.log("pmConfigId:");
        console.logBytes32(safe.pmVerificationConfigId());

        console.log("Set these in your web app env:");
        console.log("NEXT_PUBLIC_SAFE_PASSPORT_ADDRESS=%s", toHexString(address(safe)));
        console.log("NEXT_PUBLIC_SAFE_PASSPORT_CHAIN_ID=44787");
        console.log("NEXT_PUBLIC_SELF_ENDPOINT_TYPE=staging_celo");

        vm.stopBroadcast();
    }


    // Helper: address to hex string for logging
    function toHexString(address account) internal pure returns (string memory) {
        return toHexString(abi.encodePacked(account));
    }

    function toHexString(bytes memory data) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < data.length; i++) {
            str[2 + i * 2] = alphabet[uint8(data[i] >> 4)];
            str[3 + i * 2] = alphabet[uint8(data[i] & 0x0f)];
        }
        return string(str);
    }
}