import React, { Component } from "react";
import getContractInstance from "./utils/getContractInstance";
import EnigmaSetup from "./utils/getEnigmaSetup";
import millionairesProblemFactoryContractDefinition from "./contracts/MillionairesProblemFactory.json";
import millionairesProblemContractDefinition from "./contracts/MillionairesProblem.json";
import { Container, Message } from "semantic-ui-react";
import Header from "./Header";
import MillionairesProblemWrapper from "./MillionairesProblemWrapper";
import Paper from "@material-ui/core/Paper";
import "./App.css";
const GAS = "1000000";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      enigmaSetup: null,
      millionairesProblemFactory: null,
      millionairesProblem: null
    };
  }

  componentDidMount = async () => {
    /*
    Initialize bundled object containing web3, accounts, Enigma/EnigmaToken contracts, and 
    enigma/principal wrappers
    */
    let enigmaSetup = new EnigmaSetup();
    await enigmaSetup.init();
    // Initialize MillionairesProblemFactory contract instance
    const millionairesProblemFactory = await getContractInstance(
      enigmaSetup.web3,
      millionairesProblemFactoryContractDefinition
    );
    const millionairesProblems = await millionairesProblemFactory.getMillionairesProblems.call();
    // If we've deployed at least one MillionaireProblem, get the latest one
    if (millionairesProblems.length != 0) {
      const millionairesProblem = await getContractInstance(
        enigmaSetup.web3,
        millionairesProblemContractDefinition,
        millionairesProblems[millionairesProblems.length - 1]
      );
      this.setState({
        millionairesProblem
      });
    }

    this.setState({ enigmaSetup, millionairesProblemFactory });
  };

  // Create fresh, new MillionaireProblem contract
  async createNewMillionairesProblem() {
    await this.state.millionairesProblemFactory.createNewMillionairesProblem({
      from: this.state.enigmaSetup.accounts[0],
      gas: GAS
    });

    // Obtain the latest-deployed MillionaireProblem instance, this will be the one we interact with
    const millionairesProblems = await this.state.millionairesProblemFactory.getMillionairesProblems.call();
    const millionairesProblem = await getContractInstance(
      this.state.enigmaSetup.web3,
      millionairesProblemContractDefinition,
      millionairesProblems[millionairesProblems.length - 1]
    );
    this.setState({
      millionairesProblem
    });
  }

  render() {
    if (!this.state.enigmaSetup) {
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
          <br />
          <Container>
            <Paper>
              <MillionairesProblemWrapper
                onCreateNewMillionaresProblem={() => {
                  this.createNewMillionairesProblem();
                }}
                enigmaSetup={this.state.enigmaSetup}
                millionairesProblem={this.state.millionairesProblem}
              />
            </Paper>
          </Container>
        </div>
      );
    }
  }
}
export default App;
