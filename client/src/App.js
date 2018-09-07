import React, { Component } from "react";
import getContractInstance from "./utils/getContractInstance";
import EnigmaSetup from "./utils/getEnigmaSetup";
import { Container, Message } from "semantic-ui-react";
import Header from "./Header";
import "./App.css";
const GAS = "1000000";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      enigmaSetup: null
    };
  }

  componentDidMount = async () => {
    let enigmaSetup = new EnigmaSetup();
    await enigmaSetup.init();
    this.setState({ enigmaSetup });
  };

  render() {
    if (!this.state.enigmaSetup) {
      return (
        <div className="App">
          <Header />
          <Message color="red">Enigma setup still loading...</Message>
        </div>
      );
    } else if (!this.state.enigmaSetup.complete) {
      return (
        <div className="App">
          <Header />
          <Message color="red">Enigma setup still loading...</Message>
        </div>
      );
    } else {
      return (
        <div className="App">
          <Header />
          <Message color="red">Enigma setup has successfully loaded!</Message>
        </div>
      );
    }
  }
}

export default App;
