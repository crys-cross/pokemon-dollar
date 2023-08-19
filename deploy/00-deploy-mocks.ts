// reserved for mocks
// deploy mockv3agreggator(ETHUSDPricefeed, BTCUSDPriceFeed)
// deploy erc20mock(eth, btc)
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { networkConfig } from "../helper-hardhat-config";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  // code here
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  const args1: any[] = [
    networkConfig[network.config.chainId!]["DECIMALS"],
    networkConfig[network.config.chainId!]["ETH_USD_PRICE"],
    // address _pdAddress
  ];
  const mockV3Aggregator = await deploy("MockV3Aggregator", {
    from: deployer,
    log: true,
    args: args1,
    // waitConfirmations: waitBlockConfirmations,
  });

  //    // Verify the deployment
  //    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
  //     log("Verifying...")
  //     await verify(lotteryTrio.address, args)
  // }
};
export default func;
func.tags = ["all", "mock"];

// https://github.com/wighawag/hardhat-deploy/tree/master#npm-install-hardhat-deploy
