const { successLog, failedLog, infoLog } = require('./logger');
const {
  fetchEnergy,
  fetchUserInfo,
  claimEnergy,
  injectEnergy,
  getTokenList,
} = require('./api');
const colors = require('colors');

// Main function to orchestrate the bot's actions
const main = async () => {
  try {
    const runCode = async () => {
      // Clear the console
      process.stdout.write('\x1Bc');

      // Display the header information
      console.log(colors.cyan('╔════════════════════════════════════════════════════════════╗'));
      console.log(colors.cyan('║                   MintBlockchain Forest bot                ║'));
      console.log(colors.cyan('║                             and                             ║'));
      console.log(colors.cyan('║                          Injector                           ║'));
      console.log(colors.cyan('║                                                            ║'));
      console.log(colors.cyan('║     Follow us on Twitter:                                  ║'));
      console.log(colors.cyan('║     https://twitter.com/cipher_airdrop                     ║'));
      console.log(colors.cyan('║                                                            ║'));
      console.log(colors.cyan('║     Join us on Telegram:                                   ║'));
      console.log(colors.cyan('║     - https://t.me/+tFmYJSANTD81MzE1                       ║'));
      console.log(colors.cyan('╚════════════════════════════════════════════════════════════╝'));
      console.log();

      // Retrieve the list of tokens from the JSON file
      const tokenList = getTokenList();

      // Loop through each token in the token list
      for (let i = 0; i < tokenList.length; i++) {
        console.log(colors.yellow(`Processing account ${i + 1} of ${tokenList.length}`));
        console.log();

        const token = tokenList[i];

        // Fetch user information using the token
        const userInfo = await fetchUserInfo(token);
        const { id, address, treeId, status, energy } = userInfo.result;

        // Log retrieved account information
        successLog('Successfully retrieved account information');
        infoLog(`ID      : ${id}`);
        infoLog(`Address : ${address}`);
        infoLog(`Tree ID : ${treeId}`);
        infoLog(`Status  : ${status}`);
        infoLog(`Energy  : ${energy}`);

        // Fetch the energy list using the token
        const energyList = await fetchEnergy(token);
        let totalEnergy = energy;
        let energyClaimed = 0;

        // Log retrieved energy list
        successLog('Successfully retrieved energy list');
        for (const energy of energyList.result) {
          infoLog(`Amount : ${energy.amount}`);
          infoLog(`Type   : ${energy.type}`);
          if (energy.freeze == true) {
            infoLog('Skipping frozen energy claim');
          } else {
            // Claim energy if it is not frozen
            await claimEnergy(
              token,
              energy.uid,
              energy.amount,
              energy.includes,
              energy.type,
              energy.id
            );
            energyClaimed += energy.amount;
            successLog(`* Claimed ${energy.amount} energy for wallet ${address} *`);
          }
        }

        // Inject total energy into the address if greater than zero
        totalEnergy += energyClaimed;
        if (totalEnergy > 0) {
          const response = await injectEnergy(token, totalEnergy, address);
          if (response.msg == 'ok') {
            successLog(`* Successfully injected ${totalEnergy} energy into ${address}'s tree *`);
          }
        } else {
          infoLog(`Skipping injection for wallet ${address}`);
        }

        console.log(colors.cyan('╔════════════════════════════════════════════════════════════╗'));
        console.log();
      }
    };

    // Run the code initially
    await runCode();

    // Schedule to run the code every 24 hours
    setInterval(runCode, 86400 * 1000);
    console.log('Will try in 24HR');
  } catch (error) {
    failedLog(error.message); // Log error message if something goes wrong
  }
};

module.exports = main;
