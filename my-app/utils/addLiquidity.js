import { Contract, utils } from "ethers";
import {
    TOKEN_CONTRACT_ADDRESS,
    TOKEN_CONTRACT_ABI,
    EXCHANGE_CONTRACT_ADDRESS,
    EXCHANGE_CONTRACT_ABI
} from "../constants";

export const addLiquidity = async(
    signer,
    addPbAmountWei,
    addEtherAmountWei
) => {
    try {
        const tokenContract = new Contract(
            TOKEN_CONTRACT_ADDRESS,
            TOKEN_CONTRACT_ABI,
            signer
        )

        const exchangeContract = new Contract(
            EXCHANGE_CONTRACT_ADDRESS,
            EXCHANGE_CONTRACT_ABI,
            signer
        )

        let tx = await tokenContract.approve(
            EXCHANGE_CONTRACT_ADDRESS,
            addPbAmountWei.toString()
        );

        await tx.wait();

        tx = await exchangeContract.addLiquidity(addPbAmountWei, {
            value: addEtherAmountWei,
        });

        await tx.wait();
    } catch (error) {
        console.error(error);
    }
}

// calculating amount of Pb tokens that need to be added to the given `_addEtherAmountWei` amount of ether
export const calculatePb = async (
    _addEther = "0",
    etherBalanceContract,    
    pbTokenReserve
    ) => {

         // `_addEther` is a string, we need to convert it to a Bignumber before we can do our calculations
        // We do that using the `parseEther` function from `ethers.js`
        const _addEtherAmountWei = utils.parseEther(_addEther);

        // Ratio needs to be maintained when we add liquidty.
        // We need to let the user know for a specific amount of ether how many `Pb` tokens
        // He can add so that the price impact is not large
        // The ratio we follow is (amount of Pleb tokens to be added) / (Pleb tokens balance) = (Eth that would be added) / (Eth reserve in the contract)
        // So by maths we get (amount of Pleb tokens to be added) = (Eth that would be added * Pleb tokens balance) / (Eth reserve in the contract)

        const plebTokenAmount = _addEtherAmountWei.mul(pbTokenReserve).div(etherBalanceContract);
        return plebTokenAmount;
}