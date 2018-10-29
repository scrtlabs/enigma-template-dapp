import React, { Component } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import TextField from "@material-ui/core/TextField";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";

const styles = theme => ({
  button: {
    display: "block",
    marginTop: theme.spacing.unit * 2
  },
  textField: {
    margin: theme.spacing.unit,
    minWidth: 120
  }
});

class AddPoll extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      quorumPercentage: null,
      description: null,
      votingPeriod: null
    };
    this.handleChangeQuorumPercentage = this.handleChangeQuorumPercentage.bind(
      this
    );
    this.handleChangeDescription = this.handleChangeDescription.bind(this);
    this.handleChangeVotingPeriod = this.handleChangeVotingPeriod.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleClickOpen = () => {
    this.setState({ open: true });
  };

  handleClose = () => {
    this.setState({ open: false });
  };

  // onChange listener to update state with user-input address
  handleChangeQuorumPercentage(event) {
    this.setState({ quorumPercentage: event.target.value });
  }

  // onChange listener to update state with user-input net worth
  handleChangeDescription(event) {
    this.setState({ description: event.target.value });
  }

  // onChange listener to update state with user-input net worth
  handleChangeVotingPeriod(event) {
    this.setState({ votingPeriod: event.target.value });
  }

  // onClick listener to update to trigger addMillionaire callback from parent component
  async handleSubmit(event) {
    event.preventDefault();
    // Trigger MillionairesProblemWrapper addMillionaire callback
    {
      this.props.onCreatePoll(
        parseFloat(this.state.quorumPercentage),
        this.state.description,
        parseInt(this.state.votingPeriod)
      );
      this.setState({
        open: false,
        quorumPercentage: null,
        description: null,
        votingPeriod: null
      });
    }
  }

  render() {
    const { classes } = this.props;
    return (
      <div>
        <Button
          onClick={this.handleClickOpen}
          variant="contained"
          color="primary"
        >
          Create New Poll
        </Button>
        <Dialog
          open={this.state.open}
          onClose={this.handleClose}
          aria-labelledby="form-dialog-title"
        >
          <DialogTitle id="form-dialog-title">Create New Poll</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Create a new poll with the following details:
            </DialogContentText>
            <form className={classes.root} onSubmit={this.handleSubmit}>
              <TextField
                id="quorumPercentage"
                label="Quorum Percentage"
                type="number"
                onChange={this.handleChangeQuorumPercentage}
                autoComplete="off"
                className={classes.textField}
              />
              <TextField
                id="description"
                label="Description"
                type="string"
                onChange={this.handleChangeDescription}
                autoComplete="off"
                className={classes.textField}
              />
              <TextField
                id="votingPeriod"
                label="Voting Period"
                type="number"
                onChange={this.handleChangeVotingPeriod}
                autoComplete="off"
                className={classes.textField}
              />
            </form>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleClose} color="primary">
              Cancel
            </Button>
            <Button onClick={this.handleSubmit}>Create Poll</Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

AddPoll.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(AddPoll);
