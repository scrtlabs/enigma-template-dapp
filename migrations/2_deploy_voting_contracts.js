const http = require("http");
const VotingToken = artifacts.require("VotingToken.sol");
const TokenFactory = artifacts.require("TokenFactory.sol");
const Voting = artifacts.require("Voting.sol");

module.exports = function(deployer) {
    return (
        deployer
            .then(() => {
                return deployer.deploy(VotingToken);
            })
            .then(() => {
                return deployer.deploy(TokenFactory, VotingToken.address);
            })
            .then(() => {
                return VotingToken.deployed().then(instance =>
                    instance.transferOwnership(TokenFactory.address)
                );
            })
            .then(() => {
                return new Promise((resolve, reject) => {
                    /* 
                    Obtain the Enigma contract address hosted at this port
                    upon enigma-docker-network launch
                    */
                    const request = http.get(
                        "http://localhost:8081",
                        response => {
                            if (
                                response.statusCode < 200 ||
                                response.statusCode > 299
                            ) {
                                reject(
                                    new Error(
                                        "Failed to load page, status code: " +
                                            response.statusCode
                                    )
                                );
                            }
                            const body = [];
                            response.on("data", chunk => body.push(chunk));
                            response.on("end", () => resolve(body.join("")));
                        }
                    );
                    request.on("error", err => reject(err));
                });
            })
            // Deploy MillionairesProblemFactory with the Enigma contract address
            .then(enigmaAddress => {
                console.log("Got Enigma Contract address: " + enigmaAddress);
                return deployer.deploy(
                    Voting,
                    VotingToken.address,
                    enigmaAddress
                );
            })
            .catch(err => console.error(err))
    );
};
