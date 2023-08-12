// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {PokemonDollar} from "./PokemonDollar.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/*
 * @title DecentralizedStableCoin
 * @author Crys
 *
 * The system is designed to be as minimal as possible, and have the tokens maintain a 1 token == $1 peg at all times.
 * This is a stablecoin with the properties:
 * - Exogenously Collateralized
 * - Dollar Pegged
 * - Algorithmically Stable
 *
 * It is similar to DAI if DAI had no governance, no fees, and was backed by only WETH and WBTC.
 * Stablecoin should always be "overcollaterized". At no point, should the value of all collateral <= the $ backed value of all the Stablecoin
 *
 * @notice original code from Mr. Patrick Collins Stablecoin course
 * @notice This contract is the core of the DSC System, It handles all the logic for mining and redeeming Pokemon Dollar, as well as depositing & withdrawing collateral
 * @notice This contract is VERY loosesly based on the MakerDAO DSS (DAI) system
 */
contract DSCEngine is ReentrancyGuard {
    ///////////////
    //  Errors   //
    ///////////////
    error DSCEngine__NeedsMoreThanZero();
    error DSCEngine__TokenAddressAndPriceFeedAddressesMustBeSameLength();
    error DSCEngine__NotAllowedToken();
    error DSCEngine__Transferfailed();
    error DSCEngine__MintFailed();

    /////////////////////
    // State Variables //
    /////////////////////
    uint256 private constant ADDITIONAL_FEED_PRECISION = 1e10;
    uint256 private constant PRECISION = 1e18;
    mapping(address token => address priceFeed) private s_priceFeeds; // tokenToPriceFeed
    mapping(address user => mapping(address token => uint256 amount))
        private s_collateralDeposited;
    mapping(address user => uint256 amountPdMinted) private s_PdMinted;
    address[] private s_collateralTokens;
    PokemonDollar private immutable i_pd;

    ///////////////
    //   Events  //
    ///////////////
    event CollateralDeposited(
        address indexed user,
        address indexed token,
        uint256 indexed amount
    );
    event CollateralRedeemed(
        address indexed redeemFrom,
        address indexed redeemTo,
        address token,
        uint256 amount
    ); // if redeemFrom != redeemedTo, then it was liquidated

    ///////////////
    // Modifiers //
    ///////////////
    modifier moreThanZero(uint256 _amount) {
        if (_amount == 0) {
            revert DSCEngine__NeedsMoreThanZero();
        }
        _;
    }

    modifier isAllowedToken(address _token) {
        if (s_priceFeeds[_token] == address(0)) {
            revert DSCEngine__NotAllowedToken();
        }
        _;
    }

    ///////////////
    // Functions //
    ///////////////
    constructor(
        address[] memory _tokenAddresses,
        address[] memory _priceFeedAddresses,
        address _pdAddress
    ) {
        // USD Price Feeds
        if (_tokenAddresses.length != _priceFeedAddresses.length) {
            revert DSCEngine__TokenAddressAndPriceFeedAddressesMustBeSameLength();
        }
        for (uint256 i = 0; i < _tokenAddresses.length; i++) {
            s_priceFeeds[_tokenAddresses[i]] = _priceFeedAddresses[i];
            s_collateralTokens.push(_tokenAddresses[i]);
        }
        i_pd = PokemonDollar(_pdAddress);
    }

    ////////////////////////
    // External Functions //
    ////////////////////////
    function depositCollateralAndMintPd() external {}

    /*
     * @notice follows CEI
     * @param _tokenCollateralAddress The address of the token to deposit as collateral
     * @param _amountCollateral The amount of collateral to deposit
     */
    function depositCollateral(
        address _tokenCollateralAddress,
        uint256 _amountCollateral
    )
        external
        moreThanZero(_amountCollateral)
        isAllowedToken(_tokenCollateralAddress)
        nonReentrant
    {
        s_collateralDeposited[msg.sender][
            _tokenCollateralAddress
        ] += _amountCollateral;

        emit CollateralDeposited(
            msg.sender,
            _tokenCollateralAddress,
            _amountCollateral
        );

        bool success = IERC20(_tokenCollateralAddress).transferFrom(
            msg.sender,
            address(this),
            _amountCollateral
        );
        if (!success) {
            revert DSCEngine__Transferfailed();
        }
    }

    function redeemCollateralforPd() external {}

    function redeemCollateral() external {}

    /*
     * @param amountPdToMint: The amount of PD you want to mint
     * You can only mint PD if you hav enough collateral
     */
    function mintPd(
        uint256 _amountPdToMint
    ) public moreThanZero(_amountPdToMint) nonReentrant {
        s_PdMinted[msg.sender] += _amountPdToMint;
        revertIfHealthFactorIsBroken(msg.sender);
        bool minted = i_pd.mint(msg.sender, _amountPdToMint);

        if (minted != true) {
            revert DSCEngine__MintFailed();
        }
    }

    function burnPd() external {}

    function liquidate() external {}

    function getHealthFactor() external view {}

    ///////////////////////////////////////
    // Private & Internal View Functions //
    ///////////////////////////////////////

    function _getAccountInformation(
        address user
    )
        private
        view
        returns (uint256 totalPdMinted, uint256 collateralValueInUsd)
    {
        totalPdMinted = s_PdMinted[user];
        collateralValueInUsd = getAccountCollateralValue(user);
    }

    /*
     * Returns how close to liquidation a user is.
     * If a user goes below 1, then they can get liquidated
     */
    function healthFactor(address user) private view returns (uint256) {
        // (
        //     uint256 totalDscMinted,
        //     uint256 collateralValueInUsd
        // ) = _getAccountInformation(user);
        // return _calculateHealthFactor(totalDscMinted, collateralValueInUsd);
    }

    function revertIfHealthFactorIsBroken(address user) internal view {
        // uint256 userHealthFactor = _healthFactor(user);
        // if (userHealthFactor < MIN_HEALTH_FACTOR) {
        //     revert DSCEngine__BreaksHealthFactor(userHealthFactor);
        // }
    }

    //////////////////////////////////////
    // Public & External View Functions //
    //////////////////////////////////////

    function getAccountCollateralValue(
        address user
    ) public view returns (uint256 totalCollateralValueInUsd) {
        for (uint256 i = 0; i < s_collateralTokens.length; i++) {
            address token = s_collateralTokens[i];
            uint256 amount = s_collateralDeposited[user][token];
            totalCollateralValueInUsd += getUsdValue(token, amount);
        }
        return totalCollateralValueInUsd;
    }

    function getUsdValue(
        address token,
        uint256 amount
    ) private view returns (uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(
            s_priceFeeds[token]
        );
        (, int256 price, , , ) = priceFeed.staleCheckLatestRoundData();
        // 1 ETH = 1000 USD
        // The returned value from Chainlink will be 1000 * 1e8
        // Most USD pairs have 8 decimals, so we will just pretend they all do
        // We want to have everything in terms of WEI, so we add 10 zeros at the end
        return
            ((uint256(price) * ADDITIONAL_FEED_PRECISION) * amount) / PRECISION;
    }
}
