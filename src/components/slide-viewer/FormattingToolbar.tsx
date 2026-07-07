import React from "react";
import { Slide, ElementStyle, ColorPalette } from "../../types";
import { 
  ChevronDown, Minus, Plus, Bold, Italic, Underline, 
  AlignLeft, AlignCenter, AlignRight, RotateCw 
} from "lucide-react";

interface FormattingToolbarProps {
  selectedElement: "title" | "headline" | "bullets" | "image";
  slide: Slide;
  colors: ColorPalette;
  activeStyle: ElementStyle;
  showColorPicker: boolean;
  setShowColorPicker: (show: boolean) => void;
  updateElementStyle: (element: "title" | "headline" | "bullets" | "image", key: keyof ElementStyle, value: any) => void;
  handleRotationClick: (e: React.MouseEvent) => void;
  handleResetStyles: () => void;
}

export default function FormattingToolbar({
  selectedElement,
  slide,
  colors,
  activeStyle,
  showColorPicker,
  setShowColorPicker,
  updateElementStyle,
  handleRotationClick,
  handleResetStyles
}: FormattingToolbarProps) {
  return (
    <div className="bg-slate-900 text-white rounded-2xl p-2.5 shadow-xl flex flex-wrap items-center gap-3 border border-slate-800 animate-in fade-in slide-in-from-top-3 duration-200 z-10 self-start w-full">
      {/* Font selection dropdown */}
      <div className="relative group">
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-mono text-slate-300 transition">
          <span>{activeStyle.fontFace || "Inter"}</span>
          <ChevronDown className="w-3 h-3" />
        </button>
        <div className="absolute left-0 mt-1.5 bg-slate-800 border border-slate-700 rounded-xl py-1 w-44 shadow-xl hidden group-hover:block z-50">
          {["Inter", "Arial", "Playfair Display", "Space Grotesk", "JetBrains Mono"].map((font) => (
            <button
              key={font}
              onClick={() => updateElementStyle(selectedElement, "fontFace", font)}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-700 text-slate-200 font-medium font-sans"
            >
              {font}
            </button>
          ))}
        </div>
      </div>

      <div className="h-5 w-px bg-slate-700" />

      {/* Size modifier controls */}
      <div className="flex items-center gap-1">
        <button 
          onClick={() => {
            const current = activeStyle.fontSize || (selectedElement === "title" ? 28 : selectedElement === "headline" ? 14 : 12);
            updateElementStyle(selectedElement, "fontSize", Math.max(8, current - 2));
          }}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          title="Decrease Font Size"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs font-mono font-bold text-slate-300 w-12 text-center">
          {activeStyle.fontSize || (selectedElement === "title" ? 28 : selectedElement === "headline" ? 14 : 12)}px
        </span>
        <button 
          onClick={() => {
            const current = activeStyle.fontSize || (selectedElement === "title" ? 28 : selectedElement === "headline" ? 14 : 12);
            updateElementStyle(selectedElement, "fontSize", Math.min(72, current + 2));
          }}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          title="Increase Font Size"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-5 w-px bg-slate-700" />

      {/* Custom color dot selector */}
      <div className="relative">
        <button 
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="flex items-center gap-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs"
          title="Change Text Color"
        >
          <span 
            className="w-4.5 h-4.5 rounded-full border border-slate-600 block shadow-xs" 
            style={{ backgroundColor: activeStyle.color || colors.text }} 
          />
          <span className="text-[10px] font-bold font-mono opacity-80 text-slate-400">Color</span>
        </button>
        {showColorPicker && (
          <div className="absolute left-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl grid grid-cols-5 gap-2.5 z-50 w-44">
            {[colors.text, colors.primary, colors.secondary, "#ffffff", "#000000", "#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"].map((c) => (
              <button
                key={c}
                onClick={() => {
                  updateElementStyle(selectedElement, "color", c);
                  setShowColorPicker(false);
                }}
                className="w-6 h-6 rounded-full border border-slate-600 hover:scale-110 transition cursor-pointer"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="h-5 w-px bg-slate-700" />

      {/* Styling options: Bold, Italic, Underline */}
      <div className="flex items-center gap-1">
        <button 
          onClick={() => updateElementStyle(selectedElement, "bold", !activeStyle.bold)}
          className={`p-1.5 rounded-lg transition ${activeStyle.bold ? "bg-sky-500 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-300"}`}
          title="Bold Text"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={() => updateElementStyle(selectedElement, "italic", !activeStyle.italic)}
          className={`p-1.5 rounded-lg transition ${activeStyle.italic ? "bg-sky-500 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-300"}`}
          title="Italic Text"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={() => updateElementStyle(selectedElement, "underline", !activeStyle.underline)}
          className={`p-1.5 rounded-lg transition ${activeStyle.underline ? "bg-sky-500 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-300"}`}
          title="Underline Text"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-5 w-px bg-slate-700" />

      {/* Alignment controls */}
      <div className="flex items-center gap-1">
        <button 
          onClick={() => updateElementStyle(selectedElement, "align", "left")}
          className={`p-1.5 rounded-lg transition ${activeStyle.align === "left" || !activeStyle.align ? "bg-sky-500 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-300"}`}
          title="Align Left"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={() => updateElementStyle(selectedElement, "align", "center")}
          className={`p-1.5 rounded-lg transition ${activeStyle.align === "center" ? "bg-sky-500 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-300"}`}
          title="Align Center"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={() => updateElementStyle(selectedElement, "align", "right")}
          className={`p-1.5 rounded-lg transition ${activeStyle.align === "right" ? "bg-sky-500 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-300"}`}
          title="Align Right"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-5 w-px bg-slate-700 ml-auto" />

      {/* Quick operations */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleRotationClick}
          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300 flex items-center gap-1"
          title="Rotate Box clockwise"
        >
          <RotateCw className="w-3 h-3 text-amber-400" />
          <span>Rotate</span>
        </button>

        <button
          onClick={handleResetStyles}
          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
          title="Reset formatting to default styles"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
