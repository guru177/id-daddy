import React from 'react';

interface RulerProps {
  type: 'horizontal' | 'vertical';
  size: number; // This is the total length of the ruler in the UI
  scale: number;
  offset?: number; // Distance from the start of the ruler to the 0 point of the card
  onStartDrag?: (type: 'horizontal' | 'vertical', startE: React.MouseEvent) => void;
}

export const Ruler: React.FC<RulerProps> = ({ type, size, scale, offset = 0, onStartDrag }) => {
  const isHorizontal = type === 'horizontal';
  const pixelsPerTick = 10;
  const majorTickFreq = 100;
  const mediumTickFreq = 50;

  const ticks = [];
  
  // We need to render ticks for the entire 'size' of the ruler element.
  // The '0' point is at 'offset'.
  // The step in physical pixels is pixelsPerTick * scale.
  const physicalStep = pixelsPerTick * scale;

  // Find the first tick position before the ruler start
  let startVal = Math.floor(-offset / scale / pixelsPerTick) * pixelsPerTick;
  
  for (let val = startVal; (val * scale + offset) <= size; val += pixelsPerTick) {
    const pos = val * scale + offset;
    if (pos < 0) continue;

    const isMajor = val % majorTickFreq === 0;
    const isMedium = val % mediumTickFreq === 0;

    let tickHeight = 4;
    if (isMajor) tickHeight = 12;
    else if (isMedium) tickHeight = 8;

    ticks.push(
      <div
        key={val}
        className="absolute bg-gray-400 pointer-events-none"
        style={{
          [isHorizontal ? 'left' : 'top']: `${pos}px`,
          [isHorizontal ? 'top' : 'left']: 0,
          [isHorizontal ? 'width' : 'height']: '1px',
          [isHorizontal ? 'height' : 'width']: `${tickHeight}px`,
        }}
      >
        {isMajor && (
          <span
            className="absolute text-[8px] font-bold text-gray-900"
            style={{
              [isHorizontal ? 'left' : 'top']: '2px',
              [isHorizontal ? 'top' : 'left']: '8px',
              transform: isHorizontal ? 'none' : 'rotate(-90deg)',
              transformOrigin: 'top left',
              whiteSpace: 'nowrap'
            }}
          >
            {val}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      onMouseDown={(e) => onStartDrag?.(type, e)}
      className={`relative bg-stone-100 border-stone-300 overflow-hidden cursor-crosshair select-none active:bg-stone-200 transition-colors ${isHorizontal ? 'h-5 border-b w-full' : 'w-5 border-r h-full'}`}
    >
      {ticks}
    </div>
  );
};
