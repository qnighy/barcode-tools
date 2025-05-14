"use client";

import { ReactElement, useCallback, useEffect, useMemo, useState } from "react";
import { BitOverflowError, UnsupportedContentError, encodeToQRSVG, ErrorCorrectionLevelOrNone, QRSymbolType, getMaxBitLength } from "./lib/qrcode";

type QRResult = QRSuccessResult | QRBitOverflowResult | QRUnsupportedContentResult;
type QRSuccessResult = {
  type: "success";
  bodyBitLength: number;
  svg: string;
};
type QRBitOverflowResult = {
  type: "BitOverflow";
  error: BitOverflowError;
  bodyBitLength: number;
  maxBitLength: number;
  svg: null;
};
type QRUnsupportedContentResult = {
  type: "UnsupportedContent";
  error: UnsupportedContentError;
  bodyBitLength: number;
  maxBitLength: number;
  svg: null;
};

const MIN_QR_WIDTH = 21;
const MAX_QR_WIDTH = 177;
const MIN_MICRO_QR_WIDTH = 11;
const MAX_MICRO_QR_WIDTH = 17;

export default function Home(): ReactElement | null {
  const [symbolType, setSymbolType] = useState<QRSymbolType>("QR");
  const [minErrorCorrectionLevel, setMinErrorCorrectionLevel] = useState<ErrorCorrectionLevelOrNone>("NONE");
  const modifiedMinErrorCorrectionLevel =
    symbolType === "QR" && minErrorCorrectionLevel === "L"
      ? "NONE"
      : symbolType === "MicroQR" && minErrorCorrectionLevel === "H"
      ? "Q"
      : minErrorCorrectionLevel;

  const [minQRWidth, setMinQRWidth] = useState<number>(MIN_QR_WIDTH);
  const [maxQRWidth, setMaxQRWidth] = useState<number>(MAX_QR_WIDTH);
  const setAdjustedMinQRWidth = useCallback((value: number) => {
    setMinQRWidth(Math.min(Math.trunc((value - 17) / 4) * 4 + 17, maxQRWidth));
  }, [maxQRWidth]);
  const setAdjustedMaxQRWidth = useCallback((value: number) => {
    setMaxQRWidth(Math.max(Math.trunc((value - 17) / 4) * 4 + 17, minQRWidth));
  }, [minQRWidth]);

  const derivedMicroQRWidthLowerBound =
    minErrorCorrectionLevel === "L" || minErrorCorrectionLevel === "M"
      ? 13 // M2
      : minErrorCorrectionLevel === "Q"
      ? 17 // M4
      : 11;

  const [minMicroQRWidth, setMinMicroQRWidth] = useState<number>(MIN_MICRO_QR_WIDTH);
  const [maxMicroQRWidth, setMaxMicroQRWidth] = useState<number>(MAX_MICRO_QR_WIDTH);
  const maxMicroQRWidth2 = Math.max(maxMicroQRWidth, derivedMicroQRWidthLowerBound);
  const setAdjustedMinMicroQRWidth = useCallback((value: number) => {
    setMinMicroQRWidth(Math.min(Math.trunc((value - 9) / 2) * 2 + 9, maxMicroQRWidth));
  }, [maxMicroQRWidth]);
  const setAdjustedMaxMicroQRWidth = useCallback((value: number) => {
    setMaxMicroQRWidth(Math.max(Math.trunc((value - 9) / 2) * 2 + 9, minMicroQRWidth, derivedMicroQRWidthLowerBound));
  }, [minMicroQRWidth, derivedMicroQRWidthLowerBound]);

  const maxWidth = symbolType === "QR" ? maxQRWidth : maxMicroQRWidth2;
  const minWidth = Math.min(symbolType === "QR" ? minQRWidth : minMicroQRWidth, maxWidth);

  const [text, setText] = useState<string>("");
  const maxBitLength = useMemo((): number =>
    getMaxBitLength({
      symbolType,
      minErrorCorrectionLevel: modifiedMinErrorCorrectionLevel,
      minWidth,
      maxWidth,
    }),
    [symbolType, modifiedMinErrorCorrectionLevel, minWidth, maxWidth]
  );
  const result = useMemo<QRResult>((): QRResult => {
    try {
      const { bodyBitLength, svg } = encodeToQRSVG(text, {
        symbolType,
        minErrorCorrectionLevel: modifiedMinErrorCorrectionLevel,
        minWidth,
        maxWidth,
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
          maxBitLength: e.maxBitLength,
          svg: null,
        };
      } else if (e instanceof UnsupportedContentError) {
        return {
          type: "UnsupportedContent",
          error: e,
          bodyBitLength: Infinity,
          maxBitLength: e.maxBitLength,
          svg: null,
        };
      }
      throw e;
    }
  }, [text, symbolType, modifiedMinErrorCorrectionLevel, minWidth, maxWidth]);

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
              setSymbolType(e.currentTarget.value as QRSymbolType);
              setAdjustedMinQRWidth(MIN_QR_WIDTH);
              setAdjustedMaxQRWidth(MAX_QR_WIDTH);
              setAdjustedMinMicroQRWidth(MIN_MICRO_QR_WIDTH);
              setAdjustedMaxMicroQRWidth(MAX_MICRO_QR_WIDTH);
            }}
          >
            <option value="QR">QR Code</option>
            <option value="MicroQR">Micro QR Code</option>
          </select>
          <select
            className="w-50 p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={modifiedMinErrorCorrectionLevel}
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
            {
              symbolType === "QR" &&
                <option value="H">Error Correction: H</option>
            }
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
          className="w-3xl min-h-[200px] flex flex-col place-content-center items-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {svgURL && <img className="max-h-lvh max-w-full" src={svgURL} alt="Generated QR Code" />}
        </div>
        <details
          className="w-3xl flex flex-col place-content-center items-center border border-gray-300 rounded-lg shadow-sm"
        >
          <summary
            className="w-full p-4 text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Settings
          </summary>
          <div className="w-3xl p-4 text-left">
            <h3 className="text-lg font-bold">
              Size
            </h3>
            {
              symbolType === "QR" && (
                <>
                  <label
                    className="flex flex-row gap-2 mb-4 text-sm font-medium text-gray-700"
                  >
                    <div
                      className="w-[15em]"
                    >
                      Minimum Size: {minQRWidth}
                    </div>
                    <input
                      type="range"
                      className="grow w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      min={MIN_QR_WIDTH}
                      max={MAX_QR_WIDTH}
                      step={4}
                      value={minQRWidth}
                      onChange={(e) => {
                        setAdjustedMinQRWidth(Math.trunc(Number(e.currentTarget.value)));
                      }}
                    />
                  </label>
                  <label
                    className="flex flex-row gap-2 mb-4 text-sm font-medium text-gray-700"
                  >
                    <div
                      className="w-[15em]"
                    >
                      Maximum Size: {maxQRWidth}
                    </div>
                    <input
                      type="range"
                      className="grow w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      min={MIN_QR_WIDTH}
                      max={MAX_QR_WIDTH}
                      step={4}
                      value={maxQRWidth}
                      onChange={(e) => {
                        setAdjustedMaxQRWidth(Math.trunc(Number(e.currentTarget.value)));
                      }}
                    />
                  </label>
                </>
              )
            }
            {
              symbolType === "MicroQR" && (
                <>
                  <label
                    className="flex flex-row gap-2 mb-4 text-sm font-medium text-gray-700"
                  >
                    <div
                      className="w-[15em]"
                    >
                      Minimum Size: {minMicroQRWidth}
                    </div>
                    <input
                      type="range"
                      className="grow w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      min={MIN_MICRO_QR_WIDTH}
                      max={MAX_MICRO_QR_WIDTH}
                      step={2}
                      value={minMicroQRWidth}
                      onChange={(e) => {
                        setAdjustedMinMicroQRWidth(Math.trunc(Number(e.currentTarget.value)));
                      }}
                    />
                  </label>
                  <label
                    className="flex flex-row gap-2 mb-4 text-sm font-medium text-gray-700"
                  >
                    <div
                      className="w-[15em]"
                    >
                      Maximum Size: {maxMicroQRWidth2}
                    </div>
                    <input
                      type="range"
                      className="grow w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      min={MIN_MICRO_QR_WIDTH}
                      max={MAX_MICRO_QR_WIDTH}
                      value={maxMicroQRWidth2}
                      onChange={(e) => {
                        setAdjustedMaxMicroQRWidth(Math.trunc(Number(e.currentTarget.value)));
                      }}
                    />
                  </label>
                </>
              )
            }
          </div>
        </details>
      </main>
    </div>
  );
}
