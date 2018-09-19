import React, { Component } from "react";
import Token from "./Token";
import Poll from "./Poll";
import Vote from "./Vote";
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
			curPoll: 0, // global counter of which poll ID were are on
			curAccount: 0,
			tokenBalances: new Array(10).fill(0),
			stakedTokens: new Array(10).fill(0)
		};
		this.changeTokenBalances = this.changeTokenBalances.bind(this);
		this.changeStakedTokens = this.changeStakedTokens.bind(this);
		this.accountChange = this.accountChange.bind(this);
		this.incrementCurPoll = this.incrementCurPoll.bind(this);
	}

	/*
   * Update the account used by the dApp.
   */
	accountChange(event) {
		this.setState({ curAccount: event.target.value });
	}

	/*
   * Update the token balances.
   */
	changeTokenBalances(balances) {
		this.setState({ tokenBalances: balances });
	}

	changeStakedTokens(tokens) {
		this.setState({ stakedTokens: tokens });
	}

	/*
   * Increment the poll ID by 1.
   */
	incrementCurPoll() {
		this.setState({ curPoll: parseInt(this.state.curPoll) + parseInt(1) });
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
								<Grid item xs={3}>
									<label>
										{" "}
										Current Poll ID: {
											this.state.curPoll
										}{" "}
									</label>{" "}
									<br />
								</Grid>
								<Grid item xs={3}>
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
								<Grid item xs={3}>
									<label>
										{" "}
										Current Token Balance:{" "}
										{
											this.state.tokenBalances[
												this.state.curAccount
											]
										}{" "}
									</label>
								</Grid>
								<Grid item xs={3}>
									<label>
										{" "}
										Number of Staked Tokens:{" "}
										{
											this.state.stakedTokens[
												this.state.curAccount
											]
										}{" "}
									</label>
								</Grid>
							</List>
						</div>
					</Paper>
				</Grid>
				<br />
				<Grid container className={classes.root} spacing={16}>
					<Grid item xs={4}>
						<Paper className={classes.paper}>
							<Token
								enigmaSetup={this.props.enigmaSetup}
								tokenFactory={this.props.tokenFactory}
								voting={this.props.voting}
								votingToken={this.props.votingToken}
								updateToken={this.changeTokenBalances}
								updateStake={this.changeStakedTokens}
								tokenBalances={this.state.tokenBalances}
								stakedTokens={this.state.stakedTokens}
								curAccount={this.state.curAccount}
							/>
						</Paper>
					</Grid>
					<Grid item xs={4}>
						<Paper className={classes.paper}>
							<Poll
								enigmaSetup={this.props.enigmaSetup}
								voting={this.props.voting}
								update={this.incrementCurPoll}
								tokenBalances={this.state.tokenBalances}
								curAccount={this.state.curAccount}
							/>
						</Paper>
					</Grid>
					<Grid item xs={4}>
						<Paper className={classes.paper}>
							<Vote
								enigmaSetup={this.props.enigmaSetup}
								voting={this.props.voting}
								update={this.changeTokenBalances}
								tokenBalances={this.state.tokenBalances}
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
