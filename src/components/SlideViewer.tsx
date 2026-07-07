import React, { useState, useEffect, useRef } from "react";
import { Slide, PresentationTheme, ElementStyle } from "../types";
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  Image as ImageIcon
} from "lucide-react";
import FormattingToolbar from "./slide-viewer/FormattingToolbar";
import SlideCanvas from "./slide-viewer/SlideCanvas";
import MetaPanels from "./slide-viewer/MetaPanels";

interface SlideViewerProps {
  slide: Slide;
  theme: PresentationTheme;
  onUpdateSlide: (updated: Slide) => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  currentIndex?: number;
  totalSlides?: number;
  isCopilotMinimized?: boolean;
  onToggleCopilot?: () => void;
}

type SelectedElement = "title" | "headline" | "bullets" | "image" | null;

export default function SlideViewer({ 
  slide, 
  theme, 
  onUpdateSlide,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
  currentIndex = 0,
  totalSlides = 1,
  isCopilotMinimized = false,
  onToggleCopilot
}: SlideViewerProps) {
  // Inline rich editing selected state
  const [selectedElement, setSelectedElement] = useState<SelectedElement>(null);
  const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  
  // Local color picking state
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  
  // Local file upload uploader state
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Image Editing States
  const [activeCropMode, setActiveCropMode] = useState<boolean>(false);
  const [activeScaleSlider, setActiveScaleSlider] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const colors = theme.colorPalette;

  // Sync / Reset on slide change
  useEffect(() => {
    setSelectedElement(null);
    setIsEditingNotes(false);
    setImageError(null);
    setActiveCropMode(false);
    setActiveScaleSlider(false);
    setIsDragging(false);
  }, [slide]);

  // General update styles helper
  const updateElementStyle = (element: "title" | "headline" | "bullets" | "image", key: keyof ElementStyle, value: any) => {
    const styleKey = `${element}Style` as const;
    const currentStyle = slide[styleKey] || {};
    onUpdateSlide({
      ...slide,
      [styleKey]: {
        ...currentStyle,
        [key]: value
      }
    });
  };

  // Drag to rotate image logic
  const handleRotateStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const imageElement = document.getElementById("image-editor-container");
    if (!imageElement) return;

    const rect = imageElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const initialAngle = Math.atan2(clientY - centerY, clientX - centerX);
    const startRotation = slide.imageStyle?.rotation || 0;

    const handleMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const currentAngle = Math.atan2(currentY - centerY, currentX - centerX);
      const angleDiff = ((currentAngle - initialAngle) * 180) / Math.PI;
      const newRotation = Math.round((startRotation + angleDiff + 360) % 360);

      updateElementStyle("image", "rotation", newRotation);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleMouseMove);
      window.removeEventListener("touchend", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleMouseMove, { passive: true });
    window.addEventListener("touchend", handleMouseUp);
  };

  // Drag to resize image logic
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, handle: string) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);

    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const startScale = slide.imageStyle?.scale || 100;

    const handleMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const dx = currentX - startX;
      const dy = currentY - startY;

      let delta = 0;
      if (handle.includes("right")) delta += dx;
      if (handle.includes("left")) delta -= dx;
      if (handle.includes("bottom")) delta += dy;
      if (handle.includes("top")) delta -= dy;

      const newScale = Math.min(150, Math.max(30, Math.round(startScale + delta * 0.5)));
      updateElementStyle("image", "scale", newScale);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleMouseMove);
      window.removeEventListener("touchend", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleMouseMove, { passive: true });
    window.addEventListener("touchend", handleMouseUp);
  };

  // Handle direct text edits
  const handleTextChange = (element: "title" | "headline", text: string) => {
    onUpdateSlide({
      ...slide,
      [element]: text
    });
  };

  const handleBulletTextChange = (idx: number, text: string) => {
    const updatedBullets = [...slide.bullets];
    updatedBullets[idx] = text;
    onUpdateSlide({
      ...slide,
      bullets: updatedBullets
    });
  };

  const deleteBullet = (idx: number) => {
    onUpdateSlide({
      ...slide,
      bullets: slide.bullets.filter((_, i) => i !== idx)
    });
  };

  const addBulletPoint = () => {
    if (slide.bullets.length < 5) {
      onUpdateSlide({
        ...slide,
        bullets: [...slide.bullets, "New critical strategy outline point"]
      });
    }
  };

  // Image manual uploader handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUpdateSlide({
            ...slide,
            conceptImage: event.target.result as string,
            useImageOnSlide: true
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Drag & drop file handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUpdateSlide({
            ...slide,
            conceptImage: event.target.result as string,
            useImageOnSlide: true
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset custom styling for selected element
  const handleResetStyles = () => {
    if (!selectedElement) return;
    const styleKey = `${selectedElement}Style` as const;
    onUpdateSlide({
      ...slide,
      [styleKey]: undefined
    });
  };

  // AI-powered visual regeneration helper
  const handleGenerateImageConcept = async () => {
    setIsGeneratingImage(true);
    setImageError(null);
    try {
      const response = await fetch("/api/presentation/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: slide.title,
          headline: slide.headline,
          visualSuggestion: slide.visualSuggestion,
          themeStyle: theme.visualStyle
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate slide image concept.");
      }

      const data = await response.json();
      onUpdateSlide({
        ...slide,
        conceptImage: data.imageUrl,
        conceptExplanation: data.conceptExplanation,
        useImageOnSlide: true
      });
    } catch (err: any) {
      console.error("Image generation error:", err);
      setImageError(err.message || "An error occurred during visualization.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Standard preset layout flags
  const isCover = slide.number === 1 || slide.title.toLowerCase().includes("title") || slide.title.toLowerCase().includes("welcome");
  const isAgenda = slide.number === 2 || slide.title.toLowerCase().includes("agenda") || slide.title.toLowerCase().includes("contents") || slide.title.toLowerCase().includes("roadmap");
  const hasChart = slide.visualSuggestion.toLowerCase().includes("chart") || slide.visualSuggestion.toLowerCase().includes("graph") || slide.visualSuggestion.toLowerCase().includes("metric") || slide.visualSuggestion.toLowerCase().includes("data");

  // Get current styling of selected element
  const getSelectedStyle = (): ElementStyle => {
    if (!selectedElement) return {};
    const key = `${selectedElement}Style` as const;
    return slide[key] || {};
  };

  const activeStyle = getSelectedStyle();

  // Helper styles resolver
  const resolveStyles = (elem: "title" | "headline" | "bullets" | "image", defaults: React.CSSProperties): React.CSSProperties => {
    const styleKey = `${elem}Style` as const;
    const custom = slide[styleKey] || {};
    
    return {
      ...defaults,
      fontSize: custom.fontSize ? `${custom.fontSize}px` : defaults.fontSize,
      fontFamily: custom.fontFace || defaults.fontFamily,
      color: custom.color || defaults.color,
      fontWeight: custom.bold ? "bold" : custom.bold === false ? "normal" : defaults.fontWeight,
      fontStyle: custom.italic ? "italic" : custom.italic === false ? "normal" : defaults.fontStyle,
      textDecoration: custom.underline ? "underline" : custom.underline === false ? "none" : defaults.textDecoration,
      textAlign: custom.align || defaults.textAlign,
      transform: custom.rotation ? `rotate(${custom.rotation}deg)` : undefined,
      transition: "transform 0.15s ease, font-size 0.15s ease"
    };
  };

  // Rotation adjust trigger handler
  const handleRotationClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedElement) return;
    const currentRot = activeStyle.rotation || 0;
    // Rotate 15 degrees incremental cycle
    const nextRot = (currentRot + 15) % 360;
    updateElementStyle(selectedElement, "rotation", nextRot);
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Slide Navigation Header Bar */}
      <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
          <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
            Active Workspace Editor
          </span>
          <span className="text-[10px] bg-sky-50 text-sky-700 font-bold px-2 py-0.5 rounded-md font-mono">
            Slide {slide.number} of {totalSlides}
          </span>
        </div>
        
        <div className="flex items-center gap-2 font-bold">
          {slide.conceptImage && (
            <button
              onClick={() => {
                onUpdateSlide({
                  ...slide,
                  useImageOnSlide: !slide.useImageOnSlide
                });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-tight transition flex items-center gap-1.5 cursor-pointer border ${
                slide.useImageOnSlide
                  ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 shadow-sm"
              }`}
              title={slide.useImageOnSlide ? "Remove Image" : "Show Image on slide"}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{slide.useImageOnSlide ? "Remove Image" : "Show Image"}</span>
            </button>
          )}

          {onToggleCopilot && (
            <button
              onClick={onToggleCopilot}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs transition flex items-center gap-1.5 cursor-pointer font-sans shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
              <span>{isCopilotMinimized ? "Expand Chat" : "Minimize Chat"}</span>
            </button>
          )}

          <div className="h-4 w-px bg-slate-200 mx-1" />

          <button
            disabled={!hasPrev}
            onClick={onPrev}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-35 text-slate-700 text-xs transition flex items-center gap-1 cursor-pointer font-sans"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>
          
          <span className="text-xs text-slate-400 px-1 font-semibold font-mono">
            {slide.number} / {totalSlides}
          </span>
          
          <button
            disabled={!hasNext}
            onClick={onNext}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-35 text-slate-700 text-xs transition flex items-center gap-1 cursor-pointer font-sans"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating wysiwyg formatting styling toolbar when an element is clicked */}
      {selectedElement && selectedElement !== "image" && (
        <FormattingToolbar
          selectedElement={selectedElement}
          slide={slide}
          colors={colors}
          activeStyle={activeStyle}
          showColorPicker={showColorPicker}
          setShowColorPicker={setShowColorPicker}
          updateElementStyle={updateElementStyle}
          handleRotationClick={handleRotationClick}
          handleResetStyles={handleResetStyles}
        />
      )}

      {/* The main active slide drawing canvas */}
      <SlideCanvas
        slide={slide}
        theme={theme}
        colors={colors}
        selectedElement={selectedElement}
        setSelectedElement={setSelectedElement}
        resolveStyles={resolveStyles}
        handleTextChange={handleTextChange}
        handleBulletTextChange={handleBulletTextChange}
        deleteBullet={deleteBullet}
        addBulletPoint={addBulletPoint}
        isCover={isCover}
        isAgenda={isAgenda}
        hasChart={hasChart}
        activeCropMode={activeCropMode}
        setActiveCropMode={setActiveCropMode}
        activeScaleSlider={activeScaleSlider}
        setActiveScaleSlider={setActiveScaleSlider}
        isDragging={isDragging}
        isGeneratingImage={isGeneratingImage}
        handleGenerateImageConcept={handleGenerateImageConcept}
        triggerFileSelect={triggerFileSelect}
        handleResizeStart={handleResizeStart}
        handleRotateStart={handleRotateStart}
        handleRotationClick={handleRotationClick}
        updateElementStyle={updateElementStyle}
        onUpdateSlide={onUpdateSlide}
      />

      {/* Hidden file input for manual upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Bottom widgets, instructions guidelines and speaker notes */}
      <MetaPanels
        slide={slide}
        onUpdateSlide={onUpdateSlide}
        isEditingNotes={isEditingNotes}
        setIsEditingNotes={setIsEditingNotes}
        isGeneratingImage={isGeneratingImage}
        imageError={imageError}
        handleGenerateImageConcept={handleGenerateImageConcept}
        triggerFileSelect={triggerFileSelect}
        handleDragOver={handleDragOver}
        handleDrop={handleDrop}
      />
    </div>
  );
}
