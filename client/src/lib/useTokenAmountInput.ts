"use client";

import { useState, useCallback } from "react";

export type AmountMode = "token" | "usd";

export interface TokenAmountInputState {
  mode: AmountMode;
  /** Current value in the input box (token qty or USD depending on mode) */
  inputValue: string;
  /** Always the actual token quantity — use this for quotes and transactions */
  tokenAmount: string;
  /** Secondary line label (the other denomination). Null when no price or no input. */
  secondaryDisplay: string | null;
  setInputValue: (v: string) => void;
  /** Toggle between token and USD mode, converting the current value */
  toggleMode: () => void;
  /** Set input from a token amount string (e.g. MAX / % buttons). Converts to USD if in USD mode. */
  setTokenAmountDirect: (tokenAmt: string) => void;
  /** Reset back to token mode with an empty input */
  reset: () => void;
}

function calcUsdDisplay(tokenAmt: string, price: number): string | null {
  if (!price) return null;
  const n = parseFloat(tokenAmt);
  if (!isFinite(n) || n <= 0) return null;
  return `~$${(n * price).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function calcTokenDisplay(usdAmt: string, price: number, symbol: string): string | null {
  if (!price) return null;
  const n = parseFloat(usdAmt);
  if (!isFinite(n) || n <= 0) return null;
  const tokens = n / price;
  // Up to 6 significant digits, strip trailing zeros
  const formatted = parseFloat(tokens.toPrecision(6)).toString();
  return `~${formatted} ${symbol}`;
}

function usdToTokenAmount(usd: string, price: number, decimals: number): string {
  if (!price || !usd) return "";
  const n = parseFloat(usd);
  if (!isFinite(n) || n <= 0) return "";
  // Use enough decimal places then strip trailing zeros
  return parseFloat((n / price).toFixed(Math.min(decimals, 18))).toString();
}

function tokenToUsdAmount(token: string, price: number): string {
  if (!price || !token) return "";
  const n = parseFloat(token);
  if (!isFinite(n) || n <= 0) return "";
  return (n * price).toFixed(2);
}

export function useTokenAmountInput(
  price: number,
  symbol: string,
  decimals: number,
): TokenAmountInputState {
  const [mode, setMode] = useState<AmountMode>("token");
  const [inputValue, setInputValueState] = useState("");

  const tokenAmount: string =
    mode === "token"
      ? inputValue
      : usdToTokenAmount(inputValue, price, decimals);

  const secondaryDisplay: string | null =
    !inputValue || parseFloat(inputValue) <= 0
      ? null
      : mode === "token"
      ? calcUsdDisplay(inputValue, price)
      : calcTokenDisplay(inputValue, price, symbol);

  const setInputValue = useCallback((v: string) => setInputValueState(v), []);

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === "token" ? "usd" : "token";
      setInputValueState((cur) => {
        if (!cur || parseFloat(cur) <= 0) return "";
        if (next === "usd") return tokenToUsdAmount(cur, price);
        return usdToTokenAmount(cur, price, decimals);
      });
      return next;
    });
  }, [price, decimals]);

  const setTokenAmountDirect = useCallback(
    (tokenAmt: string) => {
      if (mode === "token") {
        setInputValueState(tokenAmt);
      } else {
        setInputValueState(tokenToUsdAmount(tokenAmt, price));
      }
    },
    [mode, price],
  );

  const reset = useCallback(() => {
    setMode("token");
    setInputValueState("");
  }, []);

  return {
    mode,
    inputValue,
    tokenAmount,
    secondaryDisplay,
    setInputValue,
    toggleMode,
    setTokenAmountDirect,
    reset,
  };
}
