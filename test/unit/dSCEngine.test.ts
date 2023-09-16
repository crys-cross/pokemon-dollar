import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { assert, expect } from "chai";
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

      const amountCollateral = ethers.parseEther("10");
      const STARTING_USER_BALANCE = ethers.parseEther("10");

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
      });

      // TODO fix reverts errors
      describe("constructor", () => {
        it("reverts if token length doesn't match pricefeeds", async () => {
          //get addresses here
          const wethAddress = await weth.getAddress();
          const ethUsdPriceFeedAddress = await ethUsdPriceFeed.getAddress();
          const btcUsdPriceFeedAddress = await btcUsdPriceFeed.getAddress();
          const pokemonDollarAddress = await pokemonDollar.getAddress();
          //params here
          const tokenAddresses = [wethAddress];
          const priceFeedAddresses = [
            ethUsdPriceFeedAddress,
            btcUsdPriceFeedAddress,
          ];
          const args = [
            tokenAddresses,
            priceFeedAddresses,
            pokemonDollarAddress,
          ];

          await expect(await ethers.deployContract("DSCEngine", args)).to.be
            .reverted;
        });
      });

      describe("constructor", () => {
        it("reverts if token length doesn't match pricefeeds", async () => {
          // TODO: fix address errors
          //get addresses here
          const wethAddress = await weth.getAddress();
          const ethUsdPriceFeedAddress = await ethUsdPriceFeed.getAddress();
          const btcUsdPriceFeedAddress = await btcUsdPriceFeed.getAddress();
          const pokemonDollarAddress = await pokemonDollar.getAddress();
          //params here
          const tokenAddresses = [wethAddress];
          const priceFeedAddresses = [
            ethUsdPriceFeedAddress,
            btcUsdPriceFeedAddress,
          ];
          const args = [
            tokenAddresses,
            priceFeedAddresses,
            pokemonDollarAddress,
          ];
          // get contract factory
          const contract = await ethers.getContractFactory("DSCEngine");
          //logs
          console.log(wethAddress);
          console.log(ethUsdPriceFeedAddress);
          console.log(btcUsdPriceFeedAddress);
          console.log(pokemonDollarAddress);
          await expect(
            await contract.deploy(args)
            // await ethers.deployContract("DSCEngine", args)
          ).to.be.revertedWithCustomError(
            contract,
            "DSCEngine__TokenAddressAndPriceFeedAddressesMustBeSameLength()"
          );
        });
      });

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
        it("", async () => {});
      });

      describe("reverts if collateral is zero", () => {
        it("", async () => {});
      });

      describe("mint PD", () => {
        it("", async () => {});
      });
    });
