import { NineSliceFrame } from '@nine-slice-frame/react';
import type { ReactNode } from 'react';
import type { CardFrameSkin } from '../domain/cardFrames';

interface TarotCardFrameProps {
  frame: CardFrameSkin;
  className?: string;
  children: ReactNode;
}

export function TarotCardFrame({ frame, className = '', children }: TarotCardFrameProps) {
  return (
    <div
      className={`tarotCardFrame ${frame.className} ${className}`.trim()}
      data-card-frame={frame.id}
    >
      <NineSliceFrame
        imagePath={`${import.meta.env.BASE_URL}${frame.imagePath}`}
        slice={82}
        borderWidth={22}
        fill={false}
        pixelated={false}
        className="tarotCardFrameNineSlice"
      >
        <span className="tarotCardFrameCrest" aria-hidden="true">{frame.crest}</span>
        <div className="tarotCardFrameContent">{children}</div>
      </NineSliceFrame>
    </div>
  );
}
