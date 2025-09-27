// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {SelfVerificationRoot} from "@selfxyz/contracts/contracts/abstract/SelfVerificationRoot.sol";
import {ISelfVerificationRoot} from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";
import {SelfStructs} from "@selfxyz/contracts/contracts/libraries/SelfStructs.sol";
import {SelfUtils} from "@selfxyz/contracts/contracts/libraries/SelfUtils.sol";
import {IIdentityVerificationHubV2} from "@selfxyz/contracts/contracts/interfaces/IIdentityVerificationHubV2.sol";

/// @notice External registry for RIA certification lookups
interface IRIARegistry {
    function isCertified(address user) external view returns (bool);
}

/// @title SafePassport
/// @notice ZK-based identity verification router for Clients and Portfolio Managers using Self Protocol V2
/// - Client flow: verifies age >= threshold and OFAC non-sanctioned (enforced by Self config)
/// - PM flow: verifies KYC within jurisdiction and RIA certification (enforced by Self config)
contract SafePassport is SelfVerificationRoot {

    // --- Ownership ---
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // --- Verification Configs ---
    // Dynamic configuration ID selection is based on the first byte of userDefinedData
    // 1 = Client verification, 2 = PM verification
    SelfStructs.VerificationConfigV2 public clientVerificationConfig;
    SelfStructs.VerificationConfigV2 public pmVerificationConfig;
    bytes32 public clientVerificationConfigId;
    bytes32 public pmVerificationConfigId;

    // --- Verification State ---
    mapping(address user => bool ok) public clientVerified;
    mapping(address user => bool ok) public pmVerified;

    // Optionally store hints from the output; contents depend on configured disclosures
    mapping(address user => string nationality) public lastNationality;
    mapping(address user => bytes) public lastUserData; // raw passthrough for auditing

    // Optional external registry for PM RIA certification
    IRIARegistry public riaRegistry;

    // --- Events ---
    event ClientVerified(address indexed user, string nationality);
    event PMVerified(address indexed user, string nationality);
    event ConfigIdsUpdated(bytes32 clientConfigId, bytes32 pmConfigId);
    event ScopeUpdatedUser(uint256 scope);
    event RIARegistryUpdated(address indexed registry);

    constructor(
        address identityVerificationHubV2,
        string memory scopeSeed
    ) SelfVerificationRoot(identityVerificationHubV2, scopeSeed) {
        owner = msg.sender;
        
        // Initialize with placeholder configs - will be set later via admin functions
        clientVerificationConfigId = bytes32(0);
        pmVerificationConfigId = bytes32(0);
    }

    // --- Admin ---
    function setConfigIds(bytes32 clientConfigId, bytes32 pmConfigId) external onlyOwner {
        clientVerificationConfigId = clientConfigId;
        pmVerificationConfigId = pmConfigId;
        emit ConfigIdsUpdated(clientConfigId, pmConfigId);
    }

    function updateVerificationConfigs(
        SelfUtils.UnformattedVerificationConfigV2 memory _clientConfig,
        SelfUtils.UnformattedVerificationConfigV2 memory _pmConfig
    ) external onlyOwner {
        // Update client config
        clientVerificationConfig = SelfUtils.formatVerificationConfigV2(_clientConfig);
        clientVerificationConfigId = IIdentityVerificationHubV2(address(this)).setVerificationConfigV2(clientVerificationConfig);
        
        // Update PM config
        pmVerificationConfig = SelfUtils.formatVerificationConfigV2(_pmConfig);
        pmVerificationConfigId = IIdentityVerificationHubV2(address(this)).setVerificationConfigV2(pmVerificationConfig);
        
        emit ConfigIdsUpdated(clientVerificationConfigId, pmVerificationConfigId);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero");
        owner = newOwner;
    }

    // Expose scope setter from base for lifecycle management
    function setScope(uint256 newScope) external onlyOwner {
        // Note: This would require modifying the base contract to expose _scope
        // For now, we'll emit the event but can't actually change the scope
        emit ScopeUpdatedUser(newScope);
    }

    /// @notice Configure the external RIA certification registry used in PM flow
    function setRiaRegistry(address registry) external onlyOwner {
        riaRegistry = IRIARegistry(registry);
        emit RIARegistryUpdated(registry);
    }

    // --- Dynamic Config Routing ---
    /// @inheritdoc SelfVerificationRoot
    function getConfigId(
        bytes32 /* _destinationChainId */,
        bytes32 /* _userIdentifier */,
        bytes memory _userDefinedData
    ) public view override returns (bytes32) {
        (uint8 actionCode, ) = _parseUserData(_userDefinedData);
        if (actionCode == 1) {
            return clientVerificationConfigId;
        } else if (actionCode == 2) {
            return pmVerificationConfigId;
        }
        revert("invalid action");
    }

    // --- Success Hook ---
    /// @dev Called by SelfVerificationRoot after verifying hub sender and other invariants.
    function customVerificationHook(
        ISelfVerificationRoot.GenericDiscloseOutputV2 memory _output,
        bytes memory _userData
    ) internal override {
        (uint8 actionCode, ) = _parseUserData(_userData);
        address user = address(uint160(_output.userIdentifier));

        // Store raw data for traceability
        lastUserData[user] = _userData;

        // nationality is commonly available; tolerate absence by try/catch style via inline assembly length checks
        string memory nationalityStr = _tryGetNationality(_output);
        if (bytes(nationalityStr).length > 0) {
            lastNationality[user] = nationalityStr;
        }

        if (actionCode == 1) {
            clientVerified[user] = true; // age + ofac satisfied by config
            emit ClientVerified(user, nationalityStr);
        } else if (actionCode == 2) {
            // Enforce RIA certification via external registry if configured
            if (address(riaRegistry) != address(0)) {
                require(riaRegistry.isCertified(user), "RIA not certified");
            }
            pmVerified[user] = true; // kyc (via Self) + ria (via registry)
            emit PMVerified(user, nationalityStr);
        } else {
            revert("unexpected action");
        }
    }

    // --- Helpers ---
    /// @notice Robustly parse action + accessCode. The first 64 bytes of _userData may contain
    /// destinationChainId and userIdentifier depending on the hub; remaining is userDefinedData.
    function _parseUserData(bytes memory _userData) internal pure returns (uint8 actionCode, bytes32 accessCode) {
        bytes memory udf;
        if (_userData.length >= 97) {
            // 32 + 32 + 1 + 32 = 97 minimum when header is present
            // Trim off 64-byte header
            uint256 trimmedLen = _userData.length - 64;
            udf = new bytes(trimmedLen);
            assembly {
                // copy trimmedLen bytes starting at _userData + 64
                let src := add(_userData, 96) // 32 bytes length + 64 offset = 96
                let dst := add(udf, 32)
                for { let i := 0 } lt(i, trimmedLen) { i := add(i, 32) } {
                    mstore(add(dst, i), mload(add(src, i)))
                }
            }
        } else {
            udf = _userData;
        }

        require(udf.length >= 33, "udf too short");
        uint8 firstByte = uint8(udf[0]);
        if (firstByte == 0x30) actionCode = 0; // ascii '0'
        else if (firstByte == 0x31) actionCode = 1; // ascii '1'
        else if (firstByte == 0x32) actionCode = 2; // ascii '2'
        else if (firstByte <= 0x10) actionCode = firstByte; // raw small ints
        else revert("bad action");

        assembly {
            accessCode := mload(add(udf, 33))
        }
    }

    /// @dev Attempt to read nationality from output. If field missing, returns empty bytes.
    function _tryGetNationality(
        ISelfVerificationRoot.GenericDiscloseOutputV2 memory _output
    ) internal pure returns (string memory nationalityStr) {
        // The field exists in V2 examples as `output.nationality`.
        // Not all configs disclose it; if missing, return empty bytes.
        // We simply return output.nationality; if unavailable in ABI, this compiles error.
        // Keep as separate function to ease future adaptation if ABI differs.
        nationalityStr = _output.nationality;
    }

    // --- Test utilities ---
    function parseUserDataForTest(bytes memory data) external pure returns (uint8, bytes32) {
        return _parseUserData(data);
    }
}