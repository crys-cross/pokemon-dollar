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
    error DSCEngine__BreaksHealthFactor(uint256 healthFactor);
    error DSCEngine__HealthFactorOk();
    error DSCEngine__HealthFactorNotImproved();

    /////////////////////
    // State Variables //
    /////////////////////
    uint256 private constant ADDITIONAL_FEED_PRECISION = 1e10;
    uint256 private constant PRECISION = 1e18;
    uint256 private constant LIQUIDATION_THRESHOLD = 50; //200% overcollateralized
    uint256 private constant LIQUIDATION_PRECISION = 100;
    uint256 private constant MIN_HEALTH_FACTOR = 1e18;
    uint256 private constant LIQUIDATION_BONUS = 10; // this means a 10% bonus

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
    // event CollateralRedeemed(
    //     address indexed redeemFrom,
    //     address indexed redeemTo,
    //     address token,
    //     uint256 amount
    // ); // if redeemFrom != redeemedTo, then it was liquidated
    event CollateralRedeemed(
        address indexed token,
        uint256 amount,
        address indexed redeemedFrom,
        address indexed redeemedTo
    );

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

    /**
     * @param _tokenCollateralAddress: The ERC20 token address of the collateral you're depositing
     * @param _amountCollateral: The amount of collateral you're depositing
     * @param _amountPDToMint: The amount of PD you want to mint
     * @notice This function will deposit your collateral and mint PD in one transaction
     */
    function depositCollateralAndMintPd(
        address _tokenCollateralAddress,
        uint256 _amountCollateral,
        uint256 _amountPDToMint
    ) external {
        depositCollateral(_tokenCollateralAddress, _amountCollateral);
        mintPd(_amountPDToMint);
    }

    /**
     * @notice follows CEI
     * @param _tokenCollateralAddress The address of the token to deposit as collateral
     * @param _amountCollateral The amount of collateral to deposit
     */
    function depositCollateral(
        address _tokenCollateralAddress,
        uint256 _amountCollateral
    )
        public
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

    /**
     * @param _tokenCollateralAddress: The ERC20 token address of the collateral you're depositing
     * @param _amountCollateral: The amount of collateral you're depositing
     * @param _amountPdToBurn: The amount of DSC you want to burn
     * @notice This function will withdraw your collateral and burn DSC in one transaction
     */
    function redeemCollateralforPd(
        address _tokenCollateralAddress,
        uint256 _amountCollateral,
        uint256 _amountPdToBurn
    ) external {
        burnPd(_amountPdToBurn);
        redeemCollateral(_tokenCollateralAddress, _amountCollateral); // already checks health factor
    }

    /**
     * @param _tokenCollateralAddress: The ERC20 token address of the collateral you're redeeming
     * @param _amountCollateral: The amount of collateral you're redeeming
     * @notice This function will redeem your collateral.
     * @notice If you have DSC minted, you will not be able to redeem until you burn your DSC
     */
    function redeemCollateral(
        address _tokenCollateralAddress,
        uint256 _amountCollateral
    ) public moreThanZero(_amountCollateral) nonReentrant {
        __redeemCollateral(
            _tokenCollateralAddress,
            _amountCollateral,
            msg.sender,
            msg.sender
        );
        __revertIfHealthFactorIsBroken(msg.sender);
    }

    /**
     * @param _amountPdToMint: The amount of PD you want to mint
     * You can only mint PD if you hav enough collateral
     */
    function mintPd(
        uint256 _amountPdToMint
    ) public moreThanZero(_amountPdToMint) nonReentrant {
        s_PdMinted[msg.sender] += _amountPdToMint;
        __revertIfHealthFactorIsBroken(msg.sender);
        bool minted = i_pd.mint(msg.sender, _amountPdToMint);
        if (!minted) {
            revert DSCEngine__MintFailed();
        }
    }

    function burnPd(uint256 _amount) public moreThanZero(_amount) {
        __burnPd(_amount, msg.sender, msg.sender);
        __revertIfHealthFactorIsBroken(msg.sender); // will probably never hit. . .
    }

    /**
     * @param _collateral: The ERC20 token address of the collateral you're using to make the protocol solvent again.
     * This is collateral that you're going to take from the user who is insolvent.
     * In return, you have to burn your DSC to pay off their debt, but you don't pay off your own.
     * @param _user: The user who is insolvent. They have to have a _healthFactor below MIN_HEALTH_FACTOR
     * @param _debtToCover: The amount of DSC you want to burn to cover the user's debt.
     * @notice You can partially liquidate a user.
     * @notice You will get a 10% LIQUIDATION_BONUS for taking the users funds.
     * @notice This function working assumes that the protocol will be roughly 150% overcollateralized in order for this to work.
     * @notice A known bug would be if the protocol was only 100% collateralized, we wouldn't be able to liquidate anyone.
     * For example, if the price of the collateral plummeted before anyone could be liquidated.
     */
    function liquidate(
        address _collateral,
        address _user,
        uint256 _debtToCover
    ) external moreThanZero(_debtToCover) nonReentrant {
        // need to check user health factor
        uint256 startingUserHealthFactor = __healthFactor(_user);
        if (startingUserHealthFactor >= MIN_HEALTH_FACTOR) {
            revert DSCEngine__HealthFactorOk();
        }
        // burn their PD "debt" an take their collateral
        // $100 of PD == ??? ETH?
        // 0.5 ETH
        uint256 tokenAmountFromDebtCovered = getTokenAmountFromUsd(
            _collateral,
            _debtToCover
        );
        // And give them a 10% bonus
        // So we are giving the liquidator %110 of WETH for 100 PD
        // We should implement a feature to liquidate in the event the protocol is insolvent
        // And sweep estre amounts into a treasury
        // 0.05 * 0.1 = 0.005. Getting a 0.055
        uint256 bonusCollateral = (tokenAmountFromDebtCovered *
            LIQUIDATION_BONUS) / LIQUIDATION_PRECISION;

        uint256 totaCollateralToRedeem = tokenAmountFromDebtCovered +
            bonusCollateral;
        __redeemCollateral(
            _collateral,
            totaCollateralToRedeem,
            _user,
            msg.sender
        );
        // burn PD here
        __burnPd(_debtToCover, _user, msg.sender);

        uint256 endingUserHealthFactor = __healthFactor(_user);
        if (endingUserHealthFactor <= startingUserHealthFactor) {
            revert DSCEngine__HealthFactorNotImproved();
        }
        __revertIfHealthFactorIsBroken(msg.sender);
    }

    function getHealthFactor() external view {}

    ///////////////////////////////////////
    // Private & Internal View Functions //
    ///////////////////////////////////////

    /**
     * @dev Low-level internal function, do not call unless the function calling it is
     * checking for the health factors being broken
     */
    function __burnPd(
        uint256 _amountPdToBurn,
        address _onBehalfOf,
        address _pdFrom
    ) private {
        s_PdMinted[_onBehalfOf] -= _amountPdToBurn;
        bool success = i_pd.transferFrom(
            _pdFrom,
            address(this),
            _amountPdToBurn
        );
        if (!success) {
            revert DSCEngine__Transferfailed();
        }
        i_pd.burn(_amountPdToBurn);
    }

    function __redeemCollateral(
        address _tokenCollateralAddress,
        uint256 _amountCollateral,
        address _from,
        address _to
    ) private {
        s_collateralDeposited[_from][
            _tokenCollateralAddress
        ] -= _amountCollateral;
        emit CollateralRedeemed(
            _tokenCollateralAddress,
            _amountCollateral,
            _from,
            _to
        );
        bool success = IERC20(_tokenCollateralAddress).transfer(
            _to,
            _amountCollateral
        );
        if (!success) {
            revert DSCEngine__Transferfailed();
        }
    }

    function __getAccountInformation(
        address _user
    )
        private
        view
        returns (uint256 totalPdMinted, uint256 collateralValueInUsd)
    {
        totalPdMinted = s_PdMinted[_user];
        collateralValueInUsd = getAccountCollateralValue(_user);
    }

    function __calculateHealthFactor(
        uint256 _totalDscMinted,
        uint256 _collateralValueInUsd
    ) internal pure returns (uint256) {
        if (_totalDscMinted == 0) return type(uint256).max;
        uint256 collateralAdjustedForThreshold = (_collateralValueInUsd *
            LIQUIDATION_THRESHOLD) / LIQUIDATION_PRECISION;
        // 1,000 ETH * 50 = 50,000 / 100 = 500
        // $150 ETH / 100 DSC = 1.5
        // 150 * 50 = 7,500 / 100 = (75 / 100) < 1

        // $1,000 ETH / 100 DSC
        // 1,000 * 50 = 50,000 / 100 = (500 / 100) > 1
        return (collateralAdjustedForThreshold * PRECISION) / _totalDscMinted;
    }

    /*
     * Returns how close to liquidation a user is.
     * If a user goes below 1, then they can get liquidated
     */
    function __healthFactor(address _user) private view returns (uint256) {
        (
            uint256 totalDscMinted,
            uint256 collateralValueInUsd
        ) = __getAccountInformation(_user);
        return __calculateHealthFactor(totalDscMinted, collateralValueInUsd);
    }

    function _getUsdValue(
        address token,
        uint256 amount
    ) private view returns (uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(
            s_priceFeeds[token]
        );
        (, int256 price, , , ) = priceFeed.latestRoundData();
        // 1 ETH = 1000 USD
        // The returned value from Chainlink will be 1000 * 1e8
        // Most USD pairs have 8 decimals, so we will just pretend they all do
        // We want to have everything in terms of WEI, so we add 10 zeros at the end
        return
            ((uint256(price) * ADDITIONAL_FEED_PRECISION) * amount) / PRECISION;
    }

    function __revertIfHealthFactorIsBroken(address _user) internal view {
        uint256 userHealthFactor = __healthFactor(_user);
        if (userHealthFactor < MIN_HEALTH_FACTOR) {
            revert DSCEngine__BreaksHealthFactor(userHealthFactor);
        }
    }

    /////////////////////////////////////////////
    // Public & External View & Pure Functions //
    /////////////////////////////////////////////

    function getAccountCollateralValue(
        address _user
    ) public view returns (uint256 totalCollateralValueInUsd) {
        for (uint256 i = 0; i < s_collateralTokens.length; i++) {
            address token = s_collateralTokens[i];
            uint256 amount = s_collateralDeposited[_user][token];
            totalCollateralValueInUsd += _getUsdValue(token, amount);
        }
        return totalCollateralValueInUsd;
    }

    function getUsdValue(
        address token,
        uint256 amount // in WEI
    ) external view returns (uint256) {
        return _getUsdValue(token, amount);
    }

    function getTokenAmountFromUsd(
        address token,
        uint256 usdAmountInWei
    ) public view returns (uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(
            s_priceFeeds[token]
        );
        (, int256 price, , , ) = priceFeed.latestRoundData();
        // $100e18 USD Debt
        // 1 ETH = 2000 USD
        // The returned value from Chainlink will be 2000 * 1e8
        // Most USD pairs have 8 decimals, so we will just pretend they all do
        return ((usdAmountInWei * PRECISION) /
            (uint256(price) * ADDITIONAL_FEED_PRECISION));
    }

    function getAccountInformation(
        address user
    )
        external
        view
        returns (uint256 totalPdMinted, uint256 collateralValueinUsd)
    {
        (totalPdMinted, collateralValueinUsd) = __getAccountInformation(user);
    }

    function getPrecision() external pure returns (uint256) {
        return PRECISION;
    }

    function getAdditionalFeedPrecision() external pure returns (uint256) {
        return ADDITIONAL_FEED_PRECISION;
    }
}
