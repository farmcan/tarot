import { NineSliceFrame } from '@nine-slice-frame/react';
import type { ReactNode } from 'react';
import type { CardFrameSkin, CardFrameTone } from '../domain/cardFrames';

interface TarotCardFrameProps {
  frame: CardFrameSkin;
  tone?: CardFrameTone;
  className?: string;
  children: ReactNode;
}

export function TarotCardFrame({ frame, tone, className = '', children }: TarotCardFrameProps) {
  const frameImagePath = (tone && frame.toneImagePaths?.[tone]) || frame.imagePath;

  return (
    <div
      className={`tarotCardFrame ${frame.className} ${tone ? `frame-tone-${tone}` : ''} ${className}`.trim()}
      data-card-frame={frame.id}
      data-card-tone={tone}
    >
      <NineSliceFrame
        imagePath={`${import.meta.env.BASE_URL}${frameImagePath}`}
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
