// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {SafePassport} from "../src/SafePassport.sol";

contract DeploySafePassport is Script {
    function run() external {
        // Read deployer private key.
        // Set env: PRIVATE_KEY=<hex without 0x> or with 0x prefix.
        uint256 deployerPk = vm.envUint("PRIVATE_KEY");
        console.log("deployerPk", deployerPk);
        address deployer = vm.addr(deployerPk);
        console.log("deployer", deployer);

        vm.startBroadcast(deployerPk);
        // Determine Self hub address
        address hub;
        // Prefer explicit override
        try vm.envAddress("SELF_HUB") returns (address h) { hub = h; } catch {
            // Fallback to known networks from docs
            string memory network = "celo";
            try vm.envString("NETWORK") returns (string memory n) { network = n; } catch {}
            if (keccak256(bytes(network)) == keccak256(bytes("celo"))) {
                hub = 0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF; // CELO mainnet — real passports
            } else {
                // Celo Sepolia testnet — mock passports
                hub = 0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74;
            }
        }

        // Config IDs and scope can be provided via env; default to zero
        bytes32 clientCfg = bytes32(0);
        bytes32 pmCfg = bytes32(0);
        uint256 scope = 0;
        try vm.envBytes32("CLIENT_CFG_ID") returns (bytes32 v) { clientCfg = v; } catch {}
        try vm.envBytes32("PM_CFG_ID") returns (bytes32 v2) { pmCfg = v2; } catch {}
        try vm.envUint("SCOPE") returns (uint256 s) { scope = s; } catch {}

        // Deploy SafePassport
        SafePassport safe = new SafePassport(hub, scope, clientCfg, pmCfg);

        console.log("Deployment complete:");
        console.log("deployer", deployer);
        console.log("hub", hub);
        console.log("safe", address(safe));
        console.log("scope", scope);
        console.log("clientCfg:");
        console.logBytes32(clientCfg);
        console.log("pmCfg:");
        console.logBytes32(pmCfg);

        vm.stopBroadcast();
    }
    
}
