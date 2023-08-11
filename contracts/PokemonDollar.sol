// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC20Burnable, ERC20} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/*
 * @title PokemonDollar - A decentralized stablecoin
 * @author Crys
 * Collateral: Exogenous (ETH & BTC)
 * Minting: Algorithmic
 * Relative Stability: Pegged to USD
 *
 * This is the contract meant to be governed by DSCEngine. This contract is just the ERC20 implementation of our stablecoin system
 */
contract PokemonDollar is ERC20Burnable, Ownable {
    error PokemonDollar_MustBeMoreThanZero();
    error PokemonDollar_BurnAmountExceedsBalance();
    error PokemonDollar_NotZeroAddress();

    constructor() ERC20("PokemonDollar", "PD") {}

    function burn(uint256 _amount) public override onlyOwner {
        uint256 balance = balanceOf(msg.sender);
        if (_amount <= 0) {
            revert PokemonDollar_MustBeMoreThanZero();
        }
        if (balance < _amount) {
            revert PokemonDollar_BurnAmountExceedsBalance();
        }
        super.burn(_amount);
    }

    function mint(
        address _to,
        uint256 _amount
    ) external onlyOwner returns (bool) {
        if (_to == address(0)) {
            revert PokemonDollar_NotZeroAddress();
        }
        if (_amount <= 0) {
            revert PokemonDollar_MustBeMoreThanZero();
        }
        _mint(_to, _amount);
        return true;
    }
}
