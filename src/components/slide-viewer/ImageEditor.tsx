import React from "react";
import { Slide, ElementStyle } from "../../types";
import { 
  Upload, Trash2, MoreHorizontal, RotateCw, Sparkle 
} from "lucide-react";

interface ImageEditorProps {
  slide: Slide;
  onUpdateSlide: (updated: Slide) => void;
  selectedElement: "title" | "headline" | "bullets" | "image" | null;
  setSelectedElement: (elem: "title" | "headline" | "bullets" | "image" | null) => void;
  activeCropMode: boolean;
  setActiveCropMode: (val: boolean) => void;
  activeScaleSlider: boolean;
  setActiveScaleSlider: (val: boolean) => void;
  isDragging: boolean;
  isGeneratingImage: boolean;
  handleGenerateImageConcept: () => void;
  triggerFileSelect: () => void;
  handleResizeStart: (e: React.MouseEvent | React.TouchEvent, handle: string) => void;
  handleRotateStart: (e: React.MouseEvent | React.TouchEvent) => void;
  updateElementStyle: (element: "title" | "headline" | "bullets" | "image", key: keyof ElementStyle, value: any) => void;
}

export default function ImageEditor({
  slide,
  onUpdateSlide,
  selectedElement,
  setSelectedElement,
  activeCropMode,
  setActiveCropMode,
  activeScaleSlider,
  setActiveScaleSlider,
  isDragging,
  isGeneratingImage,
  handleGenerateImageConcept,
  triggerFileSelect,
  handleResizeStart,
  handleRotateStart,
  updateElementStyle
}: ImageEditorProps) {
  const imageStyle = slide.imageStyle || {};
  const rotation = imageStyle.rotation || 0;
  const flipH = imageStyle.flipH || false;
  const flipV = imageStyle.flipV || false;
  const scale = imageStyle.scale || 100;
  const cropX = imageStyle.cropX || 0;
  const cropY = imageStyle.cropY || 0;
  const cropW = imageStyle.cropW || 100;
  const cropH = imageStyle.cropH || 100;

  const rightInset = Math.max(0, 100 - cropX - cropW);
  const bottomInset = Math.max(0, 100 - cropY - cropH);

  return (
    <div 
      id="image-editor-container"
      onClick={(e) => { e.stopPropagation(); setSelectedElement("image"); }}
      className="relative md:col-span-1 flex items-center justify-center select-none"
      style={{
        transform: `rotate(${rotation}deg)`,
        width: `${scale}%`,
        margin: "auto",
        transition: isDragging ? "none" : "transform 0.15s ease, width 0.15s ease"
      }}
    >
      {/* Floating Sleek Image Editing Toolbar hovering directly over image container */}
      {selectedElement === "image" && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white text-slate-800 rounded-2xl px-3 py-1.5 shadow-2xl flex items-center gap-2 border border-slate-200/80 animate-in fade-in slide-in-from-bottom-2 duration-200 z-40 select-none">
          {/* Flip Horizontal */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateElementStyle("image", "flipH", !flipH);
            }}
            className={`p-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
              flipH ? "bg-cyan-50 text-cyan-600" : "hover:bg-slate-100 text-slate-600"
            }`}
            title="Flip Horizontally"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5L5 9m0 0l4 4m-4-4h14M15 19l4-4m0 0l-4-4m4 4H5" />
            </svg>
          </button>

          {/* Flip Vertical */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateElementStyle("image", "flipV", !flipV);
            }}
            className={`p-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
              flipV ? "bg-cyan-50 text-cyan-600" : "hover:bg-slate-100 text-slate-600"
            }`}
            title="Flip Vertically"
          >
            <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5L5 9m0 0l4 4m-4-4h14M15 19l4-4m0 0l-4-4m4 4H5" />
            </svg>
          </button>

          {/* Crop Settings Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveCropMode(!activeCropMode);
              setActiveScaleSlider(false);
            }}
            className={`p-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
              activeCropMode ? "bg-cyan-50 text-cyan-600" : "hover:bg-slate-100 text-slate-600"
            }`}
            title="Crop Workspace"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 5v11a2 2 0 002 2h11M18 19V8a2 2 0 00-2-2H9" />
            </svg>
          </button>

          {/* Resize/Scale Slider Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveScaleSlider(!activeScaleSlider);
              setActiveCropMode(false);
            }}
            className={`p-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
              activeScaleSlider ? "bg-cyan-50 text-cyan-600" : "hover:bg-slate-100 text-slate-600"
            }`}
            title="Resize/Scale Adjustment"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
          </button>

          {/* Manual Upload */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerFileSelect();
            }}
            className="p-1.5 rounded-lg hover:bg-sky-50 text-sky-600 transition-all duration-150 cursor-pointer"
            title="Manual Upload Image"
          >
            <Upload className="w-4 h-4" />
          </button>

          {/* AI Redraw */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleGenerateImageConcept();
            }}
            disabled={isGeneratingImage}
            className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 disabled:opacity-40 transition-all duration-150 cursor-pointer"
            title="AI Redraw Visual"
          >
            <Sparkle className={`w-4 h-4 ${isGeneratingImage ? "animate-spin" : ""}`} />
          </button>

          <div className="h-5 w-px bg-slate-200" />

          {/* Delete from slide */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateSlide({
                ...slide,
                useImageOnSlide: false
              });
            }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-600 transition-all duration-150 cursor-pointer"
            title="Delete Image"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Reset Settings */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateSlide({
                ...slide,
                imageStyle: {
                  rotation: 0,
                  flipH: false,
                  flipV: false,
                  scale: 100,
                  cropX: 0,
                  cropY: 0,
                  cropW: 100,
                  cropH: 100
                }
              });
              setActiveCropMode(false);
              setActiveScaleSlider(false);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-all duration-150 cursor-pointer"
            title="Reset all edits"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub-panel overlay: Crop Sliders */}
      {activeCropMode && selectedElement === "image" && (
        <div className="absolute -top-56 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl flex flex-col gap-2 border border-slate-800 animate-in fade-in zoom-in duration-150 z-50 w-60 select-none">
          <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 mb-1">
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">Crop Mask Tool</span>
            <button 
              onClick={() => {
                updateElementStyle("image", "cropX", 0);
                updateElementStyle("image", "cropY", 0);
                updateElementStyle("image", "cropW", 100);
                updateElementStyle("image", "cropH", 100);
              }}
              className="text-[9px] bg-slate-850 hover:bg-slate-750 text-slate-300 font-extrabold px-1.5 py-0.5 rounded cursor-pointer transition"
            >
              Reset
            </button>
          </div>
          
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between text-[9px] font-mono text-slate-400">
              <span>Left Offset:</span>
              <span className="font-bold text-cyan-400">{cropX}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={cropX}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                updateElementStyle("image", "cropX", val);
                if (val + cropW > 100) {
                  updateElementStyle("image", "cropW", 100 - val);
                }
              }}
              className="w-full accent-cyan-400 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
            />
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between text-[9px] font-mono text-slate-400">
              <span>Top Offset:</span>
              <span className="font-bold text-cyan-400">{cropY}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={cropY}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                updateElementStyle("image", "cropY", val);
                if (val + cropH > 100) {
                  updateElementStyle("image", "cropH", 100 - val);
                }
              }}
              className="w-full accent-cyan-400 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
            />
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between text-[9px] font-mono text-slate-400">
              <span>Width Crop:</span>
              <span className="font-bold text-cyan-400">{cropW}%</span>
            </div>
            <input
              type="range"
              min="30"
              max={100 - cropX}
              value={cropW}
              onChange={(e) => updateElementStyle("image", "cropW", parseInt(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
            />
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between text-[9px] font-mono text-slate-400">
              <span>Height Crop:</span>
              <span className="font-bold text-cyan-400">{cropH}%</span>
            </div>
            <input
              type="range"
              min="30"
              max={100 - cropY}
              value={cropH}
              onChange={(e) => updateElementStyle("image", "cropH", parseInt(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
            />
          </div>
        </div>
      )}

      {/* Sub-panel overlay: Scale Slider */}
      {activeScaleSlider && selectedElement === "image" && (
        <div className="absolute -top-36 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl flex flex-col gap-2 border border-slate-800 animate-in fade-in zoom-in duration-150 z-50 w-60 select-none">
          <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 mb-1">
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">Image Resize</span>
            <button 
              onClick={() => updateElementStyle("image", "scale", 100)}
              className="text-[9px] bg-slate-850 hover:bg-slate-750 text-slate-300 font-extrabold px-1.5 py-0.5 rounded cursor-pointer transition"
            >
              Reset
            </button>
          </div>
          
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[9px] font-mono text-slate-400">
              <span>Sizing:</span>
              <span className="font-bold text-cyan-400">{scale}%</span>
            </div>
            <input
              type="range"
              min="30"
              max="150"
              value={scale}
              onChange={(e) => updateElementStyle("image", "scale", parseInt(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
            />
          </div>
        </div>
      )}

      {/* Actual Round Rounded Image Container */}
      <div 
        className={`w-full h-full aspect-[16/9] md:h-[264px] rounded-xl overflow-hidden shadow-md bg-black/15 flex items-center justify-center transition-all duration-150 border-2 ${
          selectedElement === "image" ? "border-cyan-400" : "border-transparent hover:outline hover:outline-1 hover:outline-dashed hover:outline-slate-400"
        }`}
      >
        <img 
          src={slide.conceptImage} 
          alt="Slide Visual Illustration" 
          className="w-full h-full object-cover select-none pointer-events-none"
          referrerPolicy="no-referrer"
          style={{
            transform: `scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
            clipPath: `inset(${cropY}% ${rightInset}% ${bottomInset}% ${cropX}%)`,
            transition: "transform 0.15s ease"
          }}
        />
      </div>

      {/* Overlay selection & handles */}
      {selectedElement === "image" && (
        <>
          {/* Cyan Dashed Selection Outline Box */}
          <div className="absolute inset-0 border-2 border-dashed border-cyan-400 pointer-events-none rounded-xl z-10" />

          {/* 8 Drag Handles */}
          {["top-left", "top-middle", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-middle", "bottom-right"].map((position) => {
            let positionClasses = "";
            switch (position) {
              case "top-left": positionClasses = "top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize"; break;
              case "top-middle": positionClasses = "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize"; break;
              case "top-right": positionClasses = "top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize"; break;
              case "middle-left": positionClasses = "top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize"; break;
              case "middle-right": positionClasses = "top-1/2 right-0 translate-x-1/2 -translate-y-1/2 cursor-ew-resize"; break;
              case "bottom-left": positionClasses = "bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize"; break;
              case "bottom-middle": positionClasses = "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-ns-resize"; break;
              case "bottom-right": positionClasses = "bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize"; break;
            }
            return (
              <div
                key={position}
                onMouseDown={(e) => handleResizeStart(e, position)}
                onTouchStart={(e) => handleResizeStart(e, position)}
                className={`absolute w-3.5 h-3.5 rounded-full bg-white border-2 border-cyan-400 shadow-md hover:scale-125 transition-transform z-20 ${positionClasses}`}
              />
            );
          })}

          {/* Bottom Rotation handle trigger */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-14 z-30 flex flex-col items-center gap-0.5 select-none">
            <button
              onMouseDown={handleRotateStart}
              onTouchStart={handleRotateStart}
              onClick={(e) => {
                e.stopPropagation();
                const nextRot = (rotation + 45) % 360;
                updateElementStyle("image", "rotation", nextRot);
              }}
              className="w-10 h-10 rounded-full bg-white shadow-xl border border-slate-200/90 flex items-center justify-center text-slate-700 hover:text-cyan-500 hover:scale-110 active:scale-90 transition cursor-grab active:cursor-grabbing"
              title="Drag or click to rotate 45 degrees"
            >
              <RotateCw className="w-5 h-5 text-cyan-400 font-bold" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
