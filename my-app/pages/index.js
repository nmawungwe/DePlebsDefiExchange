import { BigNumber, providers, utils } from "ethers";
import Head from 'next/head';
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import { addLiquidity, calculatePb } from "../utils/addLiquidity";
import { getEtherBalance, getPlebTokensBalance, getLPTokensBalance, getReserveOfPbTokens } from "../utils/getAmounts";
import { removeLiquidity, getTokensAfterRemove } from "../utils/removeLiquidity";
import { getAmountOfTokensReceivedFromSwap, swapTokens } from "../utils/swap";




export default function Home() {

  // This variable is the `0` number in form of a BigNumber
  const zero = BigNumber.from(0);
  /** Wallet connection */
  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();
  // walletConnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnect] = useState(false);
  // loading is set to true when the transaction is mining and set to false when
  // the transaction has mined
  const [loading, setLoading] = useState(false);
  // We have two tabs in this dapp, Liquidity Tab and Swap Tab. This variable
  // keeps track of which Tab the user is on. If it is set to true this means
  // that the user is on `liquidity` tab else he is on `swap` tab
  const [liquidityTab, setLiquidityTab] = useState(true);
  // reservedPb keeps track of the Pleb tokens Reserve balance
  // const [reservedPb, setReservePb] = useState(zero);
  // addEther is the amount of Ether that the user wants to add to the liquidity
  const [addEther, setAddEther] = useState(zero);
  // addPb is the amount of Pleb token that the user wants to add to the liquidity
  const [addPbTokens, setAddPbTokens] = useState(zero);
  // removeEther is the amount of `Ether` that would be sent back to the user based on a certain number of `LP` tokens
  const [removeEther, setRemoveEther] = useState(zero);
  // removePb is the amount of `Pleb` tokens that would be sent back to the user based on a certain number of `LP` tokens
  // that he wants to withdraw
  const [removePb, setRemovePb] = useState(zero);
  // amount of LP tokens that the user wants to remove from liquidity 
  const [removeLPTokens, setRemoveLPTokens] = useState("0");
  // ethBalance keeps track of user Eth
  const [ethBalance, setEthBalance] = useState(zero);
  // pbBalance keeps track of user Pb tokens 
  const [pbBalance, setPbBalance] = useState(zero);
  // lpBalance keeps track of user Lp tokens
  const [lpBalance, setLpBalance] = useState(zero);
  // pbReserve keeps track of the Pleb tokens in DEFIExchange contract
  const [pbReserve, setPbReserve] = useState(zero);
  // ethBalanceContract keeps track of the Eth in the DEFIExchange contract
  const [ethBalanceContract, setEthBalanceContract] = useState(zero);
  // Amount that the user wants to swap
  const [swapAmount, setSwapAmount] = useState("");
  // This keeps track of the number of tokens that the user would receive after a swap completes
  const [tokensToBeReceivedAfterSwap, setTokensToBeReceivedAfterSwap] = useState(zero);
  // Keeps track of whether  `Eth` or `Crypto Dev` token is selected. If `Eth` is selected it means that the user
  // wants to swap some `Eth` for some `Crypto Dev` tokens and vice versa if `Eth` is not selected
  const [ethSelected, setEthSelected] = useState(true);



  const getAmounts = async() => {
    try {
        const provider = await getProviderOrSigner(false);
        const signer = await getProviderOrSigner(true);
        const address = await signer.getAddress();

        // get amount of ether in the user's account
        const _ethBalance = await getEtherBalance(provider, address);
        // get amount of Pleb token owned by user
        const _pbBalance = await getPlebTokensBalance(provider, address);
        // get amount of Pleb LP tokens held by user
        const _lpBalance = await getLPTokensBalance(provider, address);
        // get the amount of `Pb` tokens present in the reserve
        const _pbReserve = await getReserveOfPbTokens(provider);
        // get the amount of `Eth` in the contract reserves
        const _ethBalanceContract = await getEtherBalance(provider, null, true);
        setEthBalance(_ethBalance);
        setPbBalance(_pbBalance);
        setLpBalance(_lpBalance);
        setPbReserve(_pbReserve);
        setEthBalanceContract(_ethBalanceContract);
    } catch (error) {
        console.error(error);
    }
  }

  // const calculatePB = async() => {
  //   try {
  //       const addEtherWei = utils.parseEther(addEther.toString());
  //       const addPbTokens = await calculatePb(addEtherWei, ethBalanceContract, pbReserve)
  //       return addPbTokens;
  //   } catch (error) {
  //       console.error(error);
  //   }
  // }


  const _addLiquidity = async() => {
    try {
        const addEtherWei = utils.parseEther(addEther.toString());
        // Check if the values are zero
        if (!addPbTokens.eq(zero) && !addEtherWei.eq(zero)) {
            const signer = await getProviderOrSigner(true)
            setLoading(true);
            // call the addLiquidity function from the utils folder  
            await addLiquidity(signer, addPbTokens, addEtherWei);          
            setLoading(false);
            setAddPbTokens(zero);
            await getAmounts();
        } else {
            setAddPbTokens(zero);
        }
    } catch (error) {
        console.error(error);
        setLoading(false);
        setAddPbTokens(zero);
    }
  };

  
   //_removeLiquidity: Removes the `removeLPTokensWei` amount of LP tokens from
   //liquidity and also the calculated amount of `ether` and `Pb` tokens
   

    const _removeLiquidity = async () => {
      try {
        const signer = await getProviderOrSigner(true);
        // Convert the LP tokens entered by the user to a BigNumber
        const removeLPTokensWei = utils.parseEther(removeLPTokens);
        setLoading(true);
        // Call the removeLiquidity function from the `utils` folder
        await removeLiquidity(signer, removeLPTokensWei);
        setLoading(false);
        await getAmounts();
        setRemovePb(zero);
        setRemoveEther(zero);
      } catch (error) {
        console.error(error);
        setLoading(false);
        setRemovePb(zero);
        setRemoveEther(zero);
      }
    }

    /**
   * _getTokensAfterRemove: Calculates the amount of `Ether` and `Pb` tokens
   * that would be returned back to user after he removes `removeLPTokenWei` amount
   * of LP tokens from the contract
   */
  const _getTokensAfterRemove = async(_removeLPTokens) => {
    try {
        const provider = await getProviderOrSigner();
        const removeLPTokenWei = utils.parseEther(_removeLPTokens);
        const _ethBalance = await getEtherBalance(provider, null, true);
        const plebTokenReserve = await getReserveOfPbTokens(provider);
        const { _removeEther, _removePb} = await getTokensAfterRemove(
          provider,
          removeLPTokenWei,
          _ethBalance,
          plebTokenReserve
        );
        setRemoveEther(_removeEther);
        setRemovePb(_removePb);
    } catch (error) {
        console.error(error);
    }
  }

    /**
   * swapTokens: Swaps  `swapAmountWei` of Eth/Crypto Dev tokens with `tokenToBeReceivedAfterSwap` amount of Eth/Crypto Dev tokens.
   */
  const _swapTokens = async () => {
    try {
        // Convert the amount entered by the user to a BigNumber using the `parseEther` library from `ether.js` 
        const swapAmountWei = utils.parseEther(swapAmount); 
      
        if(!swapAmountWei.eq(zero)) {
          const signer = await getProviderOrSigner(true);
          setLoading(true);
          await swapTokens(
            signer,
            swapAmountWei,
            tokensToBeReceivedAfterSwap,
            ethSelected
          );
          setLoading(false);
          // Get all the updated amounts after the swap
          await getAmounts();
          setSwapAmount("");
        } 
    } catch (error) {
        console.error(error);
        setLoading(false);
        setSwapAmount("");
    }
  } 
  
    /**
   * _getAmountOfTokensReceivedFromSwap:  Returns the number of Eth/Pleb tokens that can be received 
   * when the user swaps `_swapAmountWEI` amount of Eth/Pleb tokens.
   */
  const _getAmountOfTokensReceivedFromSwap = async (_swapAmount) => {
    try {
      const _swapAmountWEI = utils.parseEther(_swapAmount.toString());
      if (!_swapAmountWEI.eq(zero)) {
        const provider = await getProviderOrSigner();
        const _ethBalance = await getEtherBalance(provider, null, true);
        const amountOfTokens = await getAmountOfTokensReceivedFromSwap(
          _swapAmountWEI,
          provider,
          ethSelected,
          _ethBalance,
          pbReserve
        );
        setTokensToBeReceivedAfterSwap(amountOfTokens);
      } else {
        setTokensToBeReceivedAfterSwap(zero);
      }
      
    } catch (error) {
        console.error(error);
    }
  }


  const getProviderOrSigner = async(needSigner = false)=> {

    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();

    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby");
      throw new Error("Change network to Rinkeby");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }

    return web3Provider;
  };

    /**
   * connectWallet: Connects the MetaMask wallet
   */
  const connectWallet = async () => {
    try {
        // Get the provider from web3Modal, which in our case is MetaMask
        // When used for the first time, it prompts the user to connect their wallet
        await getProviderOrSigner();
        setWalletConnect(true);
    } catch (error) {
        console.error(error);
    }
  }

  useEffect(() => {
    if(!walletConnected) {

        web3ModalRef.current = new Web3Modal({
          network: "rinkeby",
          providerOptions: {},
          disableInjectedProvider: false,
        });
        connectWallet();
        getAmounts();
    }
  }, [walletConnected]);

   /*
      renderButton: Returns a button based on the state of the dapp
  */
  const renderButton = () => {

    if(!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }

    // If we are currently waiting for something, return a loading button
    if (loading) {
      return <button className={styles.button}>Loading...</button>
    }

    if (liquidityTab) {
      return (
        <div>
          <div className={styles.description}>
            You have:
            <br />
            {utils.formatEther(pbBalance)} Pleb Tokens
            <br /> 
            {utils.formatEther(ethBalance)} Ether
            <br />
            {utils.formatEther(lpBalance)} LP tokens
          </div>
          <div>
            {/* If reserved Pb is zero, render the state for liquidity zero where we ask the user
            how much initial liquidity he wants to add else just render the state where liquidity is not zero and
            we calculate based on the `Eth` amount specified by the user how much `Pb` tokens can be added */}
            {utils.parseEther(pbReserve.toString()).eq(zero) ? (
              <div>
                <input
                  type="number"
                  placeholder="Amount of Ether"
                  onChange={(e) => setAddEther(e.target.value || "0")}
                  className={styles.input}
                />
                <input
                  type="number"
                  placeholder="Amount of Pleb tokens"
                  onChange={(e) => setAddPbTokens(
                    BigNumber.from(utils.parseEther(e.target.value || "0"))
                  )}
                  className={styles.input}
                />
                <button className={styles.button1} onClick={_addLiquidity}>
                  Add
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="number"
                  placeholder="Amount of Ether"
                  onChange={async (e) => {
                    setAddEther(e.target.value || "0");
                    // calculate the amount of Pb tokens that can be added given `e.target.value` amount of Eth
                    const _addPbTokens = await calculatePb(
                      e.target.value || "0",
                      ethBalanceContract,
                      pbReserve
                    );
                    setAddPbTokens(_addPbTokens);
                  }}
                  className={styles.input}
                />
                <div className={styles.inputDiv}>
                  {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
                  {`You will need ${utils.formatEther(addPbTokens)} Pleb Tokens`}
                </div>
                <button className={styles.button1} onClick={_addLiquidity}>
                  Add
                </button>
              </div>
            )}
            <div>
              <input
                type="number"
                placeholder="Amount of LP Tokens"
                onChange={async (e) => {
                  setRemoveLPTokens(e.target.value || "0");
                  // Calculate the amount of Ether and CD tokens that the user would receive
                  // After he removes `e.target.value` amount of `LP` tokens
                  await _getTokensAfterRemove(e.target.value || "0");
                }}
                className={styles.input}
              />
              <div className={styles.inputDiv}>
                {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
                {`You will get ${utils.formatEther(removePb)} Pleb Tokens and ${utils.formatEther(removeEther)} Eth`}
              </div>
              <button className={styles.button1} onClick={_removeLiquidity}>
                Remove
              </button>
            </div>
          </div>
        </div>
      );
    } else {
        return (
          <div>
            <input
              type="number"
              placeholder="Amount"
              onChange={async (e) => {
                setSwapAmount(e.target.value || "");
                await _getAmountOfTokensReceivedFromSwap(e.target.value || "0");
              }}
              className={styles.input}
              value={swapAmount}
            />
            <select
              className={styles.select}
              name="dropdown"
              id="dropdown"
              onChange={async () => {
                setEthSelected(!ethSelected);
                await _getAmountOfTokensReceivedFromSwap(0);
                setSwapAmount("");
              }}
            >
              <option value="eth">Ethereum</option>
              <option value="plebToken">Pleb Token</option>
            </select>
            <br />
            <div className={styles.inputDiv}>
              {ethSelected
                ? `You will get ${utils.formatEther(tokensToBeReceivedAfterSwap)} Pleb Tokens`
                : `You will get ${utils.formatEther(tokensToBeReceivedAfterSwap)} Eth`
              }
            </div>
            <button className={styles.button1} onClick={_swapTokens}>
              Swap
            </button>
          </div>
        );
    }
  };


  return (
    <div>
      <Head>
        <title>DePlebs Exchange</title>
        <meta name="description" content="DePlebs Coin Exchange"/>
        <link rel="icon" href="/DePleb.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to DePlebs Exchange!</h1>
          <div className={styles.description}>
            Exchange Ethereum &#60;&#62; Pleb Tokens
          </div>
          <div>
            <button
              className={styles.button}
              onClick={()=>{
                setLiquidityTab(true);
              }}
            >
              Liquidity
            </button>
            <button
              className={styles.button}
              onClick={()=> {
                setLiquidityTab(false)
              }}
            >
              Swap
            </button>
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./1.png" />
        </div>
      </div>
      <footer className={styles.footer}>
        Made with &#10084; by Alisa
      </footer>
    </div>
  )
}
