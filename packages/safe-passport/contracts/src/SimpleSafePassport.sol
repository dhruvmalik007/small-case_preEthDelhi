// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {SelfVerificationRoot} from "@selfxyz/contracts/contracts/abstract/SelfVerificationRoot.sol";
import {ISelfVerificationRoot} from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";
import {SelfStructs} from "@selfxyz/contracts/contracts/libraries/SelfStructs.sol";
import {SelfUtils} from "@selfxyz/contracts/contracts/libraries/SelfUtils.sol";
import {IIdentityVerificationHubV2} from "@selfxyz/contracts/contracts/interfaces/IIdentityVerificationHubV2.sol";

/**
 * @title SimpleSafePassport
 * @notice Simple KYC verification contract following Self Protocol basic integration
 * @dev Based on the official Self docs example
 */
contract SimpleSafePassport is SelfVerificationRoot {
    // Verification config
    SelfStructs.VerificationConfigV2 public verificationConfig;
    bytes32 public verificationConfigId;
    
    // User verification status
    mapping(address => bool) public clientVerified;
    mapping(address => string) public lastNationality;
    
    // Events
    event ClientVerified(address indexed user, string nationality);

    constructor(
        address identityVerificationHubV2,
        string memory scopeSeed,
        SelfUtils.UnformattedVerificationConfigV2 memory _verificationConfig
    ) SelfVerificationRoot(identityVerificationHubV2, scopeSeed) {
        // Format and register the verification config
        verificationConfig = SelfUtils.formatVerificationConfigV2(_verificationConfig);
        verificationConfigId = IIdentityVerificationHubV2(identityVerificationHubV2).setVerificationConfigV2(verificationConfig);
    }

    function customVerificationHook(
        ISelfVerificationRoot.GenericDiscloseOutputV2 memory output,
        bytes memory userData
    ) internal override {
        address user = address(uint160(output.userIdentifier));
        
        // Mark user as verified
        clientVerified[user] = true;
        lastNationality[user] = output.nationality;
        emit ClientVerified(user, output.nationality);
    }

    function getConfigId(
        bytes32 /* destinationChainId */,
        bytes32 /* userIdentifier */,
        bytes memory /* userData */
    ) public view override returns (bytes32) {
        return verificationConfigId;
    }
}
