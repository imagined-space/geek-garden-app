// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./GeekToken.sol";
import "./CourseCertificate.sol";

/**
 * @title CourseMarket
 * @dev Course marketplace contract for Geek Garden
 * Manages course addition, purchase and certification processes
 */
contract CourseMarket is Ownable {
    // Contract instances
    GeekToken public geekToken;      // Geek token contract instance
    CourseCertificate public certificate; // Certificate NFT contract instance

    /**
     * @dev Course struct to store course details
     * @param web2CourseId Course ID from Web2 platform to link with online course
     * @param name Course name
     * @param price Course price in G tokens
     * @param isActive Whether course is available for purchase
     * @param creator Course creator address who receives purchase income
     */
    struct Course {
        string web2CourseId; // Course ID from Web2 platform
        string name; // Course name
        uint256 price; // Course price in G tokens
        bool isActive; // Whether course is available for purchase
        address creator; // Course creator address
    }

    // Contract state variables
    mapping(uint256 => Course) public courses; // courseId => Course, stores all courses
    mapping(string => uint256) public web2ToCourseId; // web2CourseId => courseId, mapping from Web2 course ID to chain ID
    mapping(address => mapping(uint256 => bool)) public userCourses; // User purchase records: user address => course ID => purchased status
    uint256 public courseCount; // Total course count, also used as new course ID

    /**
     * @dev Course purchase event, emitted when user purchases a course
     * @param buyer Buyer address
     * @param courseId Course ID
     * @param web2CourseId Course ID from Web2 platform
     */
    event CoursePurchased(
        address indexed buyer,
        uint256 indexed courseId,
        string web2CourseId
    );
    
    /**
     * @dev Course completion event, emitted when student completes course and receives certificate
     * @param student Student address
     * @param courseId Course ID
     * @param certificateId Issued certificate ID
     */
    event CourseCompleted(
        address indexed student,
        uint256 indexed courseId,
        uint256 certificateId
    );
    
    /**
     * @dev Course addition event, emitted when new course is added to marketplace
     * @param courseId Course ID
     * @param web2CourseId Course ID from Web2 platform
     * @param name Course name
     */
    event CourseAdded(
        uint256 indexed courseId,
        string web2CourseId,
        string name
    );

    event CourseUpdated(
        uint256 indexed courseId,
        string oldWeb2CourseId,
        string newWeb2CourseId,
        string name,
        uint256 price,
        bool isActive
    );

    /**
     * @dev Constructor
     * @param _tokenAddress Geek token contract address
     * @param _certificateAddress Certificate NFT contract address
     */
    constructor(address _tokenAddress, address _certificateAddress) {
        geekToken = GeekToken(payable(_tokenAddress));
        certificate = CourseCertificate(payable(_certificateAddress));
    }

    /**
     * @dev Add new course to marketplace
     * Only contract owner can call this function
     * @param web2CourseId Course ID from Web2 platform
     * @param name Course name
     * @param price Course price in G tokens
     */
    function addCourse(
        string memory web2CourseId,
        string memory name,
        uint256 price
    ) external onlyOwner {
        require(
            bytes(web2CourseId).length > 0,
            "Web2 course ID cannot be empty"
        );
        require(web2ToCourseId[web2CourseId] == 0, "Course already exists");

        courseCount++;

        courses[courseCount] = Course({
            web2CourseId: web2CourseId,
            name: name,
            price: price,
            isActive: true,
            creator: msg.sender
        });

        web2ToCourseId[web2CourseId] = courseCount;

        emit CourseAdded(courseCount, web2CourseId, name);
    }

    /**
     * @dev Update course details
     * Only contract owner can call this function
     * @param oldWeb2CourseId Old course ID from Web2 platform
     * @param newWeb2CourseId New course ID from Web2 platform
     * @param name Course name
     * @param price Course price in G tokens
     */
    function updateCourse(
        string memory oldWeb2CourseId,
        string memory newWeb2CourseId,
        string memory name,
        uint256 price,
        bool isActive
    ) external onlyOwner {
        require(
            bytes(oldWeb2CourseId).length > 0,
            "Old Web2 course ID cannot be empty"
        );
        require(
            bytes(newWeb2CourseId).length > 0,
            "New Web2 course ID cannot be empty"
        );

        uint256 courseId = web2ToCourseId[oldWeb2CourseId];
        require(courseId > 0, "Course does not exist");

        courses[courseId] = Course({
            web2CourseId: newWeb2CourseId,
            name: name,
            price: price,
            isActive: isActive,
            creator: msg.sender
        });

        web2ToCourseId[oldWeb2CourseId] = 0;
        web2ToCourseId[newWeb2CourseId] = courseId;
        emit CourseUpdated(courseId, oldWeb2CourseId, newWeb2CourseId, name, price, isActive);
    }

    /**
     * @dev Purchase course
     * User needs to approve contract to spend their G tokens first
     * @param web2CourseId Course ID from Web2 platform
     */
    function purchaseCourse(string memory web2CourseId) external {
        uint256 courseId = web2ToCourseId[web2CourseId];
        require(courseId > 0, "Course does not exist");

        Course memory course = courses[courseId];
        require(course.isActive, "Course not active");
        require(!userCourses[msg.sender][courseId], "Already purchased");

        // Transfer tokens from user to course creator
        require(
            geekToken.transferFrom(msg.sender, course.creator, course.price),
            "Transfer failed"
        );

        userCourses[msg.sender][courseId] = true;
        emit CoursePurchased(msg.sender, courseId, web2CourseId);
    }

    /**
     * @dev Verify course completion and issue certificate
     * Only contract owner can call this function to confirm student completion
     * @param student Student address
     * @param web2CourseId Course ID from Web2 platform
     */
    function verifyCourseCompletion(
        address student,
        string memory web2CourseId
    ) external onlyOwner {
        uint256 courseId = web2ToCourseId[web2CourseId];
        require(courseId > 0, "Course does not exist");
        require(userCourses[student][courseId], "Course not purchased");
        require(
            !certificate.hasCertificate(student, web2CourseId),
            "Certificate already issued"
        );

        // Generate certificate metadata URI
        string memory metadataURI = generateCertificateURI(
            student,
            web2CourseId
        );
        
        // Mint certificate NFT
        uint256 tokenId = certificate.mintCertificate(
            student,
            web2CourseId,
            metadataURI
        );

        emit CourseCompleted(student, courseId, tokenId);
    }

    /**
     * @dev Batch verify course completion
     * Allows verifying completion and issuing certificates for multiple students at once
     * @param students Array of student addresses
     * @param web2CourseId Course ID from Web2 platform
     */
    function batchVerifyCourseCompletion(
        address[] memory students,
        string memory web2CourseId
    ) external onlyOwner {
        for (uint256 i = 0; i < students.length; i++) {
            // Check if student has purchased course and hasn't received certificate
            if (
                userCourses[students[i]][web2ToCourseId[web2CourseId]] &&
                !certificate.hasCertificate(students[i], web2CourseId)
            ) {
                // Use 'this' keyword to call external function
                this.verifyCourseCompletion(students[i], web2CourseId);
            }
        }
    }

    /**
     * @dev Check if user has purchased course
     * @param user User address
     * @param web2CourseId Course ID from Web2 platform
     * @return bool Returns true if user has purchased the course
     */
    function hasCourse(
        address user,
        string memory web2CourseId
    ) external view returns (bool) {
        uint256 courseId = web2ToCourseId[web2CourseId];
        require(courseId > 0, "Course does not exist");
        return userCourses[user][courseId];
    }

    /**
     * @dev Generate certificate metadata URI
     * Creates URI pointing to certificate metadata containing course ID and student address
     * @param student Student address
     * @param web2CourseId Course ID from Web2 platform
     * @return string Generated metadata URI
     */
    function generateCertificateURI(
        address student,
        string memory web2CourseId
    ) internal pure returns (string memory) {
        return
            string(
                abi.encodePacked(
                    "https://api.geek.com/certificate/",
                    web2CourseId,
                    "/",
                    Strings.toHexString(student)
                )
            );
    }
}
