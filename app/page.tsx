"use client";

import { ReactElement, useEffect, useMemo, useState } from "react";
import { encodeToQRSVG } from "./lib/qrcode";

export default function Home(): ReactElement | null {
  const [text, setText] = useState<string>("");
  const svg = useMemo(() => encodeToQRSVG(text).svg, [text]);

  const [svgURL, setSvgURL] = useState<string | null>(null);
  useEffect(() => {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const obj = URL.createObjectURL(blob);

    setSvgURL(obj);
    return () => URL.revokeObjectURL(obj);
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {svgURL && <img src={svgURL} alt="Generated QR Code" />}
      </main>
    </div>
  );
}
