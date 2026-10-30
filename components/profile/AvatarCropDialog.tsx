'use client';

import { useRef, useState, type PointerEvent } from 'react';
import { Check, Move, RotateCcw, X } from 'lucide-react';

const cropSize = 256;

interface AvatarCropDialogProps {
  imageUrl: string;
  imageName: string;
  onCancel: () => void;
  onSave: (image: Blob) => Promise<void>;
  isSaving: boolean;
}

interface Point {
  x: number;
  y: number;
}

export default function AvatarCropDialog({
  imageUrl,
  imageName,
  onCancel,
  onSave,
  isSaving,
}: AvatarCropDialogProps) {
  const [dimensions, setDimensions] = useState<Point | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [cropError, setCropError] = useState('');
  const dragStart = useRef<{ pointer: Point; pan: Point } | null>(null);

  const aspectRatio = dimensions ? dimensions.x / dimensions.y : 1;
  const baseWidth = aspectRatio >= 1 ? cropSize * aspectRatio : cropSize;
  const baseHeight = aspectRatio >= 1 ? cropSize : cropSize / aspectRatio;

  const clampPan = (point: Point, nextZoom = zoom): Point => {
    const width = dimensions
      ? (dimensions.x / dimensions.y >= 1 ? cropSize * (dimensions.x / dimensions.y) : cropSize)
      : cropSize;
    const height = dimensions
      ? (dimensions.x / dimensions.y >= 1 ? cropSize : cropSize / (dimensions.x / dimensions.y))
      : cropSize;
    return {
      x: Math.max(-Math.max(0, (width * nextZoom - cropSize) / 2), Math.min(Math.max(0, (width * nextZoom - cropSize) / 2), point.x)),
      y: Math.max(-Math.max(0, (height * nextZoom - cropSize) / 2), Math.min(Math.max(0, (height * nextZoom - cropSize) / 2), point.y)),
    };
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!dimensions || isSaving) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = {
      pointer: { x: event.clientX, y: event.clientY },
      pan,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    setPan(clampPan({
      x: dragStart.current.pan.x + event.clientX - dragStart.current.pointer.x,
      y: dragStart.current.pan.y + event.clientY - dragStart.current.pointer.y,
    }));
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    dragStart.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleZoom = (value: number) => {
    setZoom(value);
    setPan((current) => clampPan(current, value));
  };

  const handleSave = () => {
    if (!dimensions || isSaving) return;
    const cropLength = Math.min(dimensions.x, dimensions.y) / zoom;
    const baseScale = cropSize / Math.min(dimensions.x, dimensions.y);
    const sourceCenterX = dimensions.x / 2 - pan.x / (baseScale * zoom);
    const sourceCenterY = dimensions.y / 2 - pan.y / (baseScale * zoom);
    const sourceX = Math.max(0, Math.min(dimensions.x - cropLength, sourceCenterX - cropLength / 2));
    const sourceY = Math.max(0, Math.min(dimensions.y - cropLength, sourceCenterY - cropLength / 2));
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    if (!context) {
      setCropError('This browser could not prepare the cropped photo. Try a different browser.');
      return;
    }
    const image = new window.Image();
    image.onload = () => {
      context.drawImage(image, sourceX, sourceY, cropLength, cropLength, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) {
          setCropError('Could not create the cropped photo. Please try again.');
          return;
        }
        void onSave(blob).catch((error: unknown) => {
          setCropError(error instanceof Error ? error.message : 'Unable to save the cropped photo.');
        });
      }, 'image/jpeg', 0.92);
    };
    image.onerror = () => setCropError('Could not read this photo. Choose another image and try again.');
    image.src = imageUrl;
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/60 p-4" role="dialog" aria-modal="true" aria-labelledby="avatar-crop-title">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-4 text-foreground shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="avatar-crop-title" className="text-lg font-semibold">Adjust profile photo</h2>
            <p className="mt-1 truncate text-xs text-muted-foreground">{imageName}</p>
          </div>
          <button type="button" onClick={onCancel} disabled={isSaving} aria-label="Close photo cropper" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>
        {cropError && <p role="alert" className="mt-3 rounded-md border border-danger/30 bg-danger/10 p-2.5 text-sm text-danger-foreground">{cropError}</p>}

        <div className="mt-5 flex justify-center">
          <div
            className="relative h-64 w-64 touch-none select-none overflow-hidden rounded-full bg-muted"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            style={{ cursor: isSaving ? 'wait' : 'grab' }}
            aria-label="Drag image to adjust crop"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Profile photo crop preview"
              draggable={false}
              onLoad={(event) => {
                const image = event.currentTarget;
                setDimensions({ x: image.naturalWidth, y: image.naturalHeight });
              }}
              className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
              style={{
                width: baseWidth,
                height: baseHeight,
                transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
                transformOrigin: 'center',
              }}
            />
            <div className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-white/80" />
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <Move className="h-4 w-4 shrink-0 text-muted-foreground" />
          <label className="min-w-0 flex-1 text-xs text-muted-foreground">
            <span className="sr-only">Zoom photo</span>
            Zoom
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(event) => handleZoom(Number(event.target.value))}
              disabled={!dimensions || isSaving}
              className="mt-2 block min-h-8 w-full accent-primary"
            />
          </label>
          <button
            type="button"
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            disabled={isSaving}
            aria-label="Reset crop"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border hover:bg-muted disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-center text-xs text-muted-foreground">Drag to reposition, then adjust zoom.</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={onCancel} disabled={isSaving} className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={!dimensions || isSaving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60">
            <Check className="h-4 w-4" />
            {isSaving ? 'Saving…' : 'Use photo'}
          </button>
        </div>
      </div>
    </div>
  );
}
