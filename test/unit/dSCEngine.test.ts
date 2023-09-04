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
  MockV3Aggregator,
} from "../../typechain-types";
import { beforeEach } from "mocha";

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("DSCEngine Unit Test", () => {
      let pokemonDollar: PokemonDollar;
      let dSCEngine: DSCEngine;
      let mockV3Aggregator: MockV3Aggregator;
      let accounts: SignerWithAddress[];
      let deployer: SignerWithAddress;

      beforeEach(async () => {
        accounts = await ethers.getSigners();
        deployer = accounts[0];
        await deployments.fixture(["all"]);
        pokemonDollar = await ethers.getContract("PokemonDollar");
        dSCEngine = await ethers.getContract("DSCEngine");
        mockV3Aggregator = await ethers.getContract("MockV3Aggregator");
      });

      describe("constructor", () => {
        it("", async () => {});
      });

      describe("getUsdValue", () => {
        it("getting the right USD value", async () => {});
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
