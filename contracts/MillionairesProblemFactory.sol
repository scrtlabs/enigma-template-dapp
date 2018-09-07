pragma solidity ^0.4.17; 
import "./MillionairesProblem.sol";


contract MillionairesProblemFactory {
	address public enigmaAddress; 
	// List of addresses for deployed MillionaireProblem instances
	address[] public millionairesProblems; 

	constructor(address _enigmaAddress) public {
		enigmaAddress = _enigmaAddress; 
	}

	// Create a new MillionaireProblem and store address to array
	function createNewMillionairesProblem() public {
		address newMillionairesProblem = new MillionairesProblem(
			enigmaAddress, 
			msg.sender
		);
		millionairesProblems.push(newMillionairesProblem); 
	}

	// Obtain list of all deployed MillionaireProblem instances
	function getMillionairesProblems() public view returns (address[]) {
		return millionairesProblems; 
	}	 
}