import type { Lighting } from "../app/appState";
import { roomGeometry } from "./roomGeometry";
import { RoomAsset } from "./RoomAsset";

interface RoomArtworkProps {
  lighting: Lighting;
}

export function RoomArtwork({ lighting }: RoomArtworkProps) {
  return (
    <RoomAsset
      className="room-artwork"
      src={roomGeometry.window.assets[lighting]}
      label="Chambre isométrique interactive"
    />
  );
}
