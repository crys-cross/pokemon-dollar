import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  // code here
};
export default func;
func.tags = ["all", "stablecoins"];

// https://github.com/wighawag/hardhat-deploy/tree/master#npm-install-hardhat-deploy
