'use client';

import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '@/lib/i18n/LocaleProvider';

const VIEW = 280; // حجم منطقة المعاينة (مربّعة)

/** معاينة وضبط الصورة (تكبير + تحريك + اقتصاص مربّع) قبل الحفظ. */
export default function ImageCropper({
  src, outputSize = 512, round = false, onCancel, onConfirm,
}: {
  src: string;
  outputSize?: number;
  round?: boolean;
  onCancel: () => void;
  onConfirm: (dataUrl: string) => void;
}) {
  const t = useT();
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);

  // تحميل الأبعاد الأصلية + التوسيط المبدئي
  useEffect(() => {
    const im = new Image();
    im.onload = () => {
      imgRef.current = im;
      const b = VIEW / Math.min(im.naturalWidth, im.naturalHeight);
      setNat({ w: im.naturalWidth, h: im.naturalHeight });
      setZoom(1);
      setPos({ x: (VIEW - im.naturalWidth * b) / 2, y: (VIEW - im.naturalHeight * b) / 2 });
    };
    im.src = src;
  }, [src]);

  const base = nat ? VIEW / Math.min(nat.w, nat.h) : 1;
  const scale = base * zoom;
  const imgW = nat ? nat.w * scale : VIEW;
  const imgH = nat ? nat.h * scale : VIEW;

  // إبقاء الصورة مغطّية لمنطقة المعاينة (بلا فراغات)
  const clamp = (p: { x: number; y: number }, w: number, h: number) => ({
    x: Math.min(0, Math.max(VIEW - w, p.x)),
    y: Math.min(0, Math.max(VIEW - h, p.y)),
  });

  function onZoom(z: number) {
    if (!nat) { setZoom(z); return; }
    const oldScale = base * zoom, newScale = base * z;
    const nx = VIEW / 2 - (VIEW / 2 - pos.x) * (newScale / oldScale);
    const ny = VIEW / 2 - (VIEW / 2 - pos.y) * (newScale / oldScale);
    setZoom(z);
    setPos(clamp({ x: nx, y: ny }, nat.w * newScale, nat.h * newScale));
  }

  function down(e: RPointerEvent<HTMLDivElement>) {
    drag.current = { sx: e.clientX, sy: e.clientY, px: pos.x, py: pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e: RPointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const nx = drag.current.px + (e.clientX - drag.current.sx);
    const ny = drag.current.py + (e.clientY - drag.current.sy);
    setPos(clamp({ x: nx, y: ny }, imgW, imgH));
  }
  function up() { drag.current = null; }

  function apply() {
    const img = imgRef.current;
    if (!img) return;
    const srcSize = VIEW / scale;      // حجم المقطع المصدري بالبكسل الأصلي
    const sx = -pos.x / scale, sy = -pos.y / scale;
    const canvas = document.createElement('canvas');
    canvas.width = outputSize; canvas.height = outputSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, srcSize, srcSize, 0, 0, outputSize, outputSize);
    onConfirm(canvas.toDataURL('image/png'));
  }

  return createPortal(
    <div className="crp-overlay" role="dialog" aria-modal="true">
      <div className="crp-box">
        <div className="crp-title">{t('crop.title')}</div>
        <div
          className="crp-view"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
        >
          {nat && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              draggable={false}
              className="crp-img"
              style={{ left: pos.x, top: pos.y, width: imgW, height: imgH }}
            />
          )}
          <div className={`crp-frame ${round ? 'is-round' : ''}`} aria-hidden="true" />
        </div>
        <div className="crp-zoom-row">
          <span aria-hidden="true">−</span>
          <input type="range" min="1" max="4" step="0.01" value={zoom} onChange={(e) => onZoom(Number(e.target.value))} className="crp-zoom" aria-label={t('crop.zoom')} />
          <span aria-hidden="true">+</span>
        </div>
        <p className="crp-hint">{t('crop.hint')}</p>
        <div className="crp-actions">
          <button type="button" className="org-btn org-btn-primary" onClick={apply}>{t('crop.apply')}</button>
          <button type="button" className="org-btn org-btn-outline" onClick={onCancel}>{t('shell.cancel')}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
