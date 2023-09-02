// import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { assert, expect } from "chai";
// import { BigNumber } from "ethers"
// import { isAddress } from "ethers/lib/utils"
import { deployments, ethers, network } from "hardhat";
import { subtask } from "hardhat/config";
import { developmentChains, networkConfig } from "../../helper-hardhat-config";
import { DSCEngine } from "../../typechain-types";
import { beforeEach } from "mocha";

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("DSCEngine Unit Test", () => {
      let dSCEngine: DSCEngine;

      beforeEach(async () => {});

      describe("constructor", () => {
        it("", async () => {});
      });

      describe("price", () => {
        it("", async () => {});
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
