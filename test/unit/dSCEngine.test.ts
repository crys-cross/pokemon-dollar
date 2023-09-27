import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { assert, expect } from "chai";
// import { PANIC_CODES } from "@nomicfoundation/hardhat-chai-matchers/panic";
// import { BigNumber } from "ethers"
// import { isAddress } from "ethers/lib/utils"
import { deployments, ethers, network } from "hardhat";
import { subtask } from "hardhat/config";
import { developmentChains, networkConfig } from "../../helper-hardhat-config";
import {
  PokemonDollar,
  DSCEngine,
  MockV3AggregatorWbtc,
  MockV3AggregatorWeth,
  WbtcMock,
  WethMock,
} from "../../typechain-types";
// reference:
// https://hardhat.org/hardhat-chai-matchers/docs/overview
// https://github.com/smartcontractkit/full-blockchain-solidity-course-js

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("DSCEngine Unit Test", () => {
      let pokemonDollar: PokemonDollar;
      let dSCEngine: DSCEngine;
      let accounts: SignerWithAddress[];
      let deployer: SignerWithAddress;
      let user: SignerWithAddress;

      let ethUsdPriceFeed: MockV3AggregatorWeth;
      let btcUsdPriceFeed: MockV3AggregatorWbtc;
      let weth: WethMock;
      let wbtc: WbtcMock;

      //get addresses
      let wbtcAddress: any;
      let wethAddress: any;
      let ethUsdPriceFeedAddress: any;
      let btcUsdPriceFeedAddress: any;
      let pokemonDollarAddress: any;
      let dSCEngineAddress: any;

      //constant variables
      const amountCollateral = ethers.parseEther("10");
      const STARTING_USER_BALANCE = ethers.parseEther("10");

      //recurring function modifier
      const depositCollateral = async (
        weth: WethMock,
        wethAddress: any,
        dSCEngineAddress: any,
        amountCollateral: bigint,
        user: SignerWithAddress
      ) => {
        await weth.connect(user).approve(dSCEngineAddress, amountCollateral);
        await dSCEngine
          .connect(user)
          .depositCollateral(wethAddress, amountCollateral);
      };

      beforeEach(async () => {
        accounts = await ethers.getSigners();
        deployer = accounts[0];
        user = accounts[1];
        await deployments.fixture(["all"]);
        pokemonDollar = await ethers.getContract("PokemonDollar");
        dSCEngine = await ethers.getContract("DSCEngine");
        ethUsdPriceFeed = await ethers.getContract("MockV3AggregatorWeth");
        btcUsdPriceFeed = await ethers.getContract("MockV3AggregatorWbtc");
        weth = await ethers.getContract("WethMock");
        wbtc = await ethers.getContract("WbtcMock");

        await weth.mint(user, STARTING_USER_BALANCE);
        await wbtc.mint(user, STARTING_USER_BALANCE);

        //get addresses here
        const wbtcAddress = await wbtc.getAddress();
        const wethAddress = await weth.getAddress();
        const ethUsdPriceFeedAddress = await ethUsdPriceFeed.getAddress();
        const btcUsdPriceFeedAddress = await btcUsdPriceFeed.getAddress();
        const pokemonDollarAddress = await pokemonDollar.getAddress();
        const dSCEngineAddress = await dSCEngine.getAddress();
      });

      // // TODO fix reverts errors for constructor test
      // describe("constructor", () => {
      //   it("reverts if token length doesn't match pricefeeds", async () => {
      //     // TODO: fix address errors
      //     //get addresses here
      //     // const wbtcAddress = await wbtc.getAddress();
      //     const wethAddress = await weth.getAddress();
      //     const ethUsdPriceFeedAddress = await ethUsdPriceFeed.getAddress();
      //     const btcUsdPriceFeedAddress = await btcUsdPriceFeed.getAddress();
      //     const pokemonDollarAddress = await pokemonDollar.getAddress();
      //     //params here
      //     const tokenAddresses = [wethAddress];
      //     const priceFeedAddresses = [
      //       ethUsdPriceFeedAddress,
      //       btcUsdPriceFeedAddress,
      //     ];
      //     const args = [
      //       tokenAddresses,
      //       priceFeedAddresses,
      //       pokemonDollarAddress,
      //     ];
      //     // get contract factory and deploy here
      //     const dsce = await (
      //       await ethers.getContractFactory("DSCEngine", deployer)
      //     ).deploy(tokenAddresses, priceFeedAddresses, pokemonDollarAddress);
      //     // const dSCEngineContract = await dsce.deploy(args);
      //     //logs
      //     console.log(wethAddress);
      //     console.log(ethUsdPriceFeedAddress);
      //     console.log(btcUsdPriceFeedAddress);
      //     console.log(pokemonDollarAddress);
      //     // await expect(
      //     //   // await dsce.deploy(args)
      //     //   // await ethers.deployContract("DSCEngine", args)
      //     //   dSCEngineContract
      //     // ).to.be.revertedWithCustomError(
      //     //   dSCEngineContract,
      //     //   "DSCEngine__TokenAddressAndPriceFeedAddressesMustBeSameLength()"
      //     // );
      //     // await expect(dsce).to.be.reverted;
      //     await expect(dsce).to.be.revertedWithCustomError(
      //       dsce,
      //       "DSCEngine__TokenAddressAndPriceFeedAddressesMustBeSameLength()"
      //     );
      //   });
      // });

      describe("getUsdValue", () => {
        it("get token amount from usd", async () => {
          // If we want $100 of WETH @ $2000/WETH, that would be 0.05 WETH
          const expectedWeth = ethers.parseEther("0.05");
          const amountWeth = await dSCEngine.getTokenAmountFromUsd(
            weth,
            ethers.parseEther("100")
          );
          assert.equal(amountWeth, expectedWeth);
        });
        it("get usd value", async () => {
          const ethAmount = ethers.parseEther("15");
          const expectedUsd = ethers.parseEther("30000");
          const usdValue = await dSCEngine.getUsdValue(weth, ethAmount);
          assert.equal(usdValue, expectedUsd);
        });
      });

      describe("getTokenAmountFromUsd", () => {
        it("expected weth equals to actual weth", async () => {
          const usdAmount = ethers.parseEther("100");
          // $2,000 / ETH $100
          const expectedWeth = ethers.parseEther("0.05");
          const actualWeth = await dSCEngine.getTokenAmountFromUsd(
            weth,
            usdAmount
          );
          assert.equal(expectedWeth, actualWeth);
        });
      });

      describe("depositCollateral", () => {
        it("reverts if collateral is zero", async () => {
          weth.connect(user).approve(dSCEngine, amountCollateral);
          await expect(
            dSCEngine.depositCollateral(weth, 0)
          ).to.be.revertedWithCustomError(
            dSCEngine,
            "DSCEngine__NeedsMoreThanZero"
          );
        });

        // test below need own setup
        it("reverts with unapproved collateral", async () => {
          // deploy mock token
          const ranToken = await (
            await ethers.getContractFactory("WethMock", deployer)
          ).deploy("RAN", "RAN", user, amountCollateral);
          // get token address
          const ranTokenAddress = await ranToken.getAddress();
          await expect(
            dSCEngine.depositCollateral(ranTokenAddress, amountCollateral)
          ).to.be.revertedWithCustomError(
            dSCEngine,
            "DSCEngine__NotAllowedToken"
          );
        });

        it("can deposit coallateral and get account info", async () => {
          //run modifier function
          const tx = await depositCollateral(
            weth,
            weth,
            dSCEngine,
            amountCollateral,
            user
          );
          console.log(tx);

          const [totalPdMinted, collateralValueInUsd] =
            await dSCEngine.getAccountInformation(user);
          // console.log(totalPdMinted);
          // console.log(collateralValueInUsd);

          const expectedDepositAmount = await dSCEngine.getTokenAmountFromUsd(
            weth,
            collateralValueInUsd
          );
          assert.equal(totalPdMinted, 0n);
          assert.equal(expectedDepositAmount, amountCollateral);
        });
      });

      describe("depositCollateralAndMintPd", () => {
        it("reverts if minted PD breaks health factor", async () => {
          // const price = ethUsdPriceFeed.latestRoundData();
          // // TODO: convert to same types
          // const amountToMint =
          //   (amountCollateral *
          //     (price * dSCEngine.getAdditionalFeedPrecision())) /
          //   dSCEngine.getPrecision();
        });

        it("", async () => {});
      });

      describe("mint PD", () => {
        it("", async () => {});
      });
    });
