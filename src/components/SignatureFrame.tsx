import { useEffect, useRef, useState } from 'react';

interface Props {
  html: string;
  title: string;
  /** Visual scale for thumbnails (1 = actual size). */
  scale?: number;
  /** Width of the simulated viewport in CSS px. */
  width?: number | '100%';
  minHeight?: number;
  background?: string;
  padding?: number;
}

/**
 * Renders signature HTML in an isolated iframe so the app's own CSS cannot leak
 * into the preview — what you see is what the email client receives.
 * The sandbox allows same-origin (to measure height) but never scripts.
 */
export function SignatureFrame({ html, title, scale = 1, width = '100%', minHeight = 80, background = '#ffffff', padding = 20 }: Props) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(minHeight);

  const srcDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><base target="_blank"><style>html,body{margin:0;background:${background};}body{padding:${padding}px;}</style></head><body>${html}</body></html>`;

  useEffect(() => {
    const frame = ref.current;
    if (!frame) return;
    let observer: ResizeObserver | undefined;
    const measure = () => {
      const body = frame.contentDocument?.body;
      if (body) setHeight(Math.max(minHeight, Math.ceil(body.scrollHeight)));
    };
    const onLoad = () => {
      measure();
      const body = frame.contentDocument?.body;
      if (body && typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(measure);
        observer.observe(body);
      }
    };
    frame.addEventListener('load', onLoad);
    return () => {
      frame.removeEventListener('load', onLoad);
      observer?.disconnect();
    };
  }, [srcDoc, minHeight]);

  const w = width === '100%' ? '100%' : `${width}px`;
  return (
    <div style={{ width: width === '100%' ? '100%' : width * scale, height: height * scale, overflow: 'hidden' }}>
      <iframe
        ref={ref}
        title={title}
        srcDoc={srcDoc}
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer"
        tabIndex={scale < 1 ? -1 : undefined}
        style={{
          width: scale === 1 || width !== '100%' ? w : `${100 / scale}%`,
          height,
          border: 0,
          display: 'block',
          transform: scale === 1 ? undefined : `scale(${scale})`,
          transformOrigin: 'top left',
          pointerEvents: scale < 1 ? 'none' : undefined,
        }}
      />
    </div>
  );
}
