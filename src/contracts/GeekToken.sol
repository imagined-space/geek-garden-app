// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Import OpenZeppelin's ERC20 standard contract
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// Import OpenZeppelin's ownership control contract
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GeekToken
 * @dev ERC20 token implementation for Geek education platform
 * Token used for course purchases and platform incentive mechanisms
 */
contract GeekToken is ERC20, Ownable {
    // Define ETH to G token exchange rate: 1 ETH = 1000 G
    uint256 public constant TOKENS_PER_ETH = 1000;
    // Define maximum token supply: 10.24M G (excluding decimals)
    uint256 public constant MAX_SUPPLY = 10240000;

    // Team allocation: 20% = 2.048M G
    uint256 public teamAllocation;
    // Marketing allocation: 10% = 1.024M G
    uint256 public marketingAllocation;
    // Community allocation: 10% = 1.024M G
    uint256 public communityAllocation;
    // Remaining 60% = 6.144M G for public sale

    // Flag indicating if initial token distribution is completed
    bool public initialDistributionDone;

    /**
     * @dev Override decimals function to set token precision to 0 (integer tokens)
     * @return Number of decimal places for the token
     */
    function decimals() public view virtual override returns (uint8) {
        return 0;
    }

    // Event definitions
    /**
     * @dev Emitted when user purchases tokens with ETH
     * @param buyer Address of the purchaser
     * @param ethAmount Amount of ETH paid
     * @param tokenAmount Amount of tokens purchased
     */
    event TokensPurchased(
        address indexed buyer,
        uint256 ethAmount,
        uint256 tokenAmount
    );

    /**
     * @dev Emitted when user sells tokens back for ETH
     * @param seller Address of the seller
     * @param tokenAmount Amount of tokens sold
     * @param ethAmount Amount of ETH received
     */
    event TokensSold(
        address indexed seller,
        uint256 tokenAmount,
        uint256 ethAmount
    );

    /**
     * @dev Emitted when initial token distribution is completed
     * @param teamWallet Team wallet address
     * @param marketingWallet Marketing wallet address
     * @param communityWallet Community wallet address
     */
    event InitialDistributionCompleted(
        address teamWallet,
        address marketingWallet,
        address communityWallet
    );

    /**
     * @dev Constructor: Initialize token name as "Geek Token", symbol as "G"
     * Also calculates allocation amounts
     */
    constructor() ERC20("Geek Token", "G") {
        // Calculate allocation amounts
        teamAllocation = (MAX_SUPPLY * 20) / 100; // 20% for team
        marketingAllocation = (MAX_SUPPLY * 10) / 100; // 10% for marketing
        communityAllocation = (MAX_SUPPLY * 10) / 100; // 10% for community
    }

    /**
     * @dev Initial token distribution function, can only be called by contract owner
     * Distributes tokens according to preset ratios to team, marketing and community wallets
     * @param teamWallet Team wallet address
     * @param marketingWallet Marketing wallet address
     * @param communityWallet Community wallet address
     */
    function distributeInitialTokens(
        address teamWallet, // Team wallet address
        address marketingWallet, // Marketing wallet address
        address communityWallet // Community wallet address
    ) external onlyOwner {
        require(!initialDistributionDone, "Initial distribution already done");

        _mint(teamWallet, teamAllocation); // Mint team allocation
        _mint(marketingWallet, marketingAllocation); // Mint marketing allocation
        _mint(communityWallet, communityAllocation); // Mint community allocation

        initialDistributionDone = true;
        emit InitialDistributionCompleted(
            teamWallet,
            marketingWallet,
            communityWallet
        );
    }

    /**
     * @dev Function to purchase G tokens with ETH
     * Users send ETH to contract and receive tokens at TOKENS_PER_ETH rate
     */
    function buyWithETH() external payable {
        require(msg.value > 0, "Must send ETH");

        uint256 tokenAmount = (msg.value * TOKENS_PER_ETH) / 1 ether;
        require(
            totalSupply() + tokenAmount <= MAX_SUPPLY,
            "Would exceed max supply"
        );

        _mint(msg.sender, tokenAmount);
        emit TokensPurchased(msg.sender, msg.value, tokenAmount);
    }

    /**
     * @dev Sell Geek tokens back for ETH
     * Users can sell tokens back to contract at TOKENS_PER_ETH rate
     * @param tokenAmount Amount of tokens to sell
     */
    function sellTokens(uint256 tokenAmount) external {
        require(tokenAmount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= tokenAmount, "Insufficient balance");

        // Calculate ETH amount
        uint256 ethAmount = (tokenAmount * 1 ether) / TOKENS_PER_ETH;
        require(
            address(this).balance >= ethAmount,
            "Insufficient ETH in contract"
        );

        // Burn tokens first
        _burn(msg.sender, tokenAmount);

        // Send ETH to user
        (bool success, ) = payable(msg.sender).call{value: ethAmount}("");
        require(success, "ETH transfer failed");

        emit TokensSold(msg.sender, tokenAmount, ethAmount);
    }

    /**
     * @dev Query remaining mintable token supply
     * @return Amount of tokens that can still be minted
     */
    function remainingMintableSupply() public view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }

    /**
     * @dev Contract owner withdraws ETH from contract
     * Only contract owner can call this function
     * Note: In practice, consider using multisig wallet as owner
     */
    function withdrawETH() external onlyOwner {
        // Multisig wallet should be contract owner for better fund security
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * @dev Allow contract to receive ETH directly
     */
    receive() external payable {}

    /**
     * @dev Allow contract to receive ETH when calling non-existent functions
     */
    fallback() external payable {}
}
