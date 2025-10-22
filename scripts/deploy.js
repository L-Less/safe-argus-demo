const hre = require('hardhat');
require('dotenv').config();

async function main() {
  const Authorizer = await hre.ethers.getContractFactory('Authorizer');
  const authorizer = await Authorizer.deploy();
  await authorizer.deployed();
  console.log('Authorizer deployed to:', authorizer.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
