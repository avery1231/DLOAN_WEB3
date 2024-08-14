// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BasicNft is ERC721, Ownable {
    uint256 private s_tokenCounter;
    // example TOKEN_URI
    string public constant TOKEN_URI =
        "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json";

    constructor() ERC721("ARNO", "ARN") {
        s_tokenCounter = 0;
    }

    function safeMint() public {
        s_tokenCounter = s_tokenCounter + 1;
        _safeMint(msg.sender, s_tokenCounter);
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    function transferNft(address from, address _to, uint256 _tokenId) public {
        safeTransferFrom(from, _to, _tokenId);
    }

    function ownerOfNft(uint256 tokenId) public view returns (address) {
        return ownerOf(tokenId);
    }

    function tokenURI(uint256 tokenId) public pure override returns (string memory) {
        // require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        return TOKEN_URI;
    }

    function giveApproval(address to, uint256 tokenId) public {
        approve(to, tokenId);
    }
}
