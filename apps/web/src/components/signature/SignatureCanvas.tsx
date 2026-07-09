import { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface BiometricPoint {
  x: number;
  y: number;
  t: number;
  pressure: number;
}

interface SignatureCanvasProps {
  onSave: (dataUrl: string, points: BiometricPoint[]) => void;
  onClear?: () => void;
}

export function SignatureCanvas({ onSave, onClear }: SignatureCanvasProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<BiometricPoint[]>([]);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.strokeStyle = "#1A2B4A";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  // El canvas tiene una resolución de dibujo fija (500x150, los atributos
  // width/height) pero se muestra a un tamaño distinto por CSS (w-full lo
  // estira a lo ancho de su contenedor — en una tablet en modo kiosco casi
  // siempre es más ancho que 500px). Sin corregir la escala, las coordenadas
  // del toque/ratón (relativas al tamaño mostrado) no coinciden con las del
  // buffer de dibujo: el trazo queda desplazado o se sale del lienzo.
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
        pressure: (e.touches[0] as any).force ?? 0.5,
      };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY, pressure: 0.5 };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setIsEmpty(false);
    setPoints(prev => [...prev, { x: pos.x, y: pos.y, t: Date.now(), pressure: pos.pressure }]);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setPoints(prev => [...prev, { x: pos.x, y: pos.y, t: Date.now(), pressure: pos.pressure }]);
  };

  const endDraw = () => setIsDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setPoints([]);
    setIsEmpty(true);
    onClear?.();
  };

  const save = () => {
    if (isEmpty) return;
    const dataUrl = canvasRef.current!.toDataURL("image/png");
    onSave(dataUrl, points);
  };

  return (
    <div className="flex flex-col gap-3">
      <canvas
        ref={canvasRef}
        width={500}
        height={150}
        className="border border-slate-300 rounded-lg bg-white cursor-crosshair touch-none w-full"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={clear} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
          {t('signature.clear')}
        </button>
        <button
          type="button"
          onClick={save}
          disabled={isEmpty}
          className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40"
        >
          {t('signature.confirm')}
        </button>
      </div>
    </div>
  );
}
