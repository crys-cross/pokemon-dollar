import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  // code here
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  // TODO: if localhost, put mock addresses

  const args1: any[] = [""];
  const pokemonDollar = await deploy("PokemonDollar", {
    from: deployer,
    log: true,
    args: args1,
    // waitConfirmations: waitBlockConfirmations,
  });

  const args2: any[] = [
    // address[] memory _tokenAddresses,[]
    // address[] memory _priceFeedAddresses,[]
    // pokemonDollar.address
  ];
  const dscEngine = await deploy("DSCEngine", {
    from: deployer,
    log: true,
    args: args2,
    // waitConfirmations: waitBlockConfirmations,
  });

  // TODO: transfer ownership to dscEngine
  // ToDo: To take ownership of yourContract using the ownable library uncomment next line and add the
  // address you want to be the owner.
  // pokemonDollar.transferOwnership(dscEngine.address);

  //    // Verify the deployment
  //    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
  //     log("Verifying...")
  //     await verify(lotteryTrio.address, args)
  // }
};
export default func;
func.tags = ["all", "stablecoins"];

// https://github.com/wighawag/hardhat-deploy/tree/master#npm-install-hardhat-deploy
