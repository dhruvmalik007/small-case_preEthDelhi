// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @title ChainConfig
/// @notice Centralized addresses for Uniswap v4 on supported networks
/// @dev Values sourced from https://docs.uniswap.org/contracts/v4/deployments (accessed during ETHGlobal New Delhi)
library ChainConfig {
    struct V4Addresses {
        address poolManager;
        address positionManager;
        address quoter;
        address stateView;
        address universalRouter;
        address permit2;
    }

    // Chain IDs
    uint256 internal constant CHAINID_SEPOLIA = 11155111;
    uint256 internal constant CHAINID_UNICHAIN_SEPOLIA = 1301;

    /// @notice Get Uniswap v4 core/periphery addresses for a chainId
    function get(uint256 chainId) internal pure returns (V4Addresses memory a) {
        if (chainId == CHAINID_UNICHAIN_SEPOLIA) {
            // Unichain Sepolia: 1301
            //PoolManager	0x00b036b58a818b1bc34d502d3fe730db729e62ac
            //Universal Router	0xf70536b3bcc1bd1a972dc186a2cf84cc6da6be5d
            //PositionManager	0xf969aee60879c54baaed9f3ed26147db216fd664
            //StateView	0xc199f1072a74d4e905aba1a84d9a45e2546b6222
            //Quoter	0x56dcd40a3f2d466f48e7f48bdbe5cc9b92ae4472
            //PoolSwapTest	0x9140a78c1a137c7ff1c151ec8231272af78a99a4
            //PoolModifyLiquidityTest	0x5fa728c0a5cfd51bee4b060773f50554c0c8a7ab
            //Permit2	0x000000000022D473030F116dDEE9F6B43aC78BA3
            a = V4Addresses({
                poolManager: 0x00B036B58a818B1BC34d502D3fE730Db729e62AC,
                positionManager: 0xf969Aee60879C54bAAed9F3eD26147Db216Fd664,
                quoter: 0x56DCD40A3F2d466F48e7F48bDBE5Cc9B92Ae4472,
                stateView: 0xc199F1072a74D4e905ABa1A84d9a45E2546B6222,
                universalRouter: 0xf70536B3bcC1bD1a972dc186A2cf84cC6da6Be5D,
                permit2: 0x000000000022D473030F116dDEE9F6B43aC78BA3
            });
        } else if (chainId == CHAINID_SEPOLIA) {
            // Sepolia: 11155111 (Base Sepolia sample values used where applicable)

            //PoolManager	0xE03A1074c86CFeDd5C142C4F04F1a1536e203543
            //Universal Router	0x3A9D48AB9751398BbFa63ad67599Bb04e4BdF98b
            //PositionManager	0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4
            //StateView	0xe1dd9c3fa50edb962e442f60dfbc432e24537e4c
            //Quoter	0x61b3f2011a92d183c7dbadbda940a7555ccf9227
            //PoolSwapTest	0x9b6b46e2c869aa39918db7f52f5557fe577b6eee
            //PoolModifyLiquidityTest	0x0c478023803a644c94c4ce1c1e7b9a087e411b0a
            //Permit2	0x000000000022D473030F116dDEE9F6B43aC78BA3


            a = V4Addresses({
                poolManager: 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543,
                positionManager: 0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4,
                quoter: 0x61B3f2011A92d183C7dbaDBdA940a7555Ccf9227,
                stateView: 0xE1Dd9c3fA50EDB962E442f60DfBc432e24537E4C,
                universalRouter: 0x3A9D48AB9751398BbFa63ad67599Bb04e4BdF98b,
                permit2: 0x000000000022D473030F116dDEE9F6B43aC78BA3
            });
        } else {
            revert("ChainConfig: unsupported chainId");
        }
    }
}
