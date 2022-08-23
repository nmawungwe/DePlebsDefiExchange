// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Exchange is ERC20 {
    address public dePlebTokenAddress;

    constructor(address _DePlebsToken) ERC20("DePlebs LP Token", "DLP") {
        require(_DePlebsToken != address(0), "Token address passed is a null address");
        dePlebTokenAddress = _DePlebsToken;
    }

    function getReserve() public view returns (uint) {
        return ERC20(dePlebTokenAddress).balanceOf(address(this));
    }

    function addLiquidity(uint _amount) public payable returns(uint) {
        uint liquidity;
        uint ethBalance = address(this).balance;
        uint dePlebTokenReserve = getReserve();
        ERC20 dePlebToken = ERC20(dePlebTokenAddress);

        if(dePlebTokenReserve == 0) {
            dePlebToken.transferFrom(msg.sender, address(this), _amount);
            liquidity = ethBalance;
            
            _mint(msg.sender, liquidity);
        } else {
            uint ethReserve = ethBalance - msg.value;
            uint dePlebTokenAmount = (msg.value * dePlebTokenReserve)/(ethReserve);
            require(_amount >= dePlebTokenAmount, "Amount of tokens sent is less than the minimum tokens required.");
            dePlebToken.transferFrom(msg.sender, address(this), dePlebTokenAmount);

            liquidity = (totalSupply() * msg.value) / ethReserve;
            _mint(msg.sender, liquidity);
        }
    }

    function removeLiquidity(uint _amount) public returns (uint, uint) {
        require(_amount > 0, "_amount should be greater than zero");
        uint ethReserve = address(this).balance;
        uint _totalSupply = totalSupply();

        uint ethAmount = (ethReserve * _amount) / _totalSupply;
        uint dePlebAmount = (getReserve() * _amount) / _totalSupply;

        _burn(msg.sender, _amount);
        payable(msg.sender).transfer(ethAmount);
        ERC20(dePlebTokenAddress).transfer(msg.sender, dePlebAmount);
        return (ethAmount, dePlebAmount);
    }

    function getAmountOfTokens(
        uint256 inputAmount,
        uint256 inputReserve,
        uint256 outputReserve
    ) public pure returns (uint256) {
        require(inputReserve > 0 && outputReserve > 0, "invalid reserves");

        // We are charging a fee of `1%`
        uint256 inputAmountWithFee = inputAmount * 99;

        uint256 numerator = inputAmountWithFee * outputReserve;
        uint256 denominator = (inputReserve * 100) + inputAmountWithFee;
        return numerator / denominator;
    }

    function ethToDePlebToken(uint _minTokens) public payable {
        uint256 tokenReserve = getReserve();

        uint256 tokensBought = getAmountOfTokens(
            msg.value,
            address(this).balance - msg.value,
            tokenReserve
        );

        require(tokensBought >= _minTokens, "insufficient output amount");
        ERC20(dePlebTokenAddress).transfer(msg.sender, tokensBought);  
    }

    function dePlebTokenToEth(uint _tokensSold, uint _minEth) public {
        uint256 tokenReserve = getReserve();

        uint256 ethBought = getAmountOfTokens(
            _tokensSold,
            tokenReserve, 
            address(this).balance 
            );
        
        require(ethBought >= _minEth, "insufficient output amount");
        
        ERC20(dePlebTokenAddress).transferFrom(
            msg.sender,
            address(this),
            _tokensSold
        );

        payable(msg.sender).transfer(ethBought);
    }

}