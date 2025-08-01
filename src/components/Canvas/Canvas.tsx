import React, { useRef, useState, useEffect } from 'react';
import { ArrowElement, DrawElement, ElementType, LineElement, Point, ResizeDirection, TextElement } from '../../types';
import { calculateClosestBoundaryPoint, generateId } from '../../utils/helpers';
import { useDrawOnCanvas } from '../../hooks/useDrawOnCanvas';
import { useCursorUtils } from '../../hooks/useCursorUtils';
import { useRotateAndResizeElements } from '../../hooks/useRotateAndResizeElements';
import { TranslatingStartState } from '../../types';
import { useTranslateElements } from '../../hooks/useTranslateElements';
import { useCanvasContext } from '../../contexts/CanvasContext/CanvasContext';
import { defaultStyle } from '../../constants';
import { Connection } from '../../types';
import { flushSync } from 'react-dom';
import { useWebRTC } from '../../hooks/useWebRTC';
import { renderPeerStates } from '../../hooks/useRender/renderPeerStates';
import PeerCursor from '../DrawingApp/PeerCursor/PeerCursor';
import { drawCurrentElement } from '../../utils/drawCurrentElement';

const Canvas: React.FC = () => {

  const {
    elements,
    setElements,
    tool,
    setActiveTool,
    selectedElementIds,
    setSelectedElementIds,
    scale,
    panOffset,
    onTextEdit,
    selectionBox,
    setSelectionBox,
    onElementComplete,
    hoveredElement,
    setHoveredElement,
    arrowStartPoint,
    setArrowStartPoint,
    arrowEndPoint,
    setArrowEndPoint,
    connections,
    setConnections
  } = useCanvasContext();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [startPoint, setStartPoint] = useState<Point>({ x: 0, y: 0 });
  const [currentElement, setCurrentElement] = useState<DrawElement | null>(null);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection>(null);
  const [isEditingArrow, setIsEditingArrow] = useState(false);

  const { redrawCanvas } = useDrawOnCanvas(canvasRef, isDrawing, currentElement);
  const { updateCursor, checkResizeHandle, checkRotateHandle, findElementAtPosition } = useCursorUtils(canvasRef);
  const { resizeElements, rotateElements, setOriginalElements, setRotationStartPoint } = useRotateAndResizeElements();
  const { translateElements, setTranslationStartPositions } = useTranslateElements();

  const { peerStates, setMyState, peerIdRef } = useWebRTC({ currentElement, isDrawing });

  const handleDoubleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCoordinates(event);
    const clickedElement = findElementAtPosition(point);

    if (clickedElement && !clickedElement.isDeleted) {
      setSelectedElementIds([clickedElement.id]);
      onTextEdit(clickedElement as TextElement);
    }
  };

  const getCoordinates = (event: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left - panOffset.x) / scale,
      y: (event.clientY - rect.top - panOffset.y) / scale
    };
  };

  const createElement = (type: ElementType, start: Point): DrawElement | null => {
    const id = generateId();

    // All elements can have text, so always call onTextEdit if tool is 'text'
    if (type === 'text') {
      const textElement: DrawElement = {
        id,
        type: 'text',
        x: start.x,
        y: start.y,
        width: 200,
        height: 24,
        angle: 0,
        style: { ...defaultStyle },
        isSelected: true,
        text: '',
        connectionIds: [],
        version: new Date(),
        versionNonce: Math.random(),
        isDeleted: false
      };
      onTextEdit(textElement as TextElement);
      return textElement;
    }

    // For other types, create the element and call onTextEdit if tool is 'text'
    let element: DrawElement | null = null;
    switch (type) {
      case 'freedraw':
        element = {
          id,
          type: 'freedraw',
          points: [start],
          x: start.x,
          y: start.y,
          width: 0,
          height: 0,
          angle: 0,
          style: { ...defaultStyle },
          isSelected: false,
          text: '',
          connectionIds: [],
          version: new Date(),
          versionNonce: Math.random(),
          isDeleted: false
        };
        break;
      case 'rectangle':
        element = {
          id,
          type: 'rectangle',
          x: start.x,
          y: start.y,
          width: 0,
          height: 0,
          angle: 0,
          style: { ...defaultStyle },
          isSelected: false,
          text: '',
          connectionIds: [],
          version: new Date(),
          versionNonce: Math.random(),
          isDeleted: false
        };
        break;
      case 'ellipse':
        element = {
          id,
          type: 'ellipse',
          x: start.x,
          y: start.y,
          width: 0,
          height: 0,
          angle: 0,
          style: { ...defaultStyle },
          isSelected: false,
          text: '',
          connectionIds: [],
          version: new Date(),
          versionNonce: Math.random(),
          isDeleted: false
        };
        break;
      case 'arrow':
        element = {
          id,
          type: 'arrow',
          startPoint: start,
          endPoint: start,
          x: start.x,
          y: start.y,
          width: 0,
          height: 0,
          angle: 0,
          style: { ...defaultStyle },
          isSelected: false,
          text: '',
          connectionId: "",
          connectionIds: [],
          version: new Date(),
          versionNonce: Math.random(),
          isDeleted: false
        };
        break;
      case 'line':
        element = {
          id,
          type: 'line',
          startPoint: start,
          endPoint: start,
          x: start.x,
          y: start.y,
          width: 0,
          height: 0,
          angle: 0,
          style: { ...defaultStyle },
          isSelected: false,
          text: '',
          connectionIds: [],
          version: new Date(),
          versionNonce: Math.random(),
          isDeleted: false
        };
        break;
      case 'diamond':
        element = {
          id,
          type: 'diamond',
          x: start.x,
          y: start.y,
          width: 0,
          height: 0,
          angle: 0,
          style: { ...defaultStyle },
          isSelected: false,
          text: '',
          connectionIds: [],
          version: new Date(),
          versionNonce: Math.random(),
          isDeleted: false
        };
        break;
      case 'rhombus':
        element = {
          id,
          type: 'rhombus',
          x: start.x,
          y: start.y,
          width: 0,
          height: 0,
          angle: 0,
          style: { ...defaultStyle },
          isSelected: false,
          text: '',
          connectionIds: [],
          version: new Date(),
          versionNonce: Math.random(),
          isDeleted: false
        };
        break;
      default:
        return null;
    }

    // If the tool is 'text', trigger text editing for any shape
    if (tool === 'text' && element) {
      element.isSelected = true;
      onTextEdit(element as TextElement);
    }

    return element;
  };

  const findElementsInSelectionBox = () => {
    if (!selectionBox) return [];

    return elements
      .filter(element => (
        !element.isDeleted &&
        element.x < selectionBox.startX + selectionBox.width &&
        element.x + element.width > selectionBox.startX &&
        element.y < selectionBox.startY + selectionBox.height &&
        element.y + element.height > selectionBox.startY
      ))
      .map(element => element.id);
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCoordinates(event);
    setStartPoint(point);
    if (tool !== 'arrow') {
      setHoveredElement(null);
      setArrowStartPoint(null);
      setArrowEndPoint(null);
    }

    if (tool === 'eraser') {
      setIsDrawing(true);
      return;
    }

    const isMouseOnRotationHandle = checkRotateHandle(point);
    if (selectedElementIds.length > 0 && isMouseOnRotationHandle) {
      setIsRotating(true);
      setRotationStartPoint(point);
      return;
    }

    const resizeDir = checkResizeHandle(point);
    if (resizeDir && selectedElementIds.length > 0) {
      setIsResizing(true);
      setResizeDirection(resizeDir);
      setOriginalElements(elements.filter(el => selectedElementIds.includes(el.id)));
      return;
    }

    const clickedElement = findElementAtPosition(point);
    if (selectedElementIds.length > 0 && clickedElement && selectedElementIds.includes(clickedElement.id)) {
      setIsTranslating(true);

      if (clickedElement && !clickedElement.isDeleted) {
        if (event.shiftKey) {
          setSelectedElementIds(prev =>
            prev.includes(clickedElement.id)
              ? prev.filter(id => id !== clickedElement.id)
              : [...prev, clickedElement.id]
          );
        }
      }

      const positions: Record<string, TranslatingStartState> = {};
      elements.forEach(el => {
        if (selectedElementIds.includes(el.id)) {
          positions[el.id] = { x: el.x, y: el.y };
          if (el.type === 'arrow' || el.type === 'line') {
            positions[el.id] = { ...positions[el.id], startPoint: el.startPoint, endPoint: el.endPoint };
          }
          else if (el.type === 'freedraw') {
            positions[el.id] = { ...positions[el.id], points: el.points };
          }
        }
      });
      setTranslationStartPositions(positions);
      return;
    }

    setIsDrawing(true);

    if (tool === 'selection') {
      if (clickedElement && !clickedElement.isDeleted) {
        if (event.shiftKey) {
          setSelectedElementIds(prev =>
            prev.includes(clickedElement.id)
              ? prev.filter(id => id !== clickedElement.id)
              : [...prev, clickedElement.id]
          );
        } else if (!selectedElementIds.includes(clickedElement.id)) {
          setSelectedElementIds([clickedElement.id]);
        }
      } else {
        setSelectionBox({
          startX: point.x,
          startY: point.y,
          width: 0,
          height: 0,
          isActive: true,
        });
        if (!event.shiftKey) setSelectedElementIds([]);
      }
    } else {
      setSelectedElementIds([]);
      const newElement = createElement(tool, point);
      if (newElement) setCurrentElement(newElement);
    }

  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const currentPoint = getCoordinates(event);

    setMyState((prev) => {
      return { ...prev, cursorPosition: currentPoint };
    });

    const deltaX = currentPoint.x - startPoint.x;
    const deltaY = currentPoint.y - startPoint.y;

    if (tool === 'arrow' || isEditingArrow) {
      const elementUnderCursor = findElementAtPosition(currentPoint);
      if (!isDrawing) {
        if (elementUnderCursor) {
          setHoveredElement(elementUnderCursor);
          // Calculate the closest point on the element's boundary to the cursor
          const closestPoint = calculateClosestBoundaryPoint(elementUnderCursor, currentPoint);
          setArrowStartPoint(prev => {
            return {
              point: closestPoint,
              elementId: hoveredElement?.id
            };
          });
        } else {
          setHoveredElement(null);
          setArrowStartPoint(null);
        }
      }
      else {
        const elementUnderCursor = findElementAtPosition(currentPoint);
        if (elementUnderCursor) {
          setHoveredElement(elementUnderCursor);
          // Calculate the closest point on the element's boundary to the cursor
          const closestPoint = calculateClosestBoundaryPoint(elementUnderCursor, currentPoint);
          setArrowEndPoint(prev => {
            return {
              point: closestPoint,
              elementId: hoveredElement?.id
            };
          });
        } else {
          setHoveredElement(null);
          setArrowEndPoint(null);
        }
      }
    } else {
      setHoveredElement(null);
      setArrowStartPoint(null);
      setArrowEndPoint(null);
    }

    if (isRotating) {
      rotateElements(currentPoint);
      redrawCanvas();
      return;
    }

    if (isResizing && resizeDirection) {
      resizeElements(resizeDirection, startPoint, currentPoint);
      redrawCanvas();
      return;
    }

    if (isTranslating) {
      translateElements(deltaX, deltaY);
      redrawCanvas();
      return;
    }

    if (!isDrawing) {
      updateCursor(currentPoint);
      return;
    }

    if (tool === 'eraser' && isDrawing) {
      let elementsChanged = false;

      // Check all elements for intersection with eraser
      setElements(prevElements => {
        return prevElements.map(element => {
          // For other elements, check if current point is inside the element
          if (
            currentPoint.x >= element.x &&
            currentPoint.x <= element.x + element.width &&
            currentPoint.y >= element.y &&
            currentPoint.y <= element.y + element.height
          ) {
            elementsChanged = true;
            return { ...element, isMarkedForDeletion: true };
          }

          return element;
        });
      });

      if (elementsChanged) {
        redrawCanvas();
      }
      return;
    }

    if (tool === 'selection' && selectionBox?.isActive) {
      setSelectionBox(prev => prev ? {
        ...prev,
        width: currentPoint.x - prev.startX,
        height: currentPoint.y - prev.startY
      } : null);
    } else if (currentElement) {
      const updatedElement = updateElement(currentElement, currentPoint, startPoint);
      setCurrentElement(updatedElement);
    }

    redrawCanvas();
    drawCurrentElement(currentElement, canvasRef, panOffset, scale, selectedElementIds);
  };

  const updateElement = (element: DrawElement, currentPoint: Point, startPoint: Point): DrawElement => {
    const updated = { ...element };
    switch (element.type) {
      case 'freedraw': {
        // Add the new point to the points array
        const points = [...(element.points || []), currentPoint];
        // Update bounding box
        const xs = points.map(p => p.x);
        const ys = points.map(p => p.y);
        updated.points = points;
        updated.x = Math.min(...xs);
        updated.y = Math.min(...ys);
        updated.width = Math.max(...xs) - updated.x;
        updated.height = Math.max(...ys) - updated.y;
        break;
      }

      case 'rectangle':
      case 'ellipse':
      case 'diamond':
      case 'rhombus':
        updated.width = currentPoint.x - startPoint.x;
        updated.height = currentPoint.y - startPoint.y;
        if (updated.width < 0) {
          updated.x = currentPoint.x;
          updated.width = Math.abs(updated.width);
        }
        if (updated.height < 0) {
          updated.y = currentPoint.y;
          updated.height = Math.abs(updated.height);
        }
        break;

      case 'arrow':
      case 'line': {
        if (element.type === 'arrow' && element.startPoint) {
          const start = element.startPoint;
          let direction: 'up' | 'down' | 'left' | 'right' = 'right';

          if (currentPoint.x >= start.x) {
            if (currentPoint.y === start.y)
              direction = 'right';
            else if (currentPoint.y > start.y)
              direction = 'down';
            else
              direction = 'up';
          } else {
            if (currentPoint.y === start.y)
              direction = 'left';
            else if (currentPoint.y > start.y)
              direction = 'down';
            else
              direction = 'up';
          }
          (updated as ArrowElement).direction = direction;
        }
        (updated as ArrowElement | LineElement).endPoint = currentPoint;
        const startX = (updated as ArrowElement | LineElement).startPoint.x;
        const startY = (updated as ArrowElement | LineElement).startPoint.y;
        updated.x = Math.min(startX, currentPoint.x);
        updated.y = Math.min(startY, currentPoint.y);
        updated.width = Math.abs(currentPoint.x - startX);
        updated.height = Math.abs(currentPoint.y - startY);
        break;
      }
    }

    return updated;
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {

    if (isDrawing && tool === 'arrow' && currentElement?.type === 'arrow') {
      const newArrow = { ...currentElement } as ArrowElement;
      const connectionId = generateId();
      newArrow.connectionId = connectionId;

      // Initialize connection with required fields
      const newConnection: Connection = {
        id: connectionId,
        arrowElementId: newArrow.id,
        startElementId: undefined,
        endElementId: undefined,
        startAngle: undefined,
        endAngle: undefined,
        version: Date.now(),
        versionNonce: Math.random(),
        isDeleted: false
      };

      // Handle start element if exists
      if (arrowStartPoint?.elementId) {
        const startElement = elements.find(el => el.id === arrowStartPoint.elementId);
        if (startElement) {
          const dx = arrowStartPoint.point.x - (startElement.x + startElement.width / 2);
          const dy = arrowStartPoint.point.y - (startElement.y + startElement.height / 2);
          let startSide: 'top' | 'bottom' | 'left' | 'right' = 'top';
          if (Math.abs(dx) > Math.abs(dy)) {
            startSide = dx > 0 ? 'right' : 'left';
          } else {
            startSide = dy > 0 ? 'bottom' : 'top';
          }
          newArrow.startSide = startSide;
          newConnection.startElementId = startElement.id;
          newConnection.startAngle = Math.atan2(
            arrowStartPoint.point.y - (startElement.y + startElement.height / 2),
            arrowStartPoint.point.x - (startElement.x + startElement.width / 2)
          );

          // Update start element's connectionIds
          setElements(prev =>
            prev.map(el =>
              el.id === startElement.id
                ? { ...el, connectionIds: [...el.connectionIds, connectionId] }
                : el
            )
          );
        }
      }

      // Handle end element if exists
      if (arrowEndPoint?.elementId) {
        const endElement = elements.find(el => el.id === arrowEndPoint.elementId);
        if (endElement) {
          const dx = arrowEndPoint.point.x - (endElement.x + endElement.width / 2);
          const dy = arrowEndPoint.point.y - (endElement.y + endElement.height / 2);
          let endSide: 'top' | 'bottom' | 'left' | 'right' = 'top';
          if (Math.abs(dx) > Math.abs(dy)) {
            endSide = dx > 0 ? 'right' : 'left';
          } else {
            endSide = dy > 0 ? 'bottom' : 'top';
          }
          newArrow.endSide = endSide;
          newConnection.endElementId = endElement.id;
          newConnection.endAngle = Math.atan2(
            arrowEndPoint.point.y - (endElement.y + endElement.height / 2),
            arrowEndPoint.point.x - (endElement.x + endElement.width / 2)
          );

          // Update end element's connectionIds
          setElements(prev =>
            prev.map(el =>
              el.id === endElement.id
                ? { ...el, connectionIds: [...el.connectionIds, connectionId] }
                : el
            )
          );
        }
      }

      flushSync(() => {
        setElements(prev => [...prev, newArrow]);
        setConnections(prev => [...prev, newConnection]);
      });

      setCurrentElement(null);
    } else if (isEditingArrow) {
      if (selectedElementIds && selectedElementIds[0]) {
        const arrow = elements.find(e => e.id === selectedElementIds[0]);
        if (arrow && arrow.type === 'arrow') {
          const conn = connections.find(c => c.id === arrow.connectionId);
          const point = getCoordinates(event);
        }
      }
    } else if (isDrawing && currentElement && tool !== 'selection') { //insert other types of new elements to elements array
      setElements(prev => [...prev, currentElement]);
    }

    setIsEditingArrow(false);
    setHoveredElement(null);

    if (tool === 'eraser' && isDrawing) {
      // Remove elements marked for deletion (including freedraw)
      setElements(prevElements => prevElements.filter(el => !el.isMarkedForDeletion));
      setIsDrawing(false);
      return;
    }
    if (isRotating) {
      setIsRotating(false);
      setRotationStartPoint(null);
    }
    if (isResizing) {
      setIsResizing(false);
      setResizeDirection(null);
      setOriginalElements([]);
    } else if (isTranslating) {
      setIsTranslating(false);
      setTranslationStartPositions({});
    } else if (isDrawing) {
      if (tool === 'selection' && selectionBox?.isActive) {
        const selectedElements = findElementsInSelectionBox();
        setSelectedElementIds(prev => [...new Set([...prev, ...selectedElements])]);
        setSelectionBox(null);
      }
    }

    if (isDrawing || isTranslating) {
      setIsDrawing(false);
      setCurrentElement(null);
      onElementComplete();
    }
  };

  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      redrawCanvas();
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  useEffect(() => {
    function peerStateRenderer() {

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;
      renderPeerStates(peerStates, canvasRef, panOffset, scale, peerIdRef);
    }

    peerStateRenderer();

  }, [peerStates]);

  useEffect(() => {
    redrawCanvas();
    if (arrowStartPoint && arrowEndPoint) {
      drawCurrentElement(currentElement, canvasRef, panOffset, scale, selectedElementIds);
    }
  }, [elements, scale, panOffset, selectionBox, hoveredElement, arrowStartPoint, arrowEndPoint, tool]);

  useEffect(() => {
    setElements(prev =>
      prev.map(el => ({
        ...el,
        isSelected: selectedElementIds.includes(el.id)
      }))
    );
  }, [selectedElementIds]);

  useEffect(() => {
    if (selectedElementIds.length === 1) {
      const element = elements.find(el => el.id === selectedElementIds[0]);
      if (element && element.type === 'arrow') {
        setIsEditingArrow(true);
      }
    }
  }, [selectedElementIds]);

  // useEffect(()=>{
  //   console.log({elements, connections});
  // }, [elements, connections]);

  return (
    <>

      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      />

      {
        peerStates.map((peer) => {
          return (
            <PeerCursor
              key={peer.peerId}
              position={peer.cursorPosition}
              name={peer.peerName}
              color={peer.peerColor}
            />
          );
        })
      }

    </>

  );
};

export default Canvas;