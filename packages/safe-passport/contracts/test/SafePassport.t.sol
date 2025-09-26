// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {SafePassport} from "../src/SafePassport.sol";
import {MockIdentityVerificationHub} from "../src/mocks/MockIdentityVerificationHub.sol";
import {ISelfVerificationRoot} from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";
import {MockRIARegistry} from "../src/mocks/MockRIARegistry.sol";

contract SafePassportTest {
    SafePassport internal passport;
    MockIdentityVerificationHub internal hub;
    MockRIARegistry internal ria;

    address internal user = address(0xBEEF);

    function setUp() public {
        hub = new MockIdentityVerificationHub();
        ria = new MockRIARegistry();
        // Dummy config IDs for client and PM flows
        bytes32 clientCfg = bytes32(uint256(1));
        bytes32 pmCfg = bytes32(uint256(2));
        passport = new SafePassport(address(hub), /*scope*/0, clientCfg, pmCfg);
        passport.setRiaRegistry(address(ria));
    }

    function _mkOutput(string memory nationality, uint256 olderThan, bool[3] memory ofac) internal view returns (ISelfVerificationRoot.GenericDiscloseOutputV2 memory output) {
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

    function _encodeUserData(uint8 action, bytes32 accessCode) internal pure returns (bytes memory data) {
        data = new bytes(33);
        data[0] = bytes1(action);
        assembly {
            mstore(add(data, 33), accessCode)
        }
    }

    function testClientVerify() public {
        setUp();
        bool[3] memory ofac = [bool(true), false, false];
        ISelfVerificationRoot.GenericDiscloseOutputV2 memory outp = _mkOutput("DEU", 18, ofac);
        bytes memory userData = _encodeUserData(1, bytes32(0));
        hub.submitVerification(address(passport), outp, userData);
        require(passport.clientVerified(user), "client not verified");
        require(keccak256(bytes(passport.lastNationality(user))) == keccak256(bytes("DEU")), "nat mismatch");
    }

    function testPmVerify() public {
        setUp();
        bool[3] memory ofac = [bool(true), false, false];
        ISelfVerificationRoot.GenericDiscloseOutputV2 memory outp = _mkOutput("IND", 18, ofac);
        bytes memory userData = _encodeUserData(2, bytes32(0));
        // Without certification should revert
        try hub.submitVerification(address(passport), outp, userData) {
            revert("expected revert");
        } catch {}
        // Now certify and try again
        ria.setCertified(user, true);
        hub.submitVerification(address(passport), outp, userData);
        require(passport.pmVerified(user), "pm not verified");
        require(keccak256(bytes(passport.lastNationality(user))) == keccak256(bytes("IND")), "nat mismatch");
    }
}
