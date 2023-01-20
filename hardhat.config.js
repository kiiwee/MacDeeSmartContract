require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-waffle")
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  paths: {
    artifacts: './src/artifacts',
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    mumbai: {
      url: 'https://polygon-mumbai.g.alchemy.com/v2/bmGn61q-WhS5LFiuKE8Jg0RPpVLmYKp6',
      accounts: ['57bf42c76742a2d32b6f9513d9bfaa546f3a9f21df65ec5f35cc9aa1af9ae43c'],
    },
  }
};
