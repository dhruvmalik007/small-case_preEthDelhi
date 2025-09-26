// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface ISelfReceiver {
    function onVerificationSuccess(bytes memory output, bytes memory userData) external;
}

import {ISelfVerificationRoot} from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";

/// @notice Minimal mock of Self IdentityVerificationHub V2 to relay verification success to receiver
contract MockIdentityVerificationHub {
    function submitVerification(
        address receiver,
        ISelfVerificationRoot.GenericDiscloseOutputV2 calldata output,
        bytes calldata userData
    ) external {
        ISelfReceiver(receiver).onVerificationSuccess(abi.encode(output), userData);
    }
}
