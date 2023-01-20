// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const { ethers } = require("ethers"); // assuming commonjs

async function main() {
  const [deployer] = await hre.ethers.getSigners()
  console.log('Address signer:', deployer)

  const MacDee = await hre.ethers.getContractFactory("MacDeeContract");
  const macdee = await MacDee.deploy(hre.ethers.utils.parseEther("0.1"), hre.ethers.utils.parseEther("0.005"));

  await macdee.deployed();

  console.log(
    `deployed at:`, macdee.address
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
