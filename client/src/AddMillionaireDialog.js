import React, { Component } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Input from "@material-ui/core/Input";
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from "@material-ui/core/FormControl";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";

const styles = theme => ({
  button: {
    display: "block",
    marginTop: theme.spacing.unit * 2
  },
  formControl: {
    margin: theme.spacing.unit,
    minWidth: 120
  }
});

class AddMillionaireDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      millionaireAddress: "None",
      millionaireNetWorth: null
    };
    this.handleChangeAddress = this.handleChangeAddress.bind(this);
    this.handleChangeNetWorth = this.handleChangeNetWorth.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleClickOpen = () => {
    this.setState({ open: true });
  };

  handleClose = () => {
    this.setState({ open: false });
  };

  // onChange listener to update state with user-input address
  handleChangeAddress(event) {
    this.setState({ millionaireAddress: event.target.value });
  }

  // onChange listener to update state with user-input net worth
  handleChangeNetWorth(event) {
    this.setState({ millionaireNetWorth: event.target.value });
  }

  // onClick listener to update to trigger addMillionaire callback from parent component
  async handleSubmit(event) {
    event.preventDefault();
    // Trigger MillionairesProblemWrapper addMillionaire callback
    this.props.onAddMillionaire(
      this.state.millionaireAddress,
      this.state.millionaireNetWorth
    );
    this.setState({
      open: false,
      millionaireAddress: "None",
      millionaireNetWorth: null
    });
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
          Add Millionaire
        </Button>
        <Dialog
          open={this.state.open}
          onClose={this.handleClose}
          aria-labelledby="form-dialog-title"
        >
          <DialogTitle id="form-dialog-title">Add Millionaire</DialogTitle>
          <DialogContent>
            <DialogContentText>
              To add yourself, please set your address and state your net
              worth...
            </DialogContentText>
            <form className={classes.root} onSubmit={this.handleSubmit}>
              <FormControl className={classes.formControl}>
                <InputLabel htmlFor="millionaireAddress">
                  Millionaire Address
                </InputLabel>
                <Select
                  value={this.state.millionaireAddress}
                  onChange={this.handleChangeAddress}
                  inputProps={{
                    name: "address",
                    id: "millionaireAddress"
                  }}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {this.props.accounts.map((account, i) => {
                    return (
                      <MenuItem key={i} value={account}>
                        {account}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
              <FormControl className={classes.formControl}>
                <InputLabel htmlFor="millionaireNetWorth">
                  Millionaire Net Worth
                </InputLabel>
                <Input
                  id="millionaireNetWorth"
                  type="number"
                  onChange={this.handleChangeNetWorth}
                  autoComplete="off"
                />
              </FormControl>
            </form>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleClose} color="primary">
              Cancel
            </Button>
            <Button onClick={this.handleSubmit}>Add Millionaire</Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

AddMillionaireDialog.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(AddMillionaireDialog);
