import React, { Component } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import { Message } from "semantic-ui-react";
import AddMillionaireDialog from "./AddMillionaireDialog";
const engUtils = require("./lib/enigma-utils");
// Specify the signature for the callable and callback functions, make sure there are NO spaces
const CALLABLE = "computeRichest(address[],uint[])";
const CALLBACK = "setRichestAddress(address)";
const ENG_FEE = 1;
const GAS = "1000000";

const styles = theme => ({
	button: {
		display: "block",
		marginTop: theme.spacing.unit * 2
	}
});

class MillionairesProblemWrapper extends Component {
	constructor(props) {
		super(props);
		this.state = {
			numMillionaires: null,
			richestAddress: "TBD"
		};
		this.handleSubmit = this.handleSubmit.bind(this);
		this.addMillionaire = this.addMillionaire.bind(this);
	}

	componentDidMount = async () => {
		/*
		Check if we have an instance of the MillionairesProblem deployed or not before
		we call any functions on it
		*/
		if (this.props.millionairesProblem != null) {
			let numMillionaires = await this.props.millionairesProblem.numMillionaires.call();
			numMillionaires = numMillionaires.toNumber();
			this.setState({ numMillionaires });
		}
	};

	// Handles re-rendering if we've created a new MillionairesProblem (callback resides in parent)
	async componentWillReceiveProps(nextProps) {
		if (this.props.millionairesProblem != nextProps.millionairesProblem) {
			this.setState({ numMillionaires: 0, richestAddress: "TBD" });
		}
	}

	/*
	Callback for adding a new millionaire. Note that we are encrypting data 
	(address and net worth) in this function and pass in those values to the contract
	*/
	async addMillionaire(address, netWorth) {
		let encryptedAddress = getEncryptedValue(address);
		let encryptedNetWorth = getEncryptedValue(netWorth);
		await this.props.millionairesProblem.addMillionaire(
			encryptedAddress,
			encryptedNetWorth,
			{ from: this.props.enigmaSetup.accounts[0], gas: GAS }
		);
		let numMillionaires = await this.props.millionairesProblem.numMillionaires.call();
		numMillionaires = numMillionaires.toNumber();
		this.setState({ numMillionaires });
	}

	/*
	Creates an Enigma task to be computed by the network.
	*/
	async enigmaTask() {
		let numMillionaires = await this.props.millionairesProblem.numMillionaires.call();
		let encryptedAddresses = [];
		let encryptedNetWorths = [];
		// Loop through each millionaire to construct a list of encrypted addresses and net worths
		for (let i = 0; i < numMillionaires; i++) {
			// Obtain the encrypted address and net worth for a particular millionaire
			let encryptedValue = await this.props.millionairesProblem.getInfoForMillionaire.call(
				i
			);
			encryptedAddresses.push(encryptedValue[0]);
			encryptedNetWorths.push(encryptedValue[1]);
		}
		let blockNumber = await this.props.enigmaSetup.web3.eth.getBlockNumber();
		/*
		Take special note of the arguments passed in here (blockNumber, dappContractAddress, 
		callable, callableArgs, callback, fee, preprocessors). This is the critical step for how
		you run the secure computation from your front-end!!!
		*/
		let task = await this.props.enigmaSetup.enigma.createTask(
			blockNumber,
			this.props.millionairesProblem.address,
			CALLABLE,
			[encryptedAddresses, encryptedNetWorths],
			CALLBACK,
			ENG_FEE,
			[]
		);
		let resultFee = await task.approveFee({
			from: this.props.enigmaSetup.accounts[0],
			gas: GAS
		});
		let result = await task.compute({
			from: this.props.enigmaSetup.accounts[0],
			gas: GAS
		});
		console.log("got tx:", result.tx, "for task:", task.taskId, "");
		console.log("mined on block:", result.receipt.blockNumber);
	}

	// onClick listener for Check Richest button, will call the enigmaTask from here
	async handleSubmit(event) {
		event.preventDefault();
		let richestAddress = "Computing richest...";
		this.setState({ richestAddress });
		// Run the enigma task secure computation above
		await this.enigmaTask();
		// Watch for event and update state once callback is completed/event emitted
		const callbackFinishedEvent = this.props.millionairesProblem.CallbackFinished();
		callbackFinishedEvent.watch(async (error, result) => {
			richestAddress = await this.props.millionairesProblem.richestMillionaire.call();
			this.setState({ richestAddress });
		});
	}

	render() {
		const { classes } = this.props;
		if (this.state.numMillionaires == null) {
			return (
				<div>
					<Button onClick={this.props.onCreateNewMillionaresProblem}>
						{"Create New Millionaires' Problem"}
					</Button>
				</div>
			);
		} else {
			return (
				<div>
					<Button
						onClick={this.props.onCreateNewMillionaresProblem}
						variant="contained"
					>
						{"Create New Millionaires' Problem"}
					</Button>
					<h2>Num Millionaires = {this.state.numMillionaires}</h2>
					<h2>Richest Millionaire = {this.state.richestAddress}</h2>
					<AddMillionaireDialog
						accounts={this.props.enigmaSetup.accounts}
						onAddMillionaire={this.addMillionaire}
					/>
					<br />
					<Button
						onClick={this.handleSubmit}
						disabled={this.state.numMillionaires == 0}
						variant="contained"
						color="secondary"
					>
						Check Richest
					</Button>
				</div>
			);
		}
	}
}

// Function to encrypt values (in this case either address or net worth)
function getEncryptedValue(value) {
	let clientPrivKey =
		"853ee410aa4e7840ca8948b8a2f67e9a1c2f4988ff5f4ec7794edf57be421ae5";
	let enclavePubKey =
		"0061d93b5412c0c99c3c7867db13c4e13e51292bd52565d002ecf845bb0cfd8adfa5459173364ea8aff3fe24054cca88581f6c3c5e928097b9d4d47fce12ae47";
	let derivedKey = engUtils.getDerivedKey(enclavePubKey, clientPrivKey);
	let encrypted = engUtils.encryptMessage(derivedKey, value);

	return encrypted;
}

MillionairesProblemWrapper.propTypes = {
	classes: PropTypes.object.isRequired
};

export default withStyles(styles)(MillionairesProblemWrapper);
