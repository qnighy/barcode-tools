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

export default function Home(): ReactElement | null {
  const [symbolType, setSymbolType] = useState<QRSymbolType>("QR");
  const [minErrorCorrectionLevel, setMinErrorCorrectionLevel] = useState<ErrorCorrectionLevelOrNone>("NONE");
  const modifiedMinErrorCorrectionLevel =
    symbolType === "QR" && minErrorCorrectionLevel === "L"
      ? "NONE"
      : symbolType === "MicroQR" && minErrorCorrectionLevel === "H"
      ? "Q"
      : minErrorCorrectionLevel;

  const [minSize, setMinSize] = useState<number | null>(null);
  const [maxSize, setMaxSize] = useState<number | null>(null);
  const symbolMaxSize = symbolType === "QR" ? 40 : 4;
  const cappedMinSize = Math.max(1, minSize ?? 1);
  const cappedMaxSize = Math.min(symbolMaxSize, maxSize ?? symbolMaxSize);
  const setCappedMinSize = useCallback((value: number) => {
    if (value <= 1) {
      setMinSize(null);
    } else {
      setMinSize(Math.min(value, cappedMaxSize, symbolMaxSize));
    }
  }, [cappedMaxSize, symbolMaxSize]);
  const setCappedMaxSize = useCallback((value: number) => {
    if (value >= symbolMaxSize) {
      setMaxSize(null);
    } else {
      setMaxSize(Math.max(value, cappedMinSize, 1));
    }
  }, [cappedMinSize, symbolMaxSize]);

  const [text, setText] = useState<string>("");
  const maxBitLength = useMemo((): number => getMaxBitLength(symbolType, modifiedMinErrorCorrectionLevel), [symbolType, modifiedMinErrorCorrectionLevel]);
  const result = useMemo<QRResult>((): QRResult => {
    try {
      const { bodyBitLength, svg } = encodeToQRSVG(text, {
        symbolType,
        minErrorCorrectionLevel: modifiedMinErrorCorrectionLevel,
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
  }, [text, symbolType, modifiedMinErrorCorrectionLevel]);

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
              setMinSize(null);
              setMaxSize(null);
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
            <label
              className="flex flex-row gap-2 mb-4 text-sm font-medium text-gray-700"
            >
              <div
                className="w-[15em]"
              >
                Minimum Size: {cappedMinSize}
              </div>
              <input
                type="range"
                className="grow w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                min={1}
                max={symbolMaxSize}
                value={cappedMinSize}
                onChange={(e) => {
                  setCappedMinSize(Math.trunc(Number(e.currentTarget.value)));
                }}
              />
            </label>
            <label
              className="flex flex-row gap-2 mb-4 text-sm font-medium text-gray-700"
            >
              <div
                className="w-[15em]"
              >
                Maximum Size: {cappedMaxSize}
              </div>
              <input
                type="range"
                className="grow w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                min={1}
                max={symbolMaxSize}
                value={cappedMaxSize}
                onChange={(e) => {
                  setCappedMaxSize(Math.trunc(Number(e.currentTarget.value)));
                }}
              />
            </label>
          </div>
        </details>
      </main>
    </div>
  );
}
