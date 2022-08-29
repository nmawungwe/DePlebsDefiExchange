import { Contract, providers, utils, BigNumber } from "ethers";
import { EXCHANGE_CONTRACT_ABI, EXCHANGE_CONTRACT_ADDRESS } from "../constants";

export const removeLiquidity = async( signer, removeLPTokensWei )=> {
    const exchangeContract = new Contract(
        EXCHANGE_CONTRACT_ADDRESS,
        EXCHANGE_CONTRACT_ABI,
        signer
    )
    const tx = await exchangeContract.removeLiquidity(removeLPTokensWei);
    await tx.wait();
}

/**
* getTokensAfterRemove: Calculates the amount of `Eth` and `Pb` tokens
* that would be returned back to user after he removes `removeLPTokenWei` amount
* of LP tokens from the contract
*/

export const getTokensAfterRemove = async(
    provider,
    removeLPTokenWei,
    _ethBalance,
    plebTokenReserve
) => {
    try {
        const exchangeContract = new Contract(
            EXCHANGE_CONTRACT_ADDRESS,
            EXCHANGE_CONTRACT_ABI,
            provider
        );
        // Get the total supply of `Pleb` LP tokens
        const _totalSupply = await exchangeContract.totalSupply();
        // Here we are using the BigNumber methods of multiplication and division
        // The amount of Eth that would be sent back to the user after he withdraws the LP token
        // is calculated based on a ratio,
        // Ratio is -> (amount of Eth that would be sent back to the user / Eth reserve) = (LP tokens withdrawn) / (total supply of LP tokens)
        // By some maths we get -> (amount of Eth that would be sent back to the user) = (Eth Reserve * LP tokens withdrawn) / (total supply of LP tokens)
        // Similarly we also maintain a ratio for the `CD` tokens, so here in our case
        // Ratio is -> (amount of CD tokens sent back to the user / CD Token reserve) = (LP tokens withdrawn) / (total supply of LP tokens)
        // Then (amount of CD tokens sent back to the user) = (CD token reserve * LP tokens withdrawn) / (total supply of LP tokens)
        const _removeEther = _ethBalance.mul(removeLPTokenWei).div(_totalSupply);
        const _removePb = plebTokenReserve.mul(removeLPTokenWei).div(_totalSupply);
        return {
            _removeEther,
            _removePb
        }
    } catch (error) {
        console.error(error);
    }
}