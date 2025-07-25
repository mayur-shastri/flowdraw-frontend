import { useCanvasContext } from '../contexts/CanvasContext/CanvasContext';
import { getRotatedCorners } from '../utils/geometry';
import { DrawElement } from '../types';
import { defaultStyle } from '../constants';
import { useRender } from './useRender/useRender';

export function useDrawOnCanvas(canvasRef: React.RefObject<HTMLCanvasElement>, isDrawing: boolean, currentElement : DrawElement | null) {
  const {
    elements,
    selectedElementIds,
    panOffset,
    scale,
    selectionBox,
    hoveredElement,
    arrowStartPoint,
    arrowEndPoint,
    tool,
  } = useCanvasContext();

  const {renderElement} = useRender();

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 20;
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;

    const offsetX = (panOffset.x % gridSize) / scale;
    const offsetY = (panOffset.y % gridSize) / scale;

    for (let x = offsetX; x < width / scale; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height / scale);
      ctx.stroke();
    }

    for (let y = offsetY; y < height / scale; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width / scale, y);
      ctx.stroke();
    }
  };

  const drawResizeHandles = (ctx: CanvasRenderingContext2D) => {
    const selectedElements = elements.filter(el => selectedElementIds.includes(el.id) && !el.isDeleted);
    if (selectedElements.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    selectedElements.forEach(element => {
      const rotatedPoints = getRotatedCorners(element);
      rotatedPoints.forEach(p => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      });
    });

    const width = maxX - minX;
    const height = maxY - minY;

    if (selectedElementIds.length > 1) {
      const pseudoSelectionElement: DrawElement = {
        id: 'selection-outline',
        type: 'selection-outline',
        x: minX,
        y: minY,
        width,
        height,
        angle: 0,
        style: { ...defaultStyle },
        isSelected: true,
      };

      renderElement(ctx, pseudoSelectionElement, false);
    }
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(scale, scale);

    // drawGrid(ctx, canvas.width, canvas.height);

    elements.forEach(element => {
      if (element.isMarkedForDeletion) return;
      if(element.isDeleted) return;
      if(element.id === currentElement?.id) return;
      renderElement(ctx, element, (selectedElementIds.length > 1));
    });

    if (selectionBox?.isActive) {
      ctx.save();
      ctx.strokeStyle = '#4285f4';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.15; // Low opacity for fill
      ctx.fillStyle = '#4285f4';
      ctx.fillRect(
        selectionBox.startX,
        selectionBox.startY,
        selectionBox.width,
        selectionBox.height
      );
      ctx.globalAlpha = 1.0; // Reset opacity for stroke
      ctx.strokeRect(
        selectionBox.startX,
        selectionBox.startY,
        selectionBox.width,
        selectionBox.height
      );
      ctx.restore();
    }

    if (selectedElementIds.length > 0 && !isDrawing) {
      drawResizeHandles(ctx);
    }

    if (hoveredElement) {
      ctx.save();
      ctx.strokeStyle = '#3b82f6'; // Blue color for highlight
      ctx.lineWidth = 2 / scale; // Scale the line width appropriately
      // Draw the silhouette/highlight
      renderElement(ctx, {
        ...hoveredElement,
        style: {
          ...hoveredElement.style,
          strokeColor: '#3b82f6',
          fillStyle : 'solid'
        }
      }, false);

      ctx.restore();

      // Draw the contact points
      if (arrowStartPoint?.point) {
        ctx.save();
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(
          arrowStartPoint.point.x,
          arrowStartPoint.point.y,
          5 / scale, // Radius of the point, scaled appropriately
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
      }
      if (arrowEndPoint?.point) {
        ctx.save();
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(
          arrowEndPoint.point.x,
          arrowEndPoint.point.y,
          5 / scale, // Radius of the point, scaled appropriately
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.restore();
  };

  return { redrawCanvas, drawGrid, drawResizeHandles };
}