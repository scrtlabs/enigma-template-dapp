import React, { Component } from "react";
import "./App.css";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import Divider from "@material-ui/core/Divider";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Notifier, { openSnackbar } from "./Notifier";

const GAS = "1000000";

const styles = theme => ({
  button: {
    marginLeft: "10px"
  },
  textField: {
    marginLeft: "10px",
    width: "90px"
  }
});

class Token extends Component {
  constructor(props) {
    super(props);
    this.state = {
      curTokenPurchase: 0,
      withdrawValue: 0,
      stakeAmount: 0
    };
    this.tokenPurchase = this.tokenPurchase.bind(this);
    this.withdraw = this.withdraw.bind(this);
    this.stakeTokens = this.stakeTokens.bind(this);
    this.handleChangeTokenPurchase = this.handleChangeTokenPurchase.bind(this);
    this.handleChangeStakeAmount = this.handleChangeStakeAmount.bind(this);
    this.handleChangeWithdrawValue = this.handleChangeWithdrawValue.bind(this);
  }

  // onChange listener to update state with user-input token purchase amount
  handleChangeTokenPurchase(event) {
    this.setState({ curTokenPurchase: parseInt(event.target.value) });
  }
  // onChange listener to update state with user-input stake amount
  handleChangeStakeAmount(event) {
    this.setState({ stakeAmount: parseInt(event.target.value) });
  }
  // onChange listener to update state with user-input withdraw value
  handleChangeWithdrawValue(event) {
    this.setState({ withdrawValue: parseInt(event.target.value) });
  }

  /*
  Allow user to purchase tokens
  */
  async tokenPurchase(event) {
    if (event) event.preventDefault();

    try {
      await this.props.tokenFactory.contribute({
        from: this.props.enigmaSetup.accounts[this.props.curAccount],
        value: this.props.enigmaSetup.web3.utils.toWei(
          String(this.state.curTokenPurchase / 10),
          "ether"
        ),
        gas: GAS
      });
      let tokenBalance = this.props.tokenBalance + this.state.curTokenPurchase;
      this.props.updateToken(tokenBalance);

      openSnackbar({ message: "You have successfully purchased tokens." });
      document.getElementById("token_form").reset();
    } catch (e) {
      console.log(e);
      openSnackbar({ message: e });
    }
  }

  /*
  Allow user to withdraw tokens
  */
  async withdraw(event) {
    if (event) event.preventDefault();
    // withdraw tokens

    try {
      let amount = this.props.enigmaSetup.web3.utils.toWei(
        String(this.state.withdrawValue),
        "ether"
      );
      await this.props.voting.withdrawTokens(amount, {
        from: this.props.enigmaSetup.accounts[this.props.curAccount],
        gas: GAS
      });
      let balance = this.props.tokenBalance + this.state.withdrawValue;
      this.props.updateToken(balance);

      let staked = this.props.stakedTokenBalance - this.state.withdrawValue;
      this.props.updateStake(staked);

      openSnackbar({ message: "You have successfully withdrawn tokens." });
      document.getElementById("withdraw_form").reset();
    } catch (e) {
      console.log(e);
      openSnackbar({ message: e });
    }
  }

  /*
  Allow user to stake tokens to voting contract
  */
  async stakeTokens(event) {
    if (event) event.preventDefault();
    try {
      // Approve transfer
      await this.props.votingToken.approve(
        this.props.voting.address,
        this.props.enigmaSetup.web3.utils.toWei(
          String(this.state.stakeAmount),
          "ether"
        ),
        {
          from: this.props.enigmaSetup.accounts[this.props.curAccount],
          gas: GAS
        }
      );
      let amount = this.props.enigmaSetup.web3.utils.toWei(
        String(this.state.stakeAmount),
        "ether"
      );
      await this.props.voting.stakeVotingTokens(parseInt(amount), {
        from: this.props.enigmaSetup.accounts[this.props.curAccount],
        gas: GAS
      });
      let balance = this.props.tokenBalance - this.state.stakeAmount;
      this.props.updateToken(balance);

      // update staked token balance
      let staked = this.props.stakedTokenBalance + this.state.stakeAmount;
      this.props.updateStake(staked);
      openSnackbar({ message: "You have successfully staked tokens." });
      document.getElementById("stake_form").reset();
    } catch (e) {
      console.log(e);
      openSnackbar({ message: e });
    }
  }

  render() {
    const { classes } = this.props;
    return (
      <div>
        <Notifier />
        <h3> Tokens Operations: </h3>
        <List component="nav" disablePadding={true}>
          <ListItem>
            <form onSubmit={this.tokenPurchase} id="token_form">
              <label> Purchase voting tokens: </label>
              <TextField
                className={classes.textField}
                placeholder="Amount"
                onChange={this.handleChangeTokenPurchase}
              />
              <Button
                className={classes.button}
                type="submit"
                variant="outlined"
                size="small"
              >
                Purchase
              </Button>
            </form>
          </ListItem>
          <Divider />

          <ListItem>
            <form onSubmit={this.stakeTokens} id="stake_form">
              <label> Stake voting tokens: </label>
              <TextField
                className={classes.textField}
                placeholder="Amount"
                onChange={this.handleChangeStakeAmount}
              />
              <Button
                className={classes.button}
                type="submit"
                variant="outlined"
                size="small"
              >
                Stake
              </Button>
            </form>
          </ListItem>
          <Divider />

          <ListItem>
            <form onSubmit={this.withdraw} id="withdraw_form">
              <label> Withdraw voting tokens: </label>
              <TextField
                className={classes.textField}
                placeholder="Amount"
                onChange={this.handleChangeWithdrawValue}
              />
              <Button
                className={classes.button}
                type="submit"
                variant="outlined"
                size="small"
              >
                Withdraw
              </Button>
            </form>
          </ListItem>
        </List>
      </div>
    );
  }
}

Token.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Token);
