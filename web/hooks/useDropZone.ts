import { useState, useRef, useCallback } from "react";

interface UseDropZoneOptions {
  accept: (file: File) => boolean;
  onDrop: (file: File) => void;
}

export function useDropZone({ accept, onDrop }: UseDropZoneOptions) {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.types.includes("Files")) setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragOver(false);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file && accept(file)) onDrop(file);
  }, [accept, onDrop]);

  return {
    isDragOver,
    dragHandlers: {
      onDragEnter,
      onDragLeave,
      onDragOver,
      onDrop: handleDrop,
    },
  };
}
