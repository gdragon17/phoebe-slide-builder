import React from "react";
import { Slide } from "../../types";
import { 
  Layers, FileText, Sparkles, RefreshCw, AlertCircle, ImageIcon, Upload 
} from "lucide-react";

interface MetaPanelsProps {
  slide: Slide;
  onUpdateSlide: (updated: Slide) => void;
  isEditingNotes: boolean;
  setIsEditingNotes: (val: boolean) => void;
  isGeneratingImage: boolean;
  imageError: string | null;
  handleGenerateImageConcept: () => void;
  triggerFileSelect: () => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
}

export default function MetaPanels({
  slide,
  onUpdateSlide,
  isEditingNotes,
  setIsEditingNotes,
  isGeneratingImage,
  imageError,
  handleGenerateImageConcept,
  triggerFileSelect,
  handleDragOver,
  handleDrop
}: MetaPanelsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      
      {/* Left Side: Layout Directives & Delivery Script */}
      <div className="lg:col-span-3 flex flex-col gap-4">
        {/* Card: Layout Instruction */}
        <div className="bg-white p-5 rounded-[24px] border border-slate-200/80 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-700 font-extrabold text-xs tracking-wider uppercase">
            <Layers className="w-4 h-4 text-sky-600" />
            <span>Layout Instructions & Creative Guidelines</span>
          </div>
          
          <textarea
            className="w-full text-xs font-mono bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-slate-700 focus:border-sky-500 h-20 outline-none leading-relaxed"
            value={slide.visualSuggestion}
            onChange={(e) => onUpdateSlide({ ...slide, visualSuggestion: e.target.value })}
            placeholder="Visual design notes for slide concept layout..."
          />
        </div>

        {/* Card: Speaker Notes / Script */}
        <div className="bg-white p-5 rounded-[24px] border border-slate-200/80 shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700 font-extrabold text-xs tracking-wider uppercase">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Speaker Delivery Script & Voiceover</span>
            </div>
            <button 
              onClick={() => setIsEditingNotes(!isEditingNotes)}
              className="text-[10px] text-sky-600 hover:text-sky-700 font-bold cursor-pointer transition"
            >
              {isEditingNotes ? "Finish Edit" : "Edit Notes"}
            </button>
          </div>

          {isEditingNotes ? (
            <textarea
              className="w-full text-xs bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:border-sky-500 h-24 outline-none"
              value={slide.speakerNotes}
              onChange={(e) => onUpdateSlide({ ...slide, speakerNotes: e.target.value })}
              placeholder="Write what to say when presenting this slide..."
            />
          ) : (
            <p className="text-xs text-slate-800 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100 italic">
              "{slide.speakerNotes || "Write delivery notes here to guide your client presentation flow."}"
            </p>
          )}
        </div>
      </div>

      {/* Right Side: Dynamic Context Visual Solution & Drag-and-Drop Image Uploader */}
      <div className="lg:col-span-2 bg-white p-5 rounded-[24px] border border-slate-200/80 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs tracking-wider uppercase">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Thematic Visual & Uploads</span>
          </div>
          {slide.conceptImage && (
            <button
              onClick={handleGenerateImageConcept}
              disabled={isGeneratingImage}
              className="text-[10px] text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50 transition"
              title="Regenerate theme-based vector style slide graphic using Gemini"
            >
              <RefreshCw className={`w-3 h-3 ${isGeneratingImage ? 'animate-spin' : ''}`} />
              <span>AI Redraw</span>
            </button>
          )}
        </div>

        {/* Interactive Drag & Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`transition-all duration-200 rounded-xl border-2 border-dashed ${
            slide.conceptImage 
              ? "border-slate-200/60" 
              : "border-slate-300 bg-slate-50 hover:bg-slate-100/50"
          }`}
        >
          {isGeneratingImage ? (
            <div className="aspect-[16/9] w-full flex flex-col items-center justify-center p-6 text-center animate-pulse bg-slate-50/50">
              <RefreshCw className="w-6 h-6 text-sky-600 animate-spin mb-2.5" />
              <h5 className="text-xs font-bold text-slate-700">Synthesizing Bespoke Vector Style</h5>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Analyzing context words to draw modern presentation graphic...
              </p>
            </div>
          ) : imageError ? (
            <div className="aspect-[16/9] w-full flex flex-col items-center justify-center p-6 text-center bg-red-50/40">
              <AlertCircle className="w-6 h-6 text-red-500 mb-2" />
              <h5 className="text-xs font-bold text-red-700">Failed to render graphic</h5>
              <p className="text-[10px] text-red-500/80 max-w-[200px] mt-1 leading-relaxed">{imageError}</p>
              <button
                onClick={handleGenerateImageConcept}
                className="mt-3 px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-[9px] font-bold rounded-lg transition cursor-pointer"
              >
                Retry AI Gen
              </button>
            </div>
          ) : slide.conceptImage ? (
            <div className="p-3.5 flex flex-col gap-3">
              <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden border border-slate-200/50 bg-slate-100 shadow-xs">
                <img
                  src={slide.conceptImage}
                  alt="Bespoke slide illustration"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2.5 pt-6 flex justify-between items-end pointer-events-none">
                  <span className="text-[9px] font-mono text-white/90 font-bold tracking-tight">Active Visual Asset</span>
                  <span className="text-[8px] font-mono text-white/55">16:9 ratio</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onUpdateSlide({
                      ...slide,
                      useImageOnSlide: !slide.useImageOnSlide
                    });
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                    slide.useImageOnSlide
                      ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                      : "bg-emerald-600 text-white border-transparent hover:bg-emerald-700 shadow-xs"
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{slide.useImageOnSlide ? "Remove from Slide" : "Show on Slide"}</span>
                </button>
                <button
                  onClick={triggerFileSelect}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Replace Visual</span>
                </button>
              </div>

              {slide.conceptExplanation && (
                <div className="flex flex-col gap-1 pt-1 border-t border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Creative Direction Metaphor</span>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-sans">{slide.conceptExplanation}</p>
                </div>
              )}
            </div>
          ) : (
            <div 
              onClick={triggerFileSelect}
              className="cursor-pointer aspect-[16/9] w-full flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center mb-2.5 shadow-xs">
                <Upload className="w-5 h-5" />
              </div>
              <h5 className="text-xs font-bold text-slate-700">Customize Slide Visuals</h5>
              <p className="text-[10px] text-slate-400 max-w-[200px] mt-1 leading-relaxed">
                Drag and drop any custom image here, upload from local folder, or use Gemini AI to redraw instantly.
              </p>
              <div className="flex gap-2 mt-4.5">
                <button
                  onClick={(e) => { e.stopPropagation(); triggerFileSelect(); }}
                  className="px-3 py-1.5 bg-slate-900 text-white font-bold text-[10px] rounded-lg transition cursor-pointer hover:bg-slate-800 shadow-xs"
                >
                  Upload Photo
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleGenerateImageConcept(); }}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10px] rounded-lg transition cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>AI Redraw</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
