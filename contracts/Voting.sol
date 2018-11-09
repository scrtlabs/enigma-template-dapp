pragma solidity ^0.4.24;


import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./VotingToken.sol";

contract Voting {
  using SafeMath for uint;

  // Array of Poll structs
  Poll[] public polls;
  // Mapping of TokenManager structs for users
  mapping(address => TokenManager) public bank;
  // Number of polls that have been created
  uint public pollCount;
  // Mintable VotingToken
  VotingToken public token;
  address public enigma;

  // Voter struct which holds, most notably, the weight and encrypted vote
  struct Voter {
    bool hasVoted;
    bytes vote;
    uint weight;
  }

  // Poll struct which holds poll information, including mapping of voterInfo 
  struct Poll {
    address creator;
    PollStatus status;
    uint quorumPercentage;
    uint yeaVotes;
    uint nayVotes;
    string description;
    address[] voters;
    uint expirationTime;
    mapping(address => Voter) voterInfo;
  }

  // Token manager struct holding address' token information 
  struct TokenManager {
    // Address' token balance
    uint tokenBalance;
    // Mapping of address' locked token count in any given active poll
    mapping(uint => uint) lockedTokens;
    // Array of polls address has participated in 
    uint[] participatedPolls;
  }

  // Event emitted upon casting a vote
  event VoteCasted(address voter, uint pollID, bytes vote, uint weight);
  // Event emitted upon creating a poll
  event PollCreated(address creator, uint pollID, uint quorumPercentage, 
    string description, uint votingLength);
  // Event emitted upon callback completion; watched from front end
  event PollStatusUpdate(bool status);

  // Enum for current state of a poll
  enum PollStatus { IN_PROGRESS, PASSED, REJECTED }

  // Modifier to ensure the poll id is a valid one
  modifier validPoll(uint _pollID) {
    require(_pollID >= 0 && _pollID < pollCount, "Not a valid poll Id.");
    _;
  }

  // Modifier to ensure only enigma contract can call function
  modifier onlyEnigma() {
    require(msg.sender == enigma);
    _;
  }

  // Constructor called when new contract is deployed
  constructor(address _token, address _enigma) public {
    require(_token != 0 && address(token) == 0);
    require(_enigma != 0 && address(enigma) == 0);
    token = VotingToken(_token);
    enigma = _enigma;
  }

  // ** POLL OPERATIONS ** //
  // Create new poll with quorum percentage, description, and vote length (s)
  function createPoll(uint _quorumPct, string _description, uint _voteLength) 
    external 
    returns (uint)
  {
    require(_quorumPct <= 100, 
      "Quorum Percentage must be less than or equal to 100%");
    require(_voteLength > 0, "The voting period cannot be 0.");
    Poll memory curPoll;
    curPoll.creator = msg.sender;
    curPoll.status = PollStatus.IN_PROGRESS;
    curPoll.quorumPercentage = _quorumPct;
    curPoll.description = _description;
    curPoll.expirationTime = now + _voteLength * 1 seconds;
    polls.push(curPoll);
    pollCount++; 
    emit PollCreated(msg.sender, pollCount, _quorumPct, _description, 
      _voteLength); 
    return pollCount; 
  }

  // Get the status of a poll
  function getPollStatus(uint _pollID) 
    public 
    view 
    validPoll(_pollID) 
    returns (PollStatus) 
  {
    return polls[_pollID].status;
  }

  // Get the expiration date of a poll
  function getPollExpirationTime(uint _pollID) 
    public 
    view
    validPoll(_pollID) 
    returns (uint) 
  {
    return polls[_pollID].expirationTime;
  }

  // Get list of polls user has voted in
  function getPollHistory(address _voter) public view returns(uint[]) {
    return bank[_voter].participatedPolls;
  }

  // Get encrypted vote and weight for a particular poll and user
  function getPollInfoForVoter(uint _pollID, address _voter) 
    public 
    view 
    validPoll(_pollID) 
    returns (bytes, uint) 
  {
    require(userHasVoted(_pollID, _voter));
    Poll storage curPoll = polls[_pollID];
    bytes vote = curPoll.voterInfo[_voter].vote;
    uint weight = curPoll.voterInfo[_voter].weight;
    return (vote, weight);
  }

  // Get all the voters for a particular poll
  function getVotersForPoll(uint _pollID) 
    public 
    view 
    validPoll(_pollID) 
    returns (address[]) 
  {
    return polls[_pollID].voters;
  }

  // ** VOTE OPERATIONS ** //
  // Cast a vote for a poll with encrypted vote and weight arguments
  function castVote(uint _pollID, bytes _encryptedVote, uint _weight) 
    external 
    validPoll(_pollID) 
  {
    require(getPollStatus(_pollID) == PollStatus.IN_PROGRESS, 
      "Poll has expired.");
    require(!userHasVoted(_pollID, msg.sender), "User has already voted.");
    require(getPollExpirationTime(_pollID) > now);
    require(getTokenStake(msg.sender) >= _weight, 
      "User does not have enough staked tokens.");
    require(_weight > 0, "User must add a weight for the vote"); 
    bank[msg.sender].lockedTokens[_pollID] = _weight;
    bank[msg.sender].participatedPolls.push(_pollID);
    Poll storage curPoll = polls[_pollID];
    curPoll.voterInfo[msg.sender] = Voter({
        hasVoted: true,
        vote: _encryptedVote,
        weight: _weight
    });
    curPoll.voters.push(msg.sender);
    emit VoteCasted(msg.sender, _pollID, _encryptedVote, _weight);
  }

  // Check if user has voted in a specific poll
  function userHasVoted(uint _pollID, address _user) 
    public 
    view 
    validPoll(_pollID) 
    returns (bool) 
  {
    return (polls[_pollID].voterInfo[_user].hasVoted);
  }

  // ** TOKEN OPERATIONS ** //
  // Stake voting tokens in contract
  function stakeVotingTokens(uint _numTokens) external {
    require(token.balanceOf(msg.sender) >= _numTokens, 
      "User does not have enough tokens");
    require(token.transferFrom(msg.sender, this, _numTokens), 
      "User did not approve token transfer.");
    bank[msg.sender].tokenBalance += _numTokens;
  }

  // Withdraw voting tokens from contract
  function withdrawTokens(uint _numTokens) external {
    uint largest = getLockedAmount(msg.sender);
    require(getTokenStake(msg.sender) - largest >= _numTokens, 
      "User is trying to withdraw too many tokens.");
    bank[msg.sender].tokenBalance -= _numTokens;
    require(token.transfer(msg.sender, _numTokens));
  }

  // Get locked token amount for a voter due to active polls
  function getLockedAmount(address _voter) public view returns (uint) {
    TokenManager storage manager = bank[_voter];
    uint largest;
    for (uint i = 0; i < manager.participatedPolls.length; i++) {
      uint curPollID = manager.participatedPolls[i];
      if (manager.lockedTokens[curPollID] > largest) {
        largest = manager.lockedTokens[curPollID];
      } 
    }
    return largest;
  }

  // Get staked token amount in voting contract
  function getTokenStake(address _voter) public view returns(uint) {
    return bank[_voter].tokenBalance;
  }

  // Helper function to update active token balances after poll has ended
  function updateTokenBank(uint _pollID) internal {
    Poll memory curPoll = polls[_pollID];
    for (uint i = 0; i < curPoll.voters.length; i++) {
      address voter = curPoll.voters[i];
      bank[voter].lockedTokens[_pollID] = 0;
    }
  }

  /*
  CALLABLE FUNCTION run in SGX to decipher encrypted votes and weights to 
  tally results of poll
  */
  function countVotes(uint _pollID, uint[] _votes, uint[] _weights) 
    public 
    pure 
    returns (uint, uint, uint) 
  {
    require(_votes.length == _weights.length);
    uint yeaVotes;
    uint nayVotes;
    for (uint i = 0; i < _votes.length; i++) {
      if (_votes[i] == 0) nayVotes += _weights[i];
      else if (_votes[i] == 1) yeaVotes += _weights[i];
    }
    return (_pollID, yeaVotes, nayVotes);
  }

  /*
  CALLBACK FUNCTION to change contract state with poll results
  */
  function updatePollStatus(uint _pollID, uint _yeaVotes, uint _nayVotes) 
    public 
    validPoll(_pollID) 
    onlyEnigma() 
  {
    Poll storage curPoll = polls[_pollID];
    curPoll.yeaVotes = _yeaVotes;
    curPoll.nayVotes = _nayVotes;
    bool pollStatus = (curPoll.yeaVotes.mul(100)) > 
      curPoll.quorumPercentage.mul(curPoll.yeaVotes.add(curPoll.nayVotes));
    if (pollStatus) {
      curPoll.status = PollStatus.PASSED;
    }
    else {
      curPoll.status = PollStatus.REJECTED;
    }
    updateTokenBank(_pollID);
    emit PollStatusUpdate(pollStatus);
  }
}