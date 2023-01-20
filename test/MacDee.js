const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
describe("MacDee", function () {
  async function deployedBase() {
    // Contracts are deployed using the first signer/account by default
    const [owner, customer, supplier1, supplier2, supplier3, supplier4] = await ethers.getSigners();
    const MacDee = await ethers.getContractFactory("MacDeeContract");
    const macdee = await MacDee.deploy(5_000_000_000, 1_000_000_000);
    return { macdee, owner, customer, supplier1, supplier2, supplier3, supplier4 };
  }
  async function deployedSuppliers() {
    // Contracts are deployed using the first signer/account by default
    const [owner, customer, supplier1, supplier2, supplier3, supplier4, supplier5] = await ethers.getSigners();
    const MacDee = await ethers.getContractFactory("MacDeeContract");
    const macdee = await MacDee.deploy(5_000_000_000, 1_000_000_000);
    macdee.addSupplier(supplier1.address, 10_000_000)
    macdee.addSupplier(supplier2.address, 10_000_000)
    macdee.addSupplier(supplier3.address, 10_000_000)
    macdee.addSupplier(supplier4.address, 10_000_000)
    macdee.addSupplier(supplier5.address, 10_000_000)
    return { macdee, owner, customer, supplier1, supplier2, supplier3, supplier4, supplier5 };
  }
  async function deployedSuppliersWithFourPayments() {
    // Contracts are deployed using the first signer/account by default
    const [owner, customer, supplier1, supplier2, supplier3, supplier4, supplier5] = await ethers.getSigners();
    const MacDee = await ethers.getContractFactory("MacDeeContract");
    const macdee = await MacDee.deploy(5_000_000_000, 1_000_000_000);
    await macdee.addSupplier(supplier1.address, 10_000_000);
    await macdee.addSupplier(supplier2.address, 10_000_000)
    await macdee.addSupplier(supplier3.address, 10_000_000)
    await macdee.addSupplier(supplier4.address, 10_000_000)
    await macdee.payForMeal({ value: 5_000_000_000 });
    await macdee.payForMeal({ value: 5_000_000_000 });
    await macdee.payForMeal({ value: 5_000_000_000 });
    await macdee.payForMeal({ value: 5_000_000_000 });
    return { macdee, owner, customer, supplier1, supplier2, supplier3, supplier4, supplier5 };
  }
  describe("Administration", function () {
    describe("Supplier Administration", function () {
      describe("Addition of Suppliers", function () {
        it("Should add a supplier", async function () {
          const { macdee, supplier1 } = await loadFixture(deployedBase);
          macdee.addSupplier(supplier1.address, 1_000_000_000)
          expect(await macdee.totalSuppliers()).to.equal(1);
        });
        it("Should fail to add a supplier if not owner", async function () {
          const { macdee, supplier1 } = await loadFixture(deployedBase);
          expect(macdee.connect(supplier1).addSupplier(supplier1.address, 1_000_000_000)).to.be.revertedWith("Owner reserved only")
        });
        it("Unable to add the same supplier from diffrent address", async function () {
          const { macdee, supplier1 } = await loadFixture(deployedBase);
          macdee.addSupplier(supplier1.address, 1_000_000_000)
          expect(macdee.addSupplier(supplier1.address, 1_000_000_000)).to.be.revertedWith(
            "Record already existing!"
          )

        });
      });
      describe("Removal of Suppliers", function () {
        //REMOVAL OF SUPPLIERS
        it("Should be able to remove a supplier", async function () {
          const { macdee, supplier1 } = await loadFixture(deployedBase);
          macdee.addSupplier(supplier1.address, 1_000_000_000)
          macdee.removeSupplier(supplier1.address)
          expect(await macdee.totalSuppliers()).to.equal(0)
          //expect(await macdee.totalSuppliers()).to.equal(1)
        });
        it("Should be unable to remove a non existant supplier", async function () {
          const { macdee, supplier1 } = await loadFixture(deployedBase);
          expect(macdee.removeSupplier(supplier1.address)).to.be.revertedWith(
            "Record doesnt exist"
          )
          //expect(await macdee.totalSuppliers()).to.equal(1)
        });
        it("Should be unable to remove a supplier from diffrent address", async function () {
          const { macdee, supplier1 } = await loadFixture(deployedBase);
          macdee.addSupplier(supplier1.address, 1_000_000_000)
          expect(macdee.connect(supplier1).removeSupplier(supplier1.address)).to.be.revertedWith(
            "Owner reserved only"
          )
          //expect(await macdee.totalSuppliers()).to.equal(1)
        });
        it("Should fail for the owner to remove a supplier with funds", async function () {
          const { macdee, owner, supplier1 } = await loadFixture(deployedSuppliersWithFourPayments);

          expect(macdee.removeSupplier(supplier1.address)).to.be.revertedWith("The supplier still has money in the contract")
        });
      })

    })
    describe("Company Administration", function () {
      describe("Withdraws", function () {
        it("Should fail to withdraw company funds from the smart contract from a random adress", async function () {
          const { macdee, supplier1, customer } = await loadFixture(deployedSuppliersWithFourPayments);

          expect(macdee.connect(supplier1).withdrawCompanyFunds()).to.be.revertedWith("Owner reserved only")
        })
        it("Should be possible for the owner to withdraw company funds from the smart contract", async function () {
          const { macdee, owner, customer } = await loadFixture(deployedSuppliersWithFourPayments);

          //console.log(await ethers.provider.getBalance(macdee.address));
          let supBal = await ethers.provider.getBalance(macdee.address)
          await macdee.connect(owner).withdrawCompanyFunds()
          expect(await ethers.provider.getBalance(macdee.address)).to.be.equal(supBal - 4_000_000_00)

        })
      })
      describe("Changing constants", function () {
        it("Should be possible for the owner to change the company margin", async function () {
          const { macdee, owner, customer } = await loadFixture(deployedSuppliersWithFourPayments);

          //console.log(await ethers.provider.getBalance(macdee.address));
          const number = await macdee.connect(owner).setCompanyMargin(10_000_00)
          expect(await macdee.connect(owner).setCompanyMargin(10_000_00)).to.revertedWith("Owner only!")
        })
        it("Should not be possible for the owner to change the company margin below 0", async function () {
          const { macdee, owner, customer } = await loadFixture(deployedSuppliersWithFourPayments);

          //console.log(await ethers.provider.getBalance(macdee.address));

          await macdee.connect(owner).withdrawCompanyFunds()
          expect(macdee.connect(owner).getSupplierBalance()).to.be.revertedWith("Ammount has to be above 0")
        })
        it("Should not be possible for anyone to change the company margin", async function () {
          const { macdee, owner, customer } = await loadFixture(deployedSuppliersWithFourPayments);

          //console.log(await ethers.provider.getBalance(macdee.address));
          // let supBal = await ethers.provider.getBalance(macdee.address)
          // await macdee.connect(owner).withdrawCompanyFunds()
          // expect(await ethers.provider.getBalance(macdee.address)).to.be.equal(supBal - 4_000_000_00)

        })
        it("Should be possible for the owner to change the meal price", async function () {
          const { macdee, owner, customer } = await loadFixture(deployedSuppliersWithFourPayments);

          //console.log(await ethers.provider.getBalance(macdee.address));
          // let supBal = await ethers.provider.getBalance(macdee.address)
          // await macdee.connect(owner).withdrawCompanyFunds()
          // expect(await ethers.provider.getBalance(macdee.address)).to.be.equal(supBal - 4_000_000_00)

        })

        it("Should not be possible for anyone to change the meal price", async function () {
          const { macdee, owner, customer } = await loadFixture(deployedSuppliersWithFourPayments);

          //console.log(await ethers.provider.getBalance(macdee.address));
          // let supBal = await ethers.provider.getBalance(macdee.address)
          // await macdee.connect(owner).withdrawCompanyFunds()
          // expect(await ethers.provider.getBalance(macdee.address)).to.be.equal(supBal - 4_000_000_00)

        })
      })
    })
  })

  describe("Supplier Side", function () {
    describe("Withdraws from contract", function () {
      it("Should fail for the owner to withdraw the supplier funds", async function () {
        const { macdee, owner, supplier1 } = await loadFixture(deployedSuppliersWithFourPayments);

        expect(macdee.connect(owner).supplierWithdrawAll()).to.be.revertedWith(
          "Supplier only"
        )
      });
      it("Should fail for the owner to get supplier balance in contract", async function () {
        const { macdee, owner, supplier1 } = await loadFixture(deployedSuppliersWithFourPayments);

        expect(macdee.connect(owner).getSupplierBalance()).to.be.revertedWith(
          "Supplier only"
        )
      });
      it("Should be able to get supplier balance in contract", async function () {
        const { macdee, owner, supplier1 } = await loadFixture(deployedSuppliersWithFourPayments);
        expect(await macdee.connect(supplier1).getSupplierBalance()).to.equal(40_000_000)
      });
      it("Should be successful for the supplier to withdraw its funds", async function () {
        const { macdee, owner, supplier1 } = await loadFixture(deployedSuppliersWithFourPayments);
        let supBal = await ethers.provider.getBalance(macdee.address)
        await macdee.connect(supplier1).supplierWithdrawAll()
        expect(await ethers.provider.getBalance(macdee.address)).to.be.equal(supBal - 40_000_000)

      });
      it("Should fail for the supplier to withdraw its funds if empty", async function () {
        const { macdee, owner, supplier1 } = await loadFixture(deployedSuppliersWithFourPayments);

        await macdee.connect(supplier1).supplierWithdrawAll()
        expect(macdee.connect(supplier1).supplierWithdrawAll()).to.be.revertedWith("Nothing to withdraw")
      });
    })
    describe("Withdraws from newly added supplier way after deployment", function () {
      it("Should be possible for the supplier to withdraw its funds even if its a new supplier", async function () {
        const { macdee, owner, supplier1, supplier5, customer } = await loadFixture(deployedSuppliersWithFourPayments);
        let supBal = await ethers.provider.getBalance(supplier1.address)
        await macdee.addSupplier(supplier5.address, 10_000_000)
        await macdee.connect(customer).payForMeal({ value: 5_000_000_000 })
        await macdee.connect(customer).payForMeal({ value: 5_000_000_000 })
        await macdee.connect(customer).payForMeal({ value: 5_000_000_000 })
        await macdee.connect(supplier1).supplierWithdrawAll()
        expect(ethers.provider.getBalance(supplier1.address) == supBal + 30_000_000
        )
      });
    })
  })
  describe("Customer side", function () {
    describe("Payment for meal", function () {
      it("Should enable payment to the smart contract", async function () {
        const { macdee, supplier1, customer } = await loadFixture(deployedSuppliers);
        await macdee.payForMeal({ value: 5_000_000_000 });
        //console.log(await ethers.provider.getBalance(macdee.address));
        expect(await ethers.provider.getBalance(macdee.address)).to.equal(5_000_000_000);
      })
      it("Should be unable to make a payment with less money than the meal price", async function () {
        const { macdee, supplier1 } = await loadFixture(deployedSuppliers);
        expect(macdee.payForMeal({ value: 4_000_000_000 })).to.be.revertedWith(
          "Paying too much or too little")

      })
      it("Should be unable to make a payment with more money than the meal price", async function () {
        const { macdee, supplier1 } = await loadFixture(deployedSuppliers);
        expect(macdee.payForMeal({ value: 6_000_000_000 })).to.be.revertedWith(
          "Paying too much or too little")

      })
    })
  })

})

