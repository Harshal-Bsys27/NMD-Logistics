'use client';

import { useRef, useState, type PointerEvent } from 'react';

interface SignatureCaptureProps {
  onChange: (signature: string | null) => void;
}

export default function SignatureCapture({ onChange }: SignatureCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  const getPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) * (canvas.width / bounds.width),
      y: (event.clientY - bounds.top) * (canvas.height / bounds.height),
    };
  };

  const startDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const point = getPoint(event);
    if (!canvas || !point) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    drawingRef.current = true;
    canvas.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#172033';
    context.fillStyle = '#172033';
    context.arc(point.x, point.y, 1.5, 0, Math.PI * 2);
    context.fill();
  };

  const continueDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const point = getPoint(event);
    const context = canvasRef.current?.getContext('2d');
    if (!point || !context) return;
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const finishDrawing = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setHasSignature(true);
    onChange(canvas.toDataURL('image/png'));
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
    drawingRef.current = false;
    setHasSignature(false);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg border border-input bg-white">
        <canvas
          ref={canvasRef}
          aria-label="Recipient signature pad"
          className="h-36 w-full touch-none"
          height={288}
          onPointerCancel={finishDrawing}
          onPointerDown={startDrawing}
          onPointerMove={continueDrawing}
          onPointerUp={finishDrawing}
          width={900}
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Ask the recipient to sign above.</p>
        <button
          type="button"
          onClick={clearSignature}
          disabled={!hasSignature}
          className="min-h-9 rounded-md px-3 text-xs font-semibold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear signature
        </button>
      </div>
    </div>
  );
}
