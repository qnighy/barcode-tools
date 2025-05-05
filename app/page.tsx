"use client";

import { ReactElement, useEffect, useMemo, useState } from "react";
import { BitOverflowError, encodeToQRSVG } from "./lib/qrcode";

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

export default function Home(): ReactElement | null {
  const [text, setText] = useState<string>("");
  const maxBitLength = 23648; // Version 40, L
  const result = useMemo<QRResult>(() => {
    try {
      const { bodyBitLength, svg } = encodeToQRSVG(text);
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
  }, [text]);

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
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {svgURL && <img className="max-h-lvh max-w-lvw" src={svgURL} alt="Generated QR Code" />}
      </main>
    </div>
  );
}
