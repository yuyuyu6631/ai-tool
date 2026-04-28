import { Maximize2, Minus, Plus, X } from "lucide-react";

type CockpitControlsProps = {
  expanded: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onExpand: () => void;
  onClose: () => void;
};

export function CockpitControls({ expanded, onZoomIn, onZoomOut, onExpand, onClose }: CockpitControlsProps) {
  return (
    <div className="absolute right-3 top-3 z-30 flex gap-2 md:right-4 md:top-4">
      <button type="button" aria-label="放大雷达" onClick={onZoomIn} className="grid h-9 w-9 place-items-center rounded bg-white/10 text-white hover:bg-white/20">
        <Plus className="h-4 w-4" />
      </button>
      <button type="button" aria-label="缩小雷达" onClick={onZoomOut} className="grid h-9 w-9 place-items-center rounded bg-white/10 text-white hover:bg-white/20">
        <Minus className="h-4 w-4" />
      </button>
      <button type="button" aria-label="全屏探索雷达" onClick={onExpand} className="grid h-9 w-9 place-items-center rounded bg-white/10 text-white hover:bg-white/20">
        <Maximize2 className="h-4 w-4" />
      </button>
      {expanded ? (
        <button type="button" aria-label="关闭雷达探索" onClick={onClose} className="grid h-9 w-9 place-items-center rounded bg-lime-300 text-slate-950 hover:bg-lime-200">
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
