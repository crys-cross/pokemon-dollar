// reserved for mocks
// TODO: fix localhost deployment vs others
// deploy mockv3agreggator(ETHUSDPricefeed, BTCUSDPriceFeed)
// deploy erc20mock(eth, btc)(deployed only on localhost) TODO:
// mock guide: https://github.com/PatrickAlphaC/hardhat-fund-me-fcc
// https://github.com/wighawag/hardhat-deploy#creating-fixtures

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { networkConfig } from "../helper-hardhat-config";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  // code here
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  let ethUsdPriceFeed, btcUsdPriceFeed, wethMock, wbtcMock;

  // from:
  // https://github.com/Cyfrin/foundry-defi-stablecoin-f23/blob/main/script/HelperConfig.s.sol

  // deploy ERC20Mocksonly on localhost
  if (chainId === 31337) {
    const args1: any[] = [
      networkConfig[network.config.chainId!]["DECIMALS"],
      networkConfig[network.config.chainId!]["ETH_USD_PRICE"],
    ];
    ethUsdPriceFeed = await deploy("MockV3Aggregator", {
      from: deployer,
      log: true,
      args: args1,
      // waitConfirmations: waitBlockConfirmations,
    });

    const args2: any[] = ["WETH", "WETH", deployer, 1000e8];
    wethMock = await deploy("ERC20Mock", {
      from: deployer,
      log: true,
      args: args2,
      // waitConfirmations: waitBlockConfirmations,
    });

    const args3: any[] = [
      networkConfig[network.config.chainId!]["DECIMALS"],
      networkConfig[network.config.chainId!]["BTC_USD_PRICE"],
    ];
    btcUsdPriceFeed = await deploy("MockV3Aggregator", {
      from: deployer,
      log: true,
      args: args3,
      // waitConfirmations: waitBlockConfirmations,
    });

    const args4: any[] = ["WBTC", "WBTC", deployer, 1000e8];
    wbtcMock = await deploy("ERC20Mock", {
      from: deployer,
      log: true,
      args: args4,
      // waitConfirmations: waitBlockConfirmations,
    });
  } else {
    console.log("Not on localhost, no Mocks needed");
  }

  //    // Verify the deployment
  //    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
  //     log("Verifying...")
  //     await verify(lotteryTrio.address, args)
  // }
};
export default func;
func.tags = ["all", "mock"];

// https://github.com/wighawag/hardhat-deploy/tree/master#npm-install-hardhat-deploy
