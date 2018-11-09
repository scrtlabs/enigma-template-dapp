pragma solidity ^0.4.24;


import "./VotingToken.sol";

contract TokenFactory {
  address owner;  // where the Ether contributions are sent to
  uint public totalMinted;  // keep a tab on the number of voting tokens minted
  VotingToken public token;

  // NOTE: defines number of tokens minted, not ether spent
  event Contribution(address contributer, uint amount);

  // Constructor to initialize new voting token
  constructor(address _token) public {
    owner = msg.sender;
    token = VotingToken(_token);
  }

  // Allow a user to pay for voting tokens with ether
  function contribute() external payable {
    require(msg.value > 0, "User sent no ether.");
    owner.transfer(msg.value);  
    // Arbitrary exchange rate of 10 voting tokens for 1 ETH
    uint amount = msg.value * 10;  
    token.mint(msg.sender, amount); 
    totalMinted += amount;
    emit Contribution(msg.sender, amount);
  }

  function() external payable {
    revert();
  }
}