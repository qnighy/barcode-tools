"use client";

import { ReactElement, useEffect, useMemo, useState } from "react";
import { BitOverflowError, encodeToQRSVG, ErrorCorrectionLevelOrNone } from "./lib/qrcode";

type QRResult = QRSuccessResult | QRBitOverflowResult;
type QRSuccessResult = {
  type: "success";
  bodyBitLength: number;
  svg: string;
};
type QRBitOverflowResult = {
  type: "BitOverflow";
  error: BitOverflowError;
  bodyBitLength: number;
  svg: null;
};

type SymbolType = "QR" | "MicroQR";

export default function Home(): ReactElement | null {
  const [symbolType, setSymbolType] = useState<SymbolType>("QR");
  const [minErrorCorrectionLevel, setMinErrorCorrectionLevel] = useState<ErrorCorrectionLevelOrNone>("NONE");

  const [text, setText] = useState<string>("");
  const maxBitLength = 23648; // Version 40, L
  const result = useMemo<QRResult>(() => {
    try {
      const { bodyBitLength, svg } = encodeToQRSVG(text, {
        allowMicroQR: symbolType === "MicroQR",
        minErrorCorrectionLevel,
      });
      return {
        type: "success",
        bodyBitLength,
        svg,
      };
    } catch (e) {
      if (e instanceof BitOverflowError) {
        return {
          type: "BitOverflow",
          error: e,
          bodyBitLength: e.bodyBitLength,
          svg: null,
        };
      }
      throw e;
    }
  }, [text, symbolType, minErrorCorrectionLevel]);

  const { bodyBitLength, svg } = result;

  const percentage = useMemo(() => {
    const ratio = bodyBitLength / maxBitLength;
    const fractionDigits = 3;
    return `${(ratio * 100).toFixed(fractionDigits)}%`;
  }, [bodyBitLength, maxBitLength]);

  const [svgURL, setSvgURL] = useState<string | null>(null);
  useEffect(() => {
    if (svg != null) {
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const obj = URL.createObjectURL(blob);

      setSvgURL(obj);
      return () => URL.revokeObjectURL(obj);
    } else {
      setSvgURL(null);
    }
  }, [svg]);
  return (
    <div className="grid justify-items-center p-8">
      <main className="flex flex-col gap-[32px] row-start-2 align-items-center sm:items-start">
        <h1 className="text-3xl font-bold text-center">
          QR Code Generator
        </h1>
        <div className="flex flex-row gap-4">
          <select
            className="w-40 p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={symbolType}
            onChange={(e) => {
              setSymbolType(e.currentTarget.value as SymbolType);
            }}
          >
            <option value="QR">QR Code</option>
            <option value="MicroQR">Micro QR Code</option>
          </select>
          <select
            className="w-50 p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={
              symbolType === "QR" && minErrorCorrectionLevel === "L"
              ? "NONE"
              : minErrorCorrectionLevel
            }
            onChange={(e) => {
              setMinErrorCorrectionLevel(e.currentTarget.value as ErrorCorrectionLevelOrNone);
            }}
          >
            {
              symbolType === "QR" &&
                <option value="NONE">Error Correction: L</option>
            }
            {
              symbolType === "MicroQR" &&
                <>
                  <option value="NONE">Error Correction: Any</option>
                  <option value="L">Error Correction: L</option>
                </>
            }
            <option value="M">Error Correction: M</option>
            <option value="Q">Error Correction: Q</option>
            <option value="H">Error Correction: H</option>
          </select>
        </div>
        <textarea
          className="w-full h-[200px] p-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter text to generate QR code"
          defaultValue=""
          onChange={(e) => {
            setText(e.target.value);
          }}
        />
        <div className="text-sm text-gray-500">
          {percentage}
        </div>
        <div
          className="w-3xl flex flex-col place-content-center items-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {svgURL && <img className="max-h-lvh max-w-full" src={svgURL} alt="Generated QR Code" />}
        </div>
      </main>
    </div>
  );
}
