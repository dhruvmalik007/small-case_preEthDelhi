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

    /// @notice Simple pool metadata for curated pools per chain
    struct PoolMeta {
        address token0;
        address token1;
        uint24 fee;         // 500, 3000, 10000 etc.
        int24 tickSpacing;  // e.g., 10/60/200
    }

    // Chain IDs
    uint256 internal constant CHAINID_SEPOLIA = 11155111;
    uint256 internal constant CHAINID_UNICHAIN_SEPOLIA = 1301;
    uint256 internal constant CHAINID_UNICHAIN_MAINNET = 130;

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
        } else if (chainId == CHAINID_UNICHAIN_MAINNET) {
            // Unichain Mainnet: 130
            // Source: Unichain Docs - Contract Addresses (v4 deployments)
            a = V4Addresses({
                poolManager: 0x1F98400000000000000000000000000000000004,
                positionManager: 0x4529A01c7A0410167c5740C487A8DE60232617bf,
                quoter: 0x333E3C607B141b18fF6de9f258db6e77fE7491E0,
                stateView: 0x86e8631A016F9068C3f085fAF484Ee3F5fDee8f2,
                universalRouter: 0xEf740bf23aCaE26f6492B10de645D6B98dC8Eaf3,
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

    /// @notice Curated default pools on given chain (tokens must be ERC20 deployed on the chain)
    /// @dev For Unichain Sepolia we include WETH/USDC 0.3% with tickSpacing=60.
    ///      For Unichain Mainnet include ETH/USDC v4 0.05% using canonical addresses.
    function getDefaultPools(uint256 chainId) internal pure returns (PoolMeta[] memory p) {
        if (chainId == CHAINID_UNICHAIN_SEPOLIA) {
            // Canonical tokens from Unichain docs
            address WETH = 0x4200000000000000000000000000000000000006;
            address USDC = 0x31d0220469e10c4E71834a79b1f276d740d3768F;
            p = new PoolMeta[](1);
            // Ensure token ordering token0 < token1 lexicographically (addresses)
            (address t0, address t1) = WETH < USDC ? (WETH, USDC) : (USDC, WETH);
            p[0] = PoolMeta({ token0: t0, token1: t1, fee: uint24(3000), tickSpacing: int24(60) });
        } else if (chainId == CHAINID_UNICHAIN_MAINNET) {
            // Unichain mainnet: use WETH-like canonical wrapper for ETH if needed.
            // ETH/USDC v4 0.05% (tickSpacing ~ 10 in v3; v4 mirrors this mapping)
            // USDC from Unichain docs (mainnet)
            address USDC_MAIN = 0x078D782b760474a361dDA0AF3839290b0EF57AD6;
            // Wrapped native on many OP-stack chains: 0x420000...0006. If Unichain differs, update here.
            address WETH_LIKE = 0x4200000000000000000000000000000000000006;
            p = new PoolMeta[](1);
            (address t0m, address t1m) = WETH_LIKE < USDC_MAIN ? (WETH_LIKE, USDC_MAIN) : (USDC_MAIN, WETH_LIKE);
            p[0] = PoolMeta({ token0: t0m, token1: t1m, fee: uint24(500), tickSpacing: int24(10) });
        } else if (chainId == CHAINID_SEPOLIA) {
            p = new PoolMeta[](0);
        } else {
            revert("ChainConfig: unsupported chainId");
        }
    }

    /// @notice Curated v4 pool identifiers (as displayed by Uniswap app) by chain
    /// @dev Example for Unichain Mainnet: ETH/USDC v4 0.05% poolId scraped from app
    function getCuratedPoolIds(uint256 chainId) internal pure returns (bytes32[] memory ids) {
        if (chainId == CHAINID_UNICHAIN_MAINNET) {
            ids = new bytes32[](1);
            ids[0] = 0x3258f413c7a88cda2fa8709a589d221a80f6574f63df5a5b6774485d8acc39d9; // ETH/USDC 0.05%
        } else if (chainId == CHAINID_UNICHAIN_SEPOLIA) {
            ids = new bytes32[](0);
        } else if (chainId == CHAINID_SEPOLIA) {
            ids = new bytes32[](0);
        } else {
            revert("ChainConfig: unsupported chainId");
        }
    }
}
