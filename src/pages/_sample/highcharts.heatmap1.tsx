// WebGLDetailChart.tsx
import React, { useEffect, useRef, useState } from "react";

type Pointer = { boxIndex: number; x: number; y: number };

interface WebGLDetailChartProps {
  height: number;
  xBoxCount: number;
  yBoxCount: number;
  pointers: Pointer[];
}

const WebGLDetailChart: React.FC<WebGLDetailChartProps> = ({ height, xBoxCount, yBoxCount, pointers }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);

  const viewRef = useRef({ xMin: 0, xMax: xBoxCount, yMin: 0, yMax: yBoxCount });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragEndRef = useRef<{ x: number; y: number } | null>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const viewStartRef = useRef(viewRef.current);

  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;

    const parent = canvas.parentElement!;
    const w = parent.clientWidth;
    const h = height;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    overlay.width = w * dpr;
    overlay.height = h * dpr;
    overlay.style.width = `${w}px`;
    overlay.style.height = `${h}px`;
  };

  const drawGrid = () => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext("2d")!;
    const vw = viewRef.current;
    const w = overlay.width;
    const h = overlay.height;

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 1;

    const cellW = w / (vw.xMax - vw.xMin);
    const cellH = h / (vw.yMax - vw.yMin);

    for (let i = Math.floor(vw.xMin); i <= Math.ceil(vw.xMax); i++) {
      const x = (i - vw.xMin) * cellW + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let i = Math.floor(vw.yMin); i <= Math.ceil(vw.yMax); i++) {
      const y = (i - vw.yMin) * cellH + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  };

  useEffect(() => {
    resizeCanvas();
    drawGrid();
    window.addEventListener("resize", () => {
      resizeCanvas();
      drawGrid();
    });
  }, []);

  const drawSelection = () => {
    const overlay = overlayRef.current;
    if (!overlay || !dragStartRef.current || !dragEndRef.current) return;
    drawGrid();
    const ctx = overlay.getContext("2d")!;
    const s = dragStartRef.current;
    const e = dragEndRef.current;
    ctx.strokeStyle = "rgba(255,0,0,0.9)";
    ctx.fillStyle = "rgba(255,0,0,0.1)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(s.x, s.y, e.x - s.x, e.y - s.y);
    ctx.fillRect(s.x, s.y, e.x - s.x, e.y - s.y);
  };

  const getMousePos = (ev: PointerEvent) => {
    const overlay = overlayRef.current!;
    const rect = overlay.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    return { x: (ev.clientX - rect.left) * dpr, y: (ev.clientY - rect.top) * dpr };
  };

  const onPointerMove = (ev: PointerEvent) => {
    const pos = getMousePos(ev);
    const vw = viewRef.current;
    const overlay = overlayRef.current!;
    const cellW = overlay.width / (vw.xMax - vw.xMin);
    const cellH = overlay.height / (vw.yMax - vw.yMin);

    const cellX = Math.floor(vw.xMin + pos.x / cellW);
    const cellY = Math.floor(vw.yMin + pos.y / cellH);

    if (cellX >= 0 && cellX < xBoxCount && cellY >= 0 && cellY < yBoxCount) {
      setTooltip({ text: `셀(${cellX}, ${cellY})`, x: ev.clientX, y: ev.clientY });
    } else {
      setTooltip(null);
    }

    if (isDraggingRef.current) {
      dragEndRef.current = pos;
      drawSelection();
    }

    if (isPanningRef.current && panStartRef.current) {
      const dx = ev.clientX - panStartRef.current.x;
      const dy = ev.clientY - panStartRef.current.y;
      const vwWidth = viewStartRef.current.xMax - viewStartRef.current.xMin;
      const vwHeight = viewStartRef.current.yMax - viewStartRef.current.yMin;
      const nx = (dx / overlay.width) * vwWidth;
      const ny = (dy / overlay.height) * vwHeight;
      viewRef.current = {
        xMin: viewStartRef.current.xMin - nx,
        xMax: viewStartRef.current.xMax - nx,
        yMin: viewStartRef.current.yMin - ny,
        yMax: viewStartRef.current.yMax - ny,
      };
      drawGrid();
    }
  };

  const onPointerDown = (ev: PointerEvent) => {
    if (ev.shiftKey || ev.button === 2) {
      isPanningRef.current = true;
      panStartRef.current = { x: ev.clientX, y: ev.clientY };
      viewStartRef.current = { ...viewRef.current };
      return;
    }
    const pos = getMousePos(ev);
    isDraggingRef.current = true;
    dragStartRef.current = pos;
    dragEndRef.current = pos;
  };

  const onPointerUp = () => {
    if (isDraggingRef.current && dragStartRef.current && dragEndRef.current) {
      const vw = viewRef.current;
      const overlay = overlayRef.current!;
      const xMin = vw.xMin + Math.min(dragStartRef.current.x, dragEndRef.current.x) / overlay.width * (vw.xMax - vw.xMin);
      const xMax = vw.xMin + Math.max(dragStartRef.current.x, dragEndRef.current.x) / overlay.width * (vw.xMax - vw.xMin);
      const yMin = vw.yMin + Math.min(dragStartRef.current.y, dragEndRef.current.y) / overlay.height * (vw.yMax - vw.yMin);
      const yMax = vw.yMin + Math.max(dragStartRef.current.y, dragEndRef.current.y) / overlay.height * (vw.yMax - vw.yMin);

      viewRef.current = { xMin, xMax, yMin, yMax };

      console.log("선택 영역 포인터:", pointers.filter(p => {
        const bx = p.boxIndex % xBoxCount + p.x / 100;
        const by = Math.floor(p.boxIndex / xBoxCount);
        return bx >= xMin && bx <= xMax && by >= yMin && by <= yMax;
      }));

      drawGrid();
    }
    isDraggingRef.current = false;
    isPanningRef.current = false;
    dragStartRef.current = null;
    dragEndRef.current = null;
  };

  useEffect(() => {
    const overlay = overlayRef.current!;
    overlay.addEventListener("pointermove", onPointerMove);
    overlay.addEventListener("pointerdown", onPointerDown);
    overlay.addEventListener("pointerup", onPointerUp);
    overlay.addEventListener("pointerleave", onPointerUp);
    return () => {
      overlay.removeEventListener("pointermove", onPointerMove);
      overlay.removeEventListener("pointerdown", onPointerDown);
      overlay.removeEventListener("pointerup", onPointerUp);
      overlay.removeEventListener("pointerleave", onPointerUp);
    };
  }, [pointers]);

  const resetView = () => {
    viewRef.current = { xMin: 0, xMax: xBoxCount, yMin: 0, yMax: yBoxCount };
    drawGrid();
  };

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0 }} />
      <canvas ref={overlayRef} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "auto" }} />
      {tooltip && (
        <div style={{ position: "fixed", left: tooltip.x + 10, top: tooltip.y + 10, background: "rgba(0,0,0,0.7)", color: "#fff", padding: "2px 5px", fontSize: 12, borderRadius: 3 }}>
          {tooltip.text}
        </div>
      )}
      <button style={{ position: "absolute", top: 10, right: 10, zIndex: 10 }} onClick={resetView}>Reset</button>
    </div>
  );
};

export default WebGLDetailChart;
