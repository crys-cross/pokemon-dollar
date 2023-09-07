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

      let ethUsdPriceFeed: MockV3AggregatorWeth;
      let btcUsdPriceFeed: MockV3AggregatorWbtc;
      let weth: WethMock;
      let wbtc: WbtcMock;

      beforeEach(async () => {
        accounts = await ethers.getSigners();
        deployer = accounts[0];
        await deployments.fixture(["all"]);
        pokemonDollar = await ethers.getContract("PokemonDollar");
        dSCEngine = await ethers.getContract("DSCEngine");
        ethUsdPriceFeed = await ethers.getContract("MockV3AggregatorWeth");
        btcUsdPriceFeed = await ethers.getContract("MockV3AggregatorWbtc");
        weth = await ethers.getContract("WethMock");
        wbtc = await ethers.getContract("WbtcMock");
      });

      describe("constructor", () => {
        it("reverts if token length doesn't match pricefeeds", async () => {});
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
          // If we want $100 of WETH @ $2000/WETH, that would be 0.05 WETH
          const expectedWeth = ethers.parseEther("0.05");
          const amountWeth = await dSCEngine.getTokenAmountFromUsd(
            weth,
            ethers.parseEther("100")
          );
          assert.equal(amountWeth, expectedWeth);
        });
      });

      // test below need own setup
      describe("deposit collateral", () => {
        it("", async () => {});
      });

      describe("deposit cillateral and mint", () => {
        it("", async () => {});
      });

      describe("mint PD", () => {
        it("", async () => {});
      });
    });
