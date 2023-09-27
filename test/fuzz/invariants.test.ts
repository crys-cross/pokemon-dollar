// Have our invariant aka properties hold true for all the time
// What are our invariants?
// 1. The total supply of PD should be less than the total value of collateral
// 2. Getter view functions should never revert <- evergreen invariant
// chainlink test link - https://www.youtube.com/live/dDr7glOjtvI?si=MiQZpfwlTRdafvqb
// https://github.com/andrejrakic/hardhat-testing
// TODO: hardhat fuzztest

// sample guide below
// const hre = require("hardhat");
// const { ethers } = hre;
// const { expect } = require("chai");

// describe("Fuzz Test", function () {
//   it("Should return the correct result for random inputs", async function () {
//     const MyContract = await ethers.getContractFactory("MyContract");
//     const myContract = await MyContract.deploy();
//     await myContract.deployed();

//     // Generate random inputs for fuzz testing
//     const a = Math.floor(Math.random() * 100);
//     const b = Math.floor(Math.random() * 100);
//     const expectedResult = a + b;

//     // Call the contract function with the random inputs
//     const result = await myContract.add(a, b);

//     // Assert that the result matches the expected result
//     expect(result).to.equal(expectedResult);
//   });
// });

//  // SPDX-License-Identifier: UNLICENSED
//  pragma solidity ^0.8.0;

//  contract MyContract {
//    function add(uint256 a, uint256 b) public pure returns (uint256) {
//      return a + b;
//    }
//  }
