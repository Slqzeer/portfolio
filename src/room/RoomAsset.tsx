import { useState } from "react";

interface RoomAssetProps {
  src: string;
  label: string;
  className?: string;
}

export function RoomAsset({ src, label, className }: RoomAssetProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={className}
        role="img"
        aria-label={`${label} indisponible`}
      >
        {label}
      </span>
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={label}
      onError={() => setFailed(true)}
      data-room-asset
    />
  );
}
