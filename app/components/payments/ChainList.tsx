import type { SerializedBlock } from "@/lib/payments";
import { BlockCard } from "./BlockCard";

interface Props {
  blocks: SerializedBlock[];
  annulled: number[];
  onAnnul: (index: number, motivo: string) => boolean;
}

/** SRP: solo compone la lista de tarjetas. */
export function ChainList({ blocks, annulled, onAnnul }: Props) {
  const annulledSet = new Set(annulled);
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block) => (
        <BlockCard
          key={block.index}
          block={block}
          annulled={annulledSet.has(block.index)}
          onAnnul={onAnnul}
        />
      ))}
    </div>
  );
}
