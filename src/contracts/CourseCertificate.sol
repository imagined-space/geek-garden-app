// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Import required OpenZeppelin contracts
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title CourseCertificate
 * @dev Course certificate NFT contract for issuing course completion certificates
 * Implements ERC721 standard and access control functionality
 */
contract CourseCertificate is ERC721, AccessControl {
    using Counters for Counters.Counter;
    using Strings for uint256;

    // NFT ID counter for generating unique certificate IDs
    Counters.Counter private _tokenIds;

    // Define minter role - only addresses with this role can mint certificates
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /**
     * @dev Certificate data structure to store details of each certificate
     * @param web2CourseId Course ID from Web2 platform to link with online course
     * @param student Student address who owns the certificate
     * @param timestamp Issue time recorded as block timestamp
     * @param metadataURI Metadata URI pointing to certificate details and image
     */
    struct CertificateData {
        string web2CourseId; // Course ID from Web2 platform
        address student; // Student address
        uint256 timestamp; // Issue time
        string metadataURI; // Metadata URI
    }

    // tokenId => certificate data, stores details of all certificates
    mapping(uint256 => CertificateData) public certificates;

    // Records student certificates: courseId => student address => array of tokenIds
    // Allows student to have multiple certificates for same course (different versions or retakes)
    mapping(string => mapping(address => uint256[])) public studentCertificates;

    /**
     * @dev Certificate minting event, emitted when new certificate is created
     * @param tokenId Unique ID of the certificate
     * @param web2CourseId Associated Web2 course ID
     * @param student Address of student receiving certificate
     */
    event CertificateMinted(
        uint256 indexed tokenId,
        string web2CourseId,
        address indexed student
    );

    /**
     * @dev Constructor initializes NFT name and symbol
     * Grants deployer admin and minter roles
     */
    constructor() ERC721("Geek Course Certificate", "GKCC") {
        // Grant deployer admin and minter roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    /**
     * @dev Mint new course certificate
     * Only callable by addresses with MINTER_ROLE
     * @param student Student address to mint certificate to
     * @param web2CourseId Course ID linking to Web2 platform course
     * @param metadataURI URI pointing to certificate details
     * @return uint256 ID of newly minted certificate
     */
    function mintCertificate(
        address student,
        string memory web2CourseId,
        string memory metadataURI
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        require(student != address(0), "Invalid student address");

        // Generate new tokenId
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        // Mint NFT
        _safeMint(student, newTokenId);

        // Store certificate data
        certificates[newTokenId] = CertificateData({
            web2CourseId: web2CourseId,
            student: student,
            timestamp: block.timestamp,
            metadataURI: metadataURI
        });

        // Record student certificate
        studentCertificates[web2CourseId][student].push(newTokenId);

        emit CertificateMinted(newTokenId, web2CourseId, student);
        return newTokenId;
    }

    /**
     * @dev Get certificate metadata URI
     * Overrides ERC721 tokenURI function to return certificate metadata URI
     * @param tokenId Certificate ID
     * @return string Metadata URI of the certificate
     */
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(_exists(tokenId), "Certificate does not exist");
        return certificates[tokenId].metadataURI;
    }

    /**
     * @dev Check if student has certificate for a course
     * @param student Student address
     * @param web2CourseId Course ID
     * @return bool Returns true if student has certificate for the course
     */
    function hasCertificate(
        address student,
        string memory web2CourseId
    ) public view returns (bool) {
        return studentCertificates[web2CourseId][student].length > 0;
    }

    /**
     * @dev Get all certificate IDs for a student's course
     * @param student Student address
     * @param web2CourseId Course ID
     * @return uint256[] Array of certificate IDs owned by student for the course
     */
    function getStudentCertificates(
        address student,
        string memory web2CourseId
    ) public view returns (uint256[] memory) {
        return studentCertificates[web2CourseId][student];
    }

    /**
     * @dev Implement supportsInterface function
     * Properly handle interface support since contract inherits both ERC721 and AccessControl
     * @param interfaceId Interface ID
     * @return bool Returns true if contract supports the interface
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
