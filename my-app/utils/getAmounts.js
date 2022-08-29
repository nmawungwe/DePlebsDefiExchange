import { Contract } from "ethers";
import {
    TOKEN_CONTRACT_ADDRESS,
    TOKEN_CONTRACT_ABI,
    EXCHANGE_CONTRACT_ADDRESS,
    EXCHANGE_CONTRACT_ABI,
} from "../constants";

export const getEtherBalance = async (
    provider,
    address,
    contract = false
) => {
    try {
        if (contract) {
            const balance = await provider.getBalance(EXCHANGE_CONTRACT_ADDRESS);
            return balance;
        } else {
            const balance = await provider.getBalance(address);
            return balance;
        }
    } catch (error) {
        console.error(error);
        return 0;
    }
};

export const getPlebTokensBalance = async(provider, address) => {
    try {
        const tokenContract = new Contract(
            TOKEN_CONTRACT_ADDRESS,
            TOKEN_CONTRACT_ABI,
            provider
        );
        const plebTokensBalance = await tokenContract.balanceOf(address);
        return plebTokensBalance;
    } catch (error) {
        console.error(error);
    }
}

export const getLPTokensBalance = async(provider, address) => {
    try {
        const exchangeContract = new Contract(
            EXCHANGE_CONTRACT_ADDRESS,
            EXCHANGE_CONTRACT_ABI,
            provider
        );
        const lpTokensBalance = await exchangeContract.balanceOf(address);
        return lpTokensBalance;
    } catch (error) {
        console.error(error);
    }
}

export const getReserveOfPbTokens = async(provider) => {
    try {
        const exchangeContract = new Contract(
            EXCHANGE_CONTRACT_ADDRESS,
            EXCHANGE_CONTRACT_ABI,
            provider
        );
        const PbTokensReserve = await exchangeContract.getReserve();
        return PbTokensReserve;
    } catch (error) {
        console.error(error);
    }
}

