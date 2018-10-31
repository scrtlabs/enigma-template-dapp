import React, { Component } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TablePagination from "@material-ui/core/TablePagination";
import TableRow from "@material-ui/core/TableRow";
import TableSortLabel from "@material-ui/core/TableSortLabel";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import AutorenewIcon from "@material-ui/icons/Autorenew";
import CancelIcon from "@material-ui/icons/Cancel";
import ThumbUpIcon from "@material-ui/icons/ThumbUp";
import ThumbDownIcon from "@material-ui/icons/ThumbDown";
import DoneIcon from "@material-ui/icons/Done";
import CloseIcon from "@material-ui/icons/Close";
import Input from "@material-ui/core/Input";
import TextField from "@material-ui/core/TextField";
import Tooltip from "@material-ui/core/Tooltip";
import AddPoll from "./AddPoll";
import Timer from "./Timer";
import Notifier, { openSnackbar } from "./Notifier";
const engUtils = require("./lib/enigma-utils");
const CALLABLE = "countVotes(uint,uint[],uint[])";
const CALLBACK = "updatePollStatus(uint,uint,uint)";
const ENG_FEE = 1;
const GAS = "1000000";

const styles = theme => ({
  root: {
    width: "100%",
    backgroundColor: theme.palette.background.paper
  },
  icon: {
    margin: theme.spacing.unit
  },
  textField: {
    margin: theme.spacing.unit,
    width: 50
  },
  fab: {
    margin: theme.spacing.unit * 2
  }
});

class Polls extends Component {
  constructor(props) {
    super(props);
    this.state = {
      polls: []
    };
    this.createPoll = this.createPoll.bind(this);
    this.castVote = this.castVote.bind(this);
    this.handleChangeVoteStake = this.handleChangeVoteStake.bind(this);
    this.handleTimerEnd = this.handleTimerEnd.bind(this);
  }

  async populatePolls() {
    /*
    Check if we have an instance of the voting deployed or not before
    we call any functions on it
    */
    if (this.props.voting != null) {
      let polls = [];
      let pollCount = await this.props.voting.pollCount.call({
        from: this.props.enigmaSetup.accounts[this.props.curAccount],
        gas: GAS
      });
      for (let i = 0; i < pollCount; i++) {
        let poll = await this.props.voting.polls.call(i, {
          from: this.props.enigmaSetup.accounts[this.props.curAccount],
          gas: GAS
        });
        let userHasVoted;
        try {
          userHasVoted = await this.props.voting.userHasVoted.call(
            i,
            this.props.enigmaSetup.accounts[this.props.curAccount],
            {
              from: this.props.enigmaSetup.accounts[this.props.curAccount],
              gas: GAS
            }
          );
        } catch (e) {
          console.log(e);
          openSnackbar({ message: e });
          userHasVoted = null;
        }

        let status = poll[1].toNumber();
        let quorumPercentage = poll[2].toNumber();
        let description = poll[5];
        let expirationTime = poll[6].toNumber();
        polls.push({
          id: i,
          status,
          quorumPercentage,
          description,
          expirationTime,
          userHasVoted,
          stake: "0"
        });
      }
      this.setState({ polls });
    }
  }

  async componentDidMount() {
    await this.populatePolls();
  }

  // Handles re-rendering if we've changed the current account
  async componentWillReceiveProps(nextProps) {
    if (this.props.curAccount != nextProps.curAccount) {
      await this.populatePolls();
    }
  }

  /*
  Create a new poll
  */
  async createPoll(quorumPercentage, description, votingPeriod) {
    await this.props.voting.createPoll(
      quorumPercentage,
      description,
      votingPeriod,
      { from: this.props.enigmaSetup.accounts[this.props.curAccount], gas: GAS }
    );
    let pollCount = await this.props.voting.pollCount.call({
      from: this.props.enigmaSetup.accounts[this.props.curAccount],
      gas: GAS
    });
    const { polls } = this.state;
    if (pollCount > polls.length) {
      let poll = await this.props.voting.polls.call(pollCount - 1, {
        from: this.props.enigmaSetup.accounts[this.props.curAccount],
        gas: GAS
      });
      let status = poll[1].toNumber();
      let quorumPercentage = poll[2].toNumber();
      let description = poll[5];
      let expirationTime = poll[6].toNumber();
      polls.push({
        id: pollCount - 1,
        status,
        quorumPercentage,
        description,
        expirationTime,
        userHasVoted: false,
        stake: "0"
      });
      this.setState({ polls });
    }
  }

  /*
  Return remaining seconds in rounded down
  */
  formatDate(date) {
    let d = new Date(date);
    let timeRemainingInSeconds = (d - Date.now()) / 1000;
    return Math.floor(timeRemainingInSeconds);
  }

  /*
  Cast an encrypted vote
  */
  async castVote(pollID, vote) {
    let encryptedVote = getEncryptedValue(
      this.props.enigmaSetup.web3.utils.toBN(vote)
    );
    try {
      await this.props.voting.castVote(
        pollID,
        encryptedVote,
        parseInt(
          this.props.enigmaSetup.web3.utils.toWei(
            this.state.polls[pollID].stake,
            "ether"
          )
        ),
        {
          from: this.props.enigmaSetup.accounts[this.props.curAccount],
          gas: GAS
        }
      );
      const { polls } = this.state;
      polls[pollID].userHasVoted = true;
      this.setState({ polls });
      console.log(
        "User (" +
          this.props.enigmaSetup.accounts[this.props.curAccount] +
          ") has voted with this encrypted vote: " +
          encryptedVote
      );
    } catch (e) {
      console.log(e);
      openSnackbar({ message: e });
    }
  }

