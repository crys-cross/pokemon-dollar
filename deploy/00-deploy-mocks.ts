// reserved for mocks
// deploy mockv3agreggator(ETHUSDPricefeed, BTCUSDPriceFeed)
// deploy erc20mock(eth, btc)(deployed only on localhost) TODO:

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { networkConfig } from "../helper-hardhat-config";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  // code here
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  // from:
  // https://github.com/Cyfrin/foundry-defi-stablecoin-f23/blob/main/script/HelperConfig.s.sol
  const args1: any[] = [
    networkConfig[network.config.chainId!]["DECIMALS"],
    networkConfig[network.config.chainId!]["ETH_USD_PRICE"],
  ];
  const ethUsdPriceFeed = await deploy("MockV3Aggregator", {
    from: deployer,
    log: true,
    args: args1,
    // waitConfirmations: waitBlockConfirmations,
  });

  const args3: any[] = [
    networkConfig[network.config.chainId!]["DECIMALS"],
    networkConfig[network.config.chainId!]["BTC_USD_PRICE"],
  ];
  const btcUsdPriceFeed = await deploy("MockV3Aggregator", {
    from: deployer,
    log: true,
    args: args3,
    // waitConfirmations: waitBlockConfirmations,
  });

  // deploy ERC20Mocksonly on localhost
  if (chainId === 31337) {
    const args2: any[] = ["WETH", "WETH", deployer, 1000e8];
    const wethMock = await deploy("ERC20Mock", {
      from: deployer,
      log: true,
      args: args2,
      // waitConfirmations: waitBlockConfirmations,
    });

    const args4: any[] = ["WBTC", "WBTC", deployer, 1000e8];
    const wbtcMock = await deploy("ERC20Mock", {
      from: deployer,
      log: true,
      args: args4,
      // waitConfirmations: waitBlockConfirmations,
    });
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
