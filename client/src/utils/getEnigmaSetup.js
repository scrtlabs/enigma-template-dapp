import getWeb3 from "./getWeb3";
import getAccounts from "./getAccounts";
import getContractInstance from "./getContractInstance";
import enigmaContractDefinition from "../lib/Enigma.json";
import enigmaTokenContractDefinition from "../lib/EnigmaToken.json";
const testUtils = require("../test/test-utils");
const eng = require("../lib/Enigma");
const http = require("http");

class EnigmaSetup {
	constructor() {
		this.web3 = null;
		this.accounts = null;
		this.Enigma = null;
		this.EnigmaToken = null;
		this.enigma = null;
		this.principal = null;
		this.complete = false;
	}

	async init() {
		try {
			// Get network provider and web3 instance.
			this.web3 = await getWeb3();

			// Use web3 to get the user's accounts.
			this.accounts = await getAccounts(this.web3);

			// Get the deployed instances
			const enigmaAddress = await new Promise((resolve, reject) => {
				const request = http.get("http://localhost:8081", response => {
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
				});
				request.on("error", err => reject(err));
			});

			this.Enigma = await getContractInstance(
				this.web3,
				enigmaContractDefinition,
				enigmaAddress
			);

			const enigmaTokenAddress = await new Promise((resolve, reject) => {
				const request = http.get("http://localhost:8082", response => {
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
				});
				request.on("error", err => reject(err));
			});
			this.EnigmaToken = await getContractInstance(
				this.web3,
				enigmaTokenContractDefinition,
				enigmaTokenAddress
			);

			this.enigma = new eng.Enigma(this.Enigma, this.EnigmaToken);
			this.principal = new testUtils.Principal(
				this.Enigma,
				this.accounts[9]
			);
			const resultRegister = await this.principal.register();
			const eventRegister = resultRegister.logs[0];
			if (!eventRegister.args._success) {
				throw "Unable to register worker";
			}
			const resultWP = await this.principal.setWorkersParams();
			const eventWP = resultWP.logs[0];
			if (!eventWP.args._success) {
				throw "Unable to set worker params";
			}
			console.log(
				"network using random seed:",
				eventWP.args.seed.toNumber()
			);
			this.complete = true;
		} catch (error) {
			// Catch any errors for any of the above operations.
			console.log(error);
		}
	}
}

export default EnigmaSetup;
