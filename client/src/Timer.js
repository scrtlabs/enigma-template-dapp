import React, { Component } from "react";

class Timer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      remainingSeconds: 0,
      callbackTriggered: false
    };
  }

  componentDidMount() {
    this.setState({ remainingSeconds: this.props.timeRemainingInSeconds });
    this.countDown(this.props.timeRemainingInSeconds, true);
  }

  updateRemainingSeconds(timeRemainingInSeconds) {
    let remainingSeconds = timeRemainingInSeconds;
    this.setState({
      remainingSeconds
    });
  }

  countDown(timeRemainingInSeconds, shouldSkipCallback) {
    this.setState({
      timeRemainingInSeconds
    });
    if (!this.state.callbackTriggered && timeRemainingInSeconds === 0) {
      this.setState({ callbackTriggered: true });
      this.props.onCompletion(this.props.pollID);
    }
    localStorage.setItem("timeRemainingInSeconds", timeRemainingInSeconds);
    if (timeRemainingInSeconds > 0) {
      this.updateRemainingSeconds(timeRemainingInSeconds);
      timeRemainingInSeconds = timeRemainingInSeconds - 1;
      this.setTimeoutId = setTimeout(
        this.countDown.bind(this, timeRemainingInSeconds, false),
        1000
      );
    }
  }

  compareServerTimeAndComponentTimeAndUpdateServer(
    serverSideTimeRemainingInSeconds
  ) {
    let componentTimeRemainingInSeconds = localStorage.getItem(
      "timeRemainingInSeconds"
    );
    if (
      componentTimeRemainingInSeconds &&
      componentTimeRemainingInSeconds < serverSideTimeRemainingInSeconds
    ) {
      return componentTimeRemainingInSeconds;
    }
    return serverSideTimeRemainingInSeconds;
  }

  componentWillReceiveProps(nextProps) {
    if (
      this.props.timeRemainingInSeconds !== nextProps.timeRemainingInSeconds
    ) {
      let timeRemainingInSeconds = this.compareServerTimeAndComponentTimeAndUpdateServer(
        nextProps.timeRemainingInSeconds
      );
      this.countDown(timeRemainingInSeconds, true);
    }
  }

  componentWillUnmount() {
    clearTimeout(this.setTimeoutId);
  }

  render() {
    return <span>{this.state.remainingSeconds}</span>;
  }
}

export default Timer;
