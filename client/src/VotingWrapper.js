import React, { Component } from "react";
import Token from "./Token";
import Polls from "./Polls";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";

const styles = theme => ({
	root: {
		flexGrow: 1
	},
	paper: {
		color: "primary"
	}
});

class VotingWrapper extends Component {
	constructor(props) {
		super(props);
		this.state = {
			curAccount: 0,
			tokenBalance: 0,
			stakedTokenBalance: 0
		};
		this.changeTokenBalance = this.changeTokenBalance.bind(this);
		this.changeStakedToken = this.changeStakedToken.bind(this);
		this.accountChange = this.accountChange.bind(this);
	}

	async componentDidMount() {
		let tokenBalance = await this.props.votingToken.balanceOf.call(
			this.props.enigmaSetup.accounts[this.state.curAccount],
			{
				from: this.props.enigmaSetup.accounts[this.props.curAccount],
				gas: "1000000"
			}
		);
		let stakedTokenBalance = await this.props.voting.getTokenStake.call(
			this.props.enigmaSetup.accounts[this.state.curAccount],
			{
				from: this.props.enigmaSetup.accounts[this.props.curAccount],
				gas: "1000000"
			}
		);
		this.setState({
			tokenBalance: parseInt(
				this.props.enigmaSetup.web3.utils.fromWei(
					tokenBalance.toString(),
					"ether"
				)
			),
			stakedTokenBalance: parseInt(
				this.props.enigmaSetup.web3.utils.fromWei(
					stakedTokenBalance.toString(),
					"ether"
				)
			)
		});
	}

	/*
  	Update user account
  	*/
	async accountChange(event) {
		let curAccount = event.target.value;
		let tokenBalance = await this.props.votingToken.balanceOf.call(
			this.props.enigmaSetup.accounts[curAccount],
			{
				from: this.props.enigmaSetup.accounts[curAccount],
				gas: "1000000"
			}
		);
		let stakedTokenBalance = await this.props.voting.getTokenStake.call(
			this.props.enigmaSetup.accounts[curAccount],
			{
				from: this.props.enigmaSetup.accounts[curAccount],
				gas: "1000000"
			}
		);
		this.setState({
			tokenBalance: parseInt(
				this.props.enigmaSetup.web3.utils.fromWei(
					tokenBalance.toString(),
					"ether"
				)
			),
			stakedTokenBalance: parseInt(
				this.props.enigmaSetup.web3.utils.fromWei(
					stakedTokenBalance.toString(),
					"ether"
				)
			),
			curAccount
		});
	}

	/*
  	Callback to change token balance for user
  	*/
	changeTokenBalance(tokenBalance) {
		this.setState({ tokenBalance });
	}

	/*
  	Callback to change staked token balance for user
  	*/
	changeStakedToken(stakedTokenBalance) {
		this.setState({ stakedTokenBalance });
	}

	render() {
		const { classes } = this.props;
		return (
			<div>
				<Grid item xs={12}>
					<Paper>
						<div id="dashboard">
							<h3> Dashboard: </h3>
							<List
								style={{
									display: "flex",
									flexDirection: "row"
								}}
							>
								<Grid item xs={4}>
									<label>
										Current Ganache Account:
										<Select
											value={this.state.curAccount}
											onChange={this.accountChange}
											style={{ marginLeft: "10px" }}
										>
											<MenuItem value={0}>0</MenuItem>
											<MenuItem value={1}>1</MenuItem>
											<MenuItem value={2}>2</MenuItem>
											<MenuItem value={3}>3</MenuItem>
											<MenuItem value={4}>4</MenuItem>
											<MenuItem value={5}>5</MenuItem>
											<MenuItem value={6}>6</MenuItem>
											<MenuItem value={7}>7</MenuItem>
											<MenuItem value={8}>8</MenuItem>
										</Select>
									</label>
								</Grid>
								<Grid item xs={4}>
									<label>
										Current Token Balance:{" "}
										{this.state.tokenBalance}
									</label>
								</Grid>
								<Grid item xs={4}>
									<label>
										Number of Staked Tokens:{" "}
										{this.state.stakedTokenBalance}
									</label>
								</Grid>
							</List>
						</div>
					</Paper>
				</Grid>
				<br />
				<Grid container className={classes.root} spacing={16}>
					<Grid item xs={2}>
						<Paper className={classes.paper}>
							<Token
								enigmaSetup={this.props.enigmaSetup}
								tokenFactory={this.props.tokenFactory}
								voting={this.props.voting}
								votingToken={this.props.votingToken}
								updateToken={this.changeTokenBalance}
								updateStake={this.changeStakedToken}
								tokenBalance={this.state.tokenBalance}
								stakedTokenBalance={
									this.state.stakedTokenBalance
								}
								curAccount={this.state.curAccount}
							/>
						</Paper>
					</Grid>
					<Grid item xs={10}>
						<Paper className={classes.paper}>
							<Polls
								enigmaSetup={this.props.enigmaSetup}
								voting={this.props.voting}
								tokenBalance={this.state.tokenBalance}
								curAccount={this.state.curAccount}
							/>
						</Paper>
					</Grid>
				</Grid>
			</div>
		);
	}
}

VotingWrapper.propTypes = {
	classes: PropTypes.object.isRequired
};

export default withStyles(styles)(VotingWrapper);