  /*
   * Creates an Enigma task to be computed by the network.
   */
  async enigmaTask(pollID) {
    let poll = await this.props.voting.polls.call(pollID, {
      from: this.props.enigmaSetup.accounts[this.props.curAccount],
      gas: GAS
    });
    let pollCreator = poll[0];
    let voters = await this.props.voting.getVotersForPoll.call(pollID, {
      from: pollCreator,
      gas: GAS
    });
    let encryptedVotes = [];
    let weights = [];
    if (voters.length === 0) {
      encryptedVotes.push(getEncryptedValue(0));
      weights.push(0);
    }
    // get votes and weights for each voter
    for (let i = 0; i < voters.length; i++) {
      let pollInfoForVoter = await this.props.voting.getPollInfoForVoter.call(
        pollID,
        voters[i],
        {
          from: pollCreator,
          gas: GAS
        }
      );
      encryptedVotes.push(pollInfoForVoter[0]);
      let weight = this.props.enigmaSetup.web3.utils.toBN(
        this.props.enigmaSetup.web3.utils.fromWei(
          String(pollInfoForVoter[1].toNumber()),
          "Ether"
        )
      );
      weights.push(weight);
    }

    let blockNumber = await this.props.enigmaSetup.web3.eth.getBlockNumber();
    /*
    Take special note of the arguments passed in here (blockNumber, dappContractAddress, 
    callable, callableArgs, callback, fee, preprocessors). This is the critical step for how
    you run the secure computation from your front-end!!!
    */
    let task = await this.props.enigmaSetup.enigma.createTask(
      blockNumber,
      this.props.voting.address,
      CALLABLE,
      [pollID, encryptedVotes, weights],
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

  // onChange listener to update state with user-input vote weight
  handleChangeVoteStake(pollID, event) {
    const { polls } = this.state;
    polls[pollID].stake = event.target.value;
    this.setState({ polls });
  }

  // onChange listener to trigger enigma task when poll has ended
  async handleTimerEnd(pollID) {
    const { polls } = this.state;
    await this.enigmaTask(pollID);
    const pollStatusUpdateEvent = this.props.voting.pollStatusUpdate();
    pollStatusUpdateEvent.watch(async (error, result) => {
      let pollStatus = await this.props.voting.getPollStatus.call(pollID, {
        from: this.props.enigmaSetup.accounts[this.props.curAccount],
        gas: GAS
      });

      polls[pollID].status = pollStatus;
      this.setState({ polls });
    });
  }

  render() {
    const { classes } = this.props;
    const { polls } = this.state;
    return (
      <div className={classes.root}>
        <Notifier />
        <AddPoll onCreatePoll={this.createPoll} />
        <div className={classes.tableWrapper}>
          <Table className={classes.table} aria-labelledby="tableTitle">
            <TableHead>
              <TableRow>
                <TableCell numeric>Vote</TableCell>
                <TableCell>Stake</TableCell>
                <TableCell>Description</TableCell>
                <TableCell numeric>Quorum %</TableCell>
                <TableCell numeric>Time Remaining (s)</TableCell>
                <TableCell>Result</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {polls.concat().map(n => {
                return (
                  <TableRow hover role="checkbox" tabIndex={-1} key={n.id}>
                    <TableCell numeric>
                      {n.userHasVoted ? (
                        <Tooltip title="Voted">
                          <DoneIcon />
                        </Tooltip>
                      ) : n.status === 0 ? (
                        <span>
                          <Tooltip title="Vote Yes">
                            <ThumbUpIcon
                              onClick={() => {
                                this.castVote(n.id, 1);
                              }}
                              className={classes.icon}
                            />
                          </Tooltip>
                          <Tooltip title="Vote No">
                            <ThumbDownIcon
                              onClick={() => {
                                this.castVote(n.id, 0);
                              }}
                              className={classes.icon}
                            />
                          </Tooltip>
                        </span>
                      ) : (
                        <Tooltip title="Did not vote">
                          <CloseIcon />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>
                      <TextField
                        id="stake-{n.id}"
                        type="number"
                        default={0}
                        onChange={this.handleChangeVoteStake.bind(this, n.id)}
                        autoComplete="off"
                        className={classes.textField}
                      />
                    </TableCell>
                    <TableCell>{n.description}</TableCell>
                    <TableCell numeric>{n.quorumPercentage}</TableCell>
                    <TableCell numeric>
                      {n.status === 0 ? (
                        <Timer
                          timeRemainingInSeconds={this.formatDate(
                            n.expirationTime * 1000
                          )}
                          pollID={n.id}
                          onCompletion={this.handleTimerEnd}
                        />
                      ) : n.status === 1 ? (
                        "Tallying"
                      ) : (
                        "Poll Expired"
                      )}
                    </TableCell>
                    <TableCell>
                      {n.status == 0 ? (
                        <Tooltip title="Poll pending">
                          <AutorenewIcon />
                        </Tooltip>
                      ) : n.status == 2 ? (
                        <Tooltip title="Poll passed">
                          <CheckCircleIcon style={{ color: "green" }} />
                        </Tooltip>
                      ) : (
                        <Tooltip title="Poll rejected">
                          <CancelIcon style={{ color: "red" }} />
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
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

Polls.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Polls);
