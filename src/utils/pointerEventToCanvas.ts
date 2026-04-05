import type * as React from 'react';

/** CSS 坐标用于手势识别；位图坐标用于绘制，避免 DPR/CSS 缩放与 container/canvas 尺寸不一致导致笔迹偏移 */
export function pointerEventToCanvas(
  e: React.PointerEvent,
  canvas: HTMLCanvasElement
): { cssX: number; cssY: number; drawX: number; drawY: number; scale: number } {
  const rect = canvas.getBoundingClientRect();
  const rw = Math.max(rect.width, 1e-6);
  const rh = Math.max(rect.height, 1e-6);
  const cssX = e.clientX - rect.left;
  const cssY = e.clientY - rect.top;
  return {
    cssX,
    cssY,
    drawX: (cssX * canvas.width) / rw,
    drawY: (cssY * canvas.height) / rh,
    scale: canvas.width / rw,
  };
}
