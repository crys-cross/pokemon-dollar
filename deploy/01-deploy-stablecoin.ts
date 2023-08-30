import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { networkConfig, networkConfigInfo } from "../helper-hardhat-config";
import { ethers } from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  // code here
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, log, get } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId!;

  let ethUsdPriceFeed, btcUsdPriceFeed, wethMock, wbtcMock;
  let tokenAddresses: string[] = [];
  let priceFeedAddresses: any[] = [];

  // getting values and addresses based on chainID here
  // if localhost, put mock addresses
  // else put designated addresses based on chainId
  // deploy ERC20Mocksonly on localhost
  if (chainId === 31337) {
    const args1: any[] = [
      networkConfig[network.config.chainId!]["DECIMALS"],
      networkConfig[network.config.chainId!]["ETH_USD_PRICE"],
    ];
    const ethUsdPriceFeedraw = await deploy("MockV3Aggregator", {
      from: deployer,
      log: true,
      args: args1,
    });
    ethUsdPriceFeed = ethUsdPriceFeedraw.address;

    const args2: any[] = ["WETH", "WETH", deployer, 1000e8];
    const wethMockraw = await deploy("ERC20Mock", {
      from: deployer,
      log: true,
      args: args2,
    });
    wethMock = wethMockraw.address;

    const args3: any[] = [
      networkConfig[network.config.chainId!]["DECIMALS"],
      networkConfig[network.config.chainId!]["BTC_USD_PRICE"],
    ];
    const btcUsdPriceFeedraw = await deploy("MockV3Aggregator", {
      from: deployer,
      log: true,
      args: args3,
    });
    btcUsdPriceFeed = btcUsdPriceFeedraw.address;

    const args4: any[] = ["WBTC", "WBTC", deployer, 1000e8];
    const wbtcMockraw = await deploy("ERC20Mock", {
      from: deployer,
      log: true,
      args: args4,
    });
    wbtcMock = wbtcMockraw.address;

    tokenAddresses = [wethMock, wbtcMock];
    priceFeedAddresses = [ethUsdPriceFeed, btcUsdPriceFeed];
  } else {
    tokenAddresses = [
      networkConfig[chainId!]["weth"] as string,
      networkConfig[chainId!]["wbtc"] || "",
    ];
    priceFeedAddresses = [
      networkConfig[chainId!]["wethUsdPriceFeed"],
      networkConfig[chainId!]["wbtcUsdPriceFeed"],
    ];
  }

  // deploying contracts here
  // const args1: any[] = [""];
  const pokemonDollar = await deploy("PokemonDollar", {
    from: deployer,
    log: true,
    args: [],
  });

  const args2: any[] = [
    tokenAddresses,
    priceFeedAddresses,
    pokemonDollar.address,
  ];
  const dscEngine = await deploy("DSCEngine", {
    from: deployer,
    log: true,
    args: args2,
  });

  // TODO: transfer ownership to dscEngine
  // ToDo: To take ownership of yourContract using the ownable library uncomment next line and add the
  // address you want to be the owner.
  const pokemonDollarContract = await ethers.getContractAt(
    "PokemonDollar",
    pokemonDollar.address
  );
  pokemonDollarContract.transferOwnership(dscEngine.address);

  //    // Verify the deployment
  //    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
  //     log("Verifying...")
  //     await verify(lotteryTrio.address, args)
  // }
};
export default func;
func.tags = ["all", "stablecoins"];

// https://github.com/wighawag/hardhat-deploy/tree/master#npm-install-hardhat-deploy
