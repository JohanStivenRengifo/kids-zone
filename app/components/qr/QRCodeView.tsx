"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";

interface Props {
  payload: string;
  alt?: string;
  caption?: string;
  size?: number;
}

/** Renderiza un código QR (data URL) a partir del payload dado. */
export function QRCodeView({ payload, alt = "Código QR", caption, size = 180 }: Props) {
  return (
    <div className="flex flex-col items-center gap-1">
      {/* key={payload} reinicia el estado de carga al cambiar el código (sin setState en efecto) */}
      <QRImage key={payload} payload={payload} alt={alt} size={size} />
      {caption ? <span className="text-center text-xs text-zinc-600">{caption}</span> : null}
    </div>
  );
}

function QRImage({ payload, alt, size }: { payload: string; alt: string; size: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(payload, { errorCorrectionLevel: "M", margin: 1, width: size })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [payload, size]);

  if (!dataUrl) {
    return <div style={{ width: size, height: size }} className="animate-pulse rounded border bg-zinc-100" />;
  }
  return (
    <Image
      src={dataUrl}
      alt={alt}
      width={size}
      height={size}
      unoptimized
      className="rounded border bg-white"
    />
  );
}