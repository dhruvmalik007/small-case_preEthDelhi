// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {ISelfVerificationRoot} from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";
import {SafePassport} from "../src/SafePassport.sol";
import {MockIdentityVerificationHub} from "../src/mocks/MockIdentityVerificationHub.sol";
import {MockRIARegistry} from "../src/mocks/MockRIARegistry.sol";

contract DeployAndSimulate is Script {
    function run() external {
        // Read deployer private key.
        // Set env: PRIVATE_KEY=<hex without 0x> or with 0x prefix.
        uint256 deployerPk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPk);

        // Optional flags
        bool simulate = true; // default simulate in local unless SIMULATE=false
        try vm.envBool("SIMULATE") returns (bool s) { simulate = s; } catch {}

        // Optional user to verify for simulation; default to deployer
        address user = deployer;
        try vm.envAddress("USER") returns (address u) { user = u; } catch {}

        vm.startBroadcast(deployerPk);

        if (simulate) {
            // Local simulation with mocks
            console.log("Running SIMULATION with mocks (no mainnet broadcast)");

            // 1) Deploy mock Hub and RIA registry
            MockIdentityVerificationHub hub = new MockIdentityVerificationHub();
            MockRIARegistry ria = new MockRIARegistry();

            // 2) Deploy SafePassport with placeholder config IDs and scope=0
            bytes32 clientCfg = bytes32(uint256(0x11));
            bytes32 pmCfg = bytes32(uint256(0x22));
            uint256 scope = 0;
            SafePassport safe = new SafePassport(address(hub), scope, clientCfg, pmCfg);

            // 3) Plug RIA registry (required for PM flow)
            safe.setRiaRegistry(address(ria));

            console.log("Deployed mock setup:");
            console.log("hub", address(hub));
            console.log("ria", address(ria));
            console.log("safe", address(safe));

            // 4) Simulate Client verification via mock hub (action = 1)
            ISelfVerificationRoot.GenericDiscloseOutputV2 memory outClient = _mkOutput(
                user,
                "DEU",     // nationality
                18,         // olderThan
                [true, false, false] // ofac: passport, name+dob, name+yob
            );
            bytes memory userDataClient = _encodeUserData(1, bytes32(0));
            hub.submitVerification(address(safe), outClient, userDataClient);
            require(safe.clientVerified(user), "client not verified");

            // 5) Simulate PM verification: first without certification -> should revert
            ISelfVerificationRoot.GenericDiscloseOutputV2 memory outPm = _mkOutput(
                user,
                "IND",
                18,
                [true, false, false]
            );
            bytes memory userDataPm = _encodeUserData(2, bytes32(0));
            // Expect revert due to missing certification; ignore if it reverts
            (bool ok, ) = address(hub).call(abi.encodeWithSelector(
                hub.submitVerification.selector,
                address(safe), outPm, userDataPm
            ));
            require(!ok, "expected revert for uncertified PM");

            // Certify and try again
            ria.setCertified(user, true);
            hub.submitVerification(address(safe), outPm, userDataPm);
            require(safe.pmVerified(user), "pm not verified");

            console.log("Simulation complete");
        } else {
            // Mainnet/production deployment
            // Default Celo mainnet Self IdentityVerificationHub V2 (per docs)
            address hub = 0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF; // CELO mainnet
            try vm.envAddress("SELF_HUB") returns (address h) { hub = h; } catch {}

            // Config IDs and scope can be provided via env; default to zero
            bytes32 clientCfg = bytes32(0);
            bytes32 pmCfg = bytes32(0);
            uint256 scope = 0;
            try vm.envBytes32("CLIENT_CFG_ID") returns (bytes32 v) { clientCfg = v; } catch {}
            try vm.envBytes32("PM_CFG_ID") returns (bytes32 v2) { pmCfg = v2; } catch {}
            try vm.envUint("SCOPE") returns (uint256 s) { scope = s; } catch {}

            SafePassport safe = new SafePassport(hub, scope, clientCfg, pmCfg);

            // Optional RIA registry address
            try vm.envAddress("RIA_REGISTRY") returns (address riaAddr) {
                if (riaAddr != address(0)) {
                    safe.setRiaRegistry(riaAddr);
                }
            } catch {}

            console.log("Mainnet deployment complete:");
            console.log("deployer", deployer);
            console.log("hub", hub);
            console.log("safe", address(safe));
            console.log("scope", scope);
            console.log("clientCfg:");
            console.logBytes32(clientCfg);
            console.log("pmCfg:");
            console.logBytes32(pmCfg);

            console.log("Set these in your web app env:");
            console.log("NEXT_PUBLIC_SAFE_PASSPORT_ADDRESS=%s", toHexString(address(safe)));
            console.log("NEXT_PUBLIC_SELF_ENDPOINT_TYPE=celo");
        }

        vm.stopBroadcast();
    }

    // Helper: encode userData = action (1 byte) + accessCode (32 bytes)
    function _encodeUserData(uint8 action, bytes32 accessCode) internal pure returns (bytes memory data) {
        data = new bytes(33);
        data[0] = bytes1(action);
        assembly {
            mstore(add(data, 33), accessCode)
        }
    }

    function _mkOutput(
        address user,
        string memory nationality,
        uint256 olderThan,
        bool[3] memory ofac
    ) internal pure returns (ISelfVerificationRoot.GenericDiscloseOutputV2 memory output) {
        uint256[4] memory forbiddenCountriesPacked;
        string[] memory nameArr = new string[](3);
        nameArr[0] = "Alice";
        nameArr[1] = "";
        nameArr[2] = "Doe";
        output = ISelfVerificationRoot.GenericDiscloseOutputV2({
            attestationId: bytes32(0),
            userIdentifier: uint256(uint160(user)),
            nullifier: 0,
            forbiddenCountriesListPacked: forbiddenCountriesPacked,
            issuingState: "DEU",
            name: nameArr,
            idNumber: "X1234567",
            nationality: nationality,
            dateOfBirth: "01-01-90",
            gender: "F",
            expiryDate: "01-01-30",
            olderThan: olderThan,
            ofac: ofac
        });
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
