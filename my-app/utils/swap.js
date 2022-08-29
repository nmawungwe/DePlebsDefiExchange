import { Contract } from "ethers";
import {
    TOKEN_CONTRACT_ADDRESS,
    TOKEN_CONTRACT_ABI,
    EXCHANGE_CONTRACT_ADDRESS,
    EXCHANGE_CONTRACT_ABI
} from "../constants";

/*
    getAmountOfTokensReceivedFromSwap:  Returns the number of Eth/Crypto Dev tokens that can be received 
    when the user swaps `_swapAmountWei` amount of Eth/Crypto Dev tokens.
*/
export const getAmountOfTokensReceivedFromSwap = async(
    _swapAmountWei,
    provider,
    ethSelected,
    ethBalance,
    reservedPb
) => {
    const exchangeContract = new Contract(
        EXCHANGE_CONTRACT_ADDRESS,
        EXCHANGE_CONTRACT_ABI,
        provider
    );

    let amountOfTokens;
    // If `Eth` is selected this means our input value is `Eth` which means our input amount would be
    // `_swapAmountWei`, the input reserve would be the `ethBalance` of the contract and output reserve
    // would be the `Crypto Dev` token reserve
    if (ethSelected) {
        amountOfTokens = await exchangeContract.getAmountOfTokens(
            _swapAmountWei,
            ethBalance,
            reservedPb
        );
    } else {
    // If `Eth` is not selected this means our input value is `Crypto Dev` tokens which means our input amount would be
    // `_swapAmountWei`, the input reserve would be the `Crypto Dev` token reserve of the contract and output reserve
    // would be the `ethBalance` 
        amountOfTokens = await exchangeContract.getAmountOfTokens(
            _swapAmountWei,
            reservedPb,
            ethBalance
        );
    }

    return amountOfTokens;
}

export const swapTokens = async(
    signer,
    swapAmountWei,
    tokenToBeReceivedAfterSwap,
    ethSelected
)=> {
    const exchangeContract = new Contract(
        EXCHANGE_CONTRACT_ADDRESS,
        EXCHANGE_CONTRACT_ABI,
        signer
    );
    const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
    );

    let tx;
    // If Eth is selected call the `ethToDePlebToken` function else
    // call the `dePlebTokenToEth` function from the contract
    // As you can see you need to pass the `swapAmount` as a value to the function because
    // it is the ether we are paying to the contract, instead of a value we are passing to the function
    if (ethSelected) {
        tx = await exchangeContract.ethToDePlebToken(tokenToBeReceivedAfterSwap,
            {
                value: swapAmountWei,
            });
    } else {
    // User has to approve `swapAmountWei` for the contract because `Crypto Dev` token
    // is an ERC20
        tx = await tokenContract.approve(
            EXCHANGE_CONTRACT_ADDRESS,
            swapAmountWei.toString()
        )

        await tx.wait();
    // call cryptoDevTokenToEth function which would take in `swapAmountWei` of `Crypto Dev` tokens and would
    // send back `tokenToBeReceivedAfterSwap` amount of `Eth` to the user
    tx = await exchangeContract.dePlebTokenToEth(
        swapAmountWei,
        tokenToBeReceivedAfterSwap
        );
    }

    await tx.wait();

}