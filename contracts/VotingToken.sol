pragma solidity ^0.4.24;


import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";

// Make Voting token a Mintable token
contract VotingToken is MintableToken {
  string public name = "Voting Token";
  string public symbol = "VOTE";
  uint256 public decimals = 18;
}