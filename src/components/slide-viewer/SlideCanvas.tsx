import React from "react";
import { Slide, ElementStyle, ColorPalette, PresentationTheme } from "../../types";
import { Plus, TrendingUp, RefreshCw } from "lucide-react";
import ImageEditor from "./ImageEditor";

interface SlideCanvasProps {
  slide: Slide;
  theme: PresentationTheme;
  colors: ColorPalette;
  selectedElement: "title" | "headline" | "bullets" | "image" | null;
  setSelectedElement: (elem: "title" | "headline" | "bullets" | "image" | null) => void;
  resolveStyles: (element: "title" | "headline" | "bullets" | "image", defaultStyles: React.CSSProperties) => React.CSSProperties;
  handleTextChange: (element: "title" | "headline", val: string) => void;
  handleBulletTextChange: (idx: number, val: string) => void;
  deleteBullet: (idx: number) => void;
  addBulletPoint: () => void;
  isCover: boolean;
  isAgenda: boolean;
  hasChart: boolean;
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
  handleRotationClick: (e: React.MouseEvent) => void;
  updateElementStyle: (element: "title" | "headline" | "bullets" | "image", key: keyof ElementStyle, value: any) => void;
  onUpdateSlide: (updated: Slide) => void;
}

export default function SlideCanvas({
  slide,
  theme,
  colors,
  selectedElement,
  setSelectedElement,
  resolveStyles,
  handleTextChange,
  handleBulletTextChange,
  deleteBullet,
  addBulletPoint,
  isCover,
  isAgenda,
  hasChart,
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
  handleRotationClick,
  updateElementStyle,
  onUpdateSlide
}: SlideCanvasProps) {
  const activeStyle = (() => {
    if (selectedElement === "title") return slide.titleStyle || {};
    if (selectedElement === "headline") return slide.headlineStyle || {};
    if (selectedElement === "bullets") return slide.bulletsStyle || {};
    if (selectedElement === "image") return slide.imageStyle || {};
    return {};
  })();

  return (
    <div 
      id="slide-presenter-canvas-card"
      onClick={() => setSelectedElement(null)}
      className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-200/80 shadow-md relative overflow-hidden transition-all duration-300"
      style={{ 
        backgroundColor: colors.background,
        color: colors.text 
      }}
    >
      <div className="flex flex-col justify-between h-full min-h-[300px] md:min-h-[340px] gap-6">
        
        {/* Slide Header Tagline */}
        <div className="flex justify-between items-start pointer-events-none">
          <span className="text-[10px] md:text-xs font-mono opacity-60 uppercase font-black tracking-widest">
            {isCover ? "Opening Keynote" : isAgenda ? "Table of Contents" : hasChart ? "Performance Dashboard" : "Strategic Outline"}
          </span>
          <span className="text-xs md:text-sm font-bold font-mono opacity-30">
            0{slide.number}
          </span>
        </div>

        {/* Core Layout Renderer Block */}
        <div className="flex-1 flex flex-col justify-center">
          {slide.conceptImage && slide.useImageOnSlide ? (
            /* Layout split view: Left text narrative / Right image */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="flex flex-col gap-2">
                
                {/* TITLE INTERACTIVE BLOCK */}
                <div 
                  onClick={(e) => { e.stopPropagation(); setSelectedElement("title"); }}
                  className={`relative p-1 rounded-lg transition-all duration-150 cursor-text ${
                    selectedElement === "title" ? "border-2 border-dashed border-sky-500 shadow-xs animate-pulse" : "hover:bg-slate-50/10 hover:outline hover:outline-1 hover:outline-dashed hover:outline-slate-400"
                  }`}
                >
                  <input
                    type="text"
                    className="w-full bg-transparent border-none outline-none font-serif font-extrabold tracking-tight leading-tight select-text focus:ring-0"
                    style={resolveStyles("title", { fontSize: "22px", color: colors.text })}
                    value={slide.title}
                    onChange={(e) => handleTextChange("title", e.target.value)}
                  />
                  {selectedElement === "title" && (
                    <>
                      <span className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                      <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                      <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                      <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                    </>
                  )}
                </div>

                {/* HEADLINE INTERACTIVE BLOCK */}
                <div 
                  onClick={(e) => { e.stopPropagation(); setSelectedElement("headline"); }}
                  className={`relative p-1 rounded-lg transition-all duration-150 cursor-text ${
                    selectedElement === "headline" ? "border-2 border-dashed border-sky-500 shadow-xs animate-pulse" : "hover:bg-slate-50/10 hover:outline hover:outline-1 hover:outline-dashed hover:outline-slate-400"
                  }`}
                >
                  <input
                    type="text"
                    className="w-full bg-transparent border-none outline-none font-sans italic leading-tight select-text focus:ring-0"
                    style={resolveStyles("headline", { fontSize: "13px", color: colors.secondary })}
                    value={slide.headline}
                    onChange={(e) => handleTextChange("headline", e.target.value)}
                  />
                  {selectedElement === "headline" && (
                    <>
                      <span className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                      <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                      <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                      <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                    </>
                  )}
                </div>

                {/* BULLETS INTERACTIVE BLOCK */}
                <div 
                  onClick={(e) => { e.stopPropagation(); setSelectedElement("bullets"); }}
                  className={`relative p-1.5 rounded-lg transition-all duration-150 mt-1 cursor-text ${
                    selectedElement === "bullets" ? "border-2 border-dashed border-sky-500 shadow-xs animate-pulse" : "hover:bg-slate-50/10 hover:outline hover:outline-1 hover:outline-dashed hover:outline-slate-400"
                  }`}
                  style={resolveStyles("bullets", {})}
                >
                  <ul className="space-y-1.5">
                    {slide.bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs md:text-[13px] group/item">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors.primary }} />
                        <input
                          type="text"
                          className="flex-1 bg-transparent border-none p-0 leading-relaxed outline-none focus:ring-0 text-slate-850"
                          style={{ color: colors.text }}
                          value={bullet}
                          onChange={(e) => handleBulletTextChange(idx, e.target.value)}
                        />
                        {selectedElement === "bullets" && slide.bullets.length > 1 && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteBullet(idx); }}
                            className="opacity-0 group-hover/item:opacity-100 text-red-500 hover:text-red-600 text-[10px] font-bold px-1.5 transition cursor-pointer"
                          >
                            🗑
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                  {selectedElement === "bullets" && (
                    <div className="mt-2 flex justify-between items-center">
                      {slide.bullets.length < 5 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); addBulletPoint(); }}
                          className="text-[10px] text-sky-600 hover:text-sky-700 font-bold flex items-center gap-0.5 cursor-pointer bg-sky-50 hover:bg-sky-100 px-2 py-1 rounded-md border border-sky-200"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Key Point</span>
                        </button>
                      )}
                      <span className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                      <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                      <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                      <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                    </div>
                  )}
                </div>

              </div>

              <ImageEditor
                slide={slide}
                onUpdateSlide={onUpdateSlide}
                selectedElement={selectedElement}
                setSelectedElement={setSelectedElement}
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
                updateElementStyle={updateElementStyle}
              />
            </div>
          ) : isCover ? (
            /* Traditional cover design */
            <div className="text-center flex flex-col items-center justify-center gap-3 py-[3%]">
              
              {/* TITLE INTERACTIVE BLOCK */}
              <div 
                onClick={(e) => { e.stopPropagation(); setSelectedElement("title"); }}
                className={`relative p-1.5 rounded-lg transition-all duration-150 max-w-[90%] cursor-text ${
                  selectedElement === "title" ? "border-2 border-dashed border-sky-500 shadow-xs animate-pulse" : "hover:bg-slate-50/10 hover:outline hover:outline-1 hover:outline-dashed hover:outline-slate-400"
                }`}
              >
                <input
                  type="text"
                  className="w-full bg-transparent border-none text-center outline-none font-serif font-extrabold tracking-tight leading-tight select-text focus:ring-0"
                  style={resolveStyles("title", { fontSize: "32px", color: colors.text })}
                  value={slide.title}
                  onChange={(e) => handleTextChange("title", e.target.value)}
                />
                {selectedElement === "title" && (
                  <>
                    <span className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                    <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                    <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                    <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                  </>
                )}
              </div>

              {/* HEADLINE INTERACTIVE BLOCK */}
              <div 
                onClick={(e) => { e.stopPropagation(); setSelectedElement("headline"); }}
                className={`relative p-1.5 rounded-lg transition-all duration-150 max-w-[80%] cursor-text ${
                  selectedElement === "headline" ? "border-2 border-dashed border-sky-500 shadow-xs animate-pulse" : "hover:bg-slate-50/10 hover:outline hover:outline-1 hover:outline-dashed hover:outline-slate-400"
                }`}
              >
                <input
                  type="text"
                  className="w-full bg-transparent border-none text-center outline-none font-sans italic leading-tight select-text focus:ring-0"
                  style={resolveStyles("headline", { fontSize: "14px", color: colors.secondary })}
                  value={slide.headline}
                  onChange={(e) => handleTextChange("headline", e.target.value)}
                />
                {selectedElement === "headline" && (
                  <>
                    <span className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                    <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                    <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                    <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                  </>
                )}
              </div>

              <div className="mt-4 flex gap-4 text-[9px] font-mono opacity-50 uppercase tracking-widest text-stone-500 font-bold pointer-events-none">
                <span>Topic Presentation Deck</span>
                <span>•</span>
                <span>Phoebe Design Co-Pilot</span>
              </div>
            </div>
          ) : isAgenda ? (
            /* Beautiful table of contents / roadmap agenda */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full items-center">
              
              <div className="flex flex-col gap-2">
                
                {/* TITLE INTERACTIVE BLOCK */}
                <div 
                  onClick={(e) => { e.stopPropagation(); setSelectedElement("title"); }}
                  className={`relative p-1 rounded-lg transition-all duration-150 cursor-text ${
                    selectedElement === "title" ? "border-2 border-dashed border-sky-500 shadow-xs animate-pulse" : "hover:bg-slate-50/10 hover:outline hover:outline-1 hover:outline-dashed hover:outline-slate-400"
                  }`}
                >
                  <input
                    type="text"
                    className="w-full bg-transparent border-none outline-none font-serif font-extrabold tracking-tight leading-tight select-text focus:ring-0"
                    style={resolveStyles("title", { fontSize: "24px", color: colors.text })}
                    value={slide.title}
                    onChange={(e) => handleTextChange("title", e.target.value)}
                  />
                  {selectedElement === "title" && (
                    <>
                      <span className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                      <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                      <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                      <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                    </>
                  )}
                </div>

                {/* HEADLINE INTERACTIVE BLOCK */}
                <div 
                  onClick={(e) => { e.stopPropagation(); setSelectedElement("headline"); }}
                  className={`relative p-1 rounded-lg transition-all duration-150 cursor-text ${
                    selectedElement === "headline" ? "border-2 border-dashed border-sky-500 shadow-xs animate-pulse" : "hover:bg-slate-50/10 hover:outline hover:outline-1 hover:outline-dashed hover:outline-slate-400"
                  }`}
                >
                  <input
                    type="text"
                    className="w-full bg-transparent border-none outline-none font-sans italic leading-tight select-text focus:ring-0"
                    style={resolveStyles("headline", { fontSize: "13px", color: colors.secondary })}
                    value={slide.headline}
                    onChange={(e) => handleTextChange("headline", e.target.value)}
                  />
                  {selectedElement === "headline" && (
                    <>
                      <span className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                      <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                      <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                      <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                    </>
                  )}
                </div>

              </div>

              {/* BULLETS INTERACTIVE BLOCK */}
              <div 
                onClick={(e) => { e.stopPropagation(); setSelectedElement("bullets"); }}
                className={`relative p-2 rounded-lg transition-all duration-150 border-l pl-4 md:pl-6 cursor-text ${
                  selectedElement === "bullets" ? "border-2 border-dashed border-sky-500 shadow-xs animate-pulse" : "hover:bg-slate-50/10 hover:outline hover:outline-1 hover:outline-dashed hover:outline-slate-400"
                }`}
                style={resolveStyles("bullets", { borderColor: colors.primary })}
              >
                <div className="flex flex-col gap-2.5">
                  {slide.bullets.map((bullet, idx) => (
                    <div key={idx} className="flex gap-2.5 items-center group/item py-0.5">
                      <span 
                        className="w-5.5 h-5.5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold"
                        style={{ backgroundColor: colors.primary + "15", color: colors.primary }}
                      >
                        0{idx + 1}
                      </span>
                      <input
                        type="text"
                        className="flex-1 bg-transparent border-none p-0 leading-normal outline-none focus:ring-0 text-slate-850 text-xs md:text-sm font-medium"
                        style={{ color: colors.text }}
                        value={bullet}
                        onChange={(e) => handleBulletTextChange(idx, e.target.value)}
                      />
                      {selectedElement === "bullets" && slide.bullets.length > 1 && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteBullet(idx); }}
                          className="opacity-0 group-hover/item:opacity-100 text-red-500 hover:text-red-600 text-[10px] font-bold px-1.5 transition cursor-pointer"
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {selectedElement === "bullets" && (
                  <div className="mt-3.5 flex justify-between items-center">
                    {slide.bullets.length < 5 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); addBulletPoint(); }}
                        className="text-[10px] text-sky-600 hover:text-sky-700 font-bold flex items-center gap-0.5 cursor-pointer bg-sky-50 hover:bg-sky-100 px-2 py-1 rounded-md border border-sky-200"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Agenda Item</span>
                      </button>
                    )}
                    <span className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                    <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                    <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                    <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                  </div>
                )}
              </div>

            </div>
          ) : hasChart ? (
            /* Simulated data analytics view */
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center h-full">
              
              <div className="md:col-span-3 flex flex-col justify-center gap-2">
                
                {/* TITLE INTERACTIVE BLOCK */}
                <div 
                  onClick={(e) => { e.stopPropagation(); setSelectedElement("title"); }}
                  className={`relative p-1 rounded-lg transition-all duration-150 cursor-text ${
                    selectedElement === "title" ? "border-2 border-dashed border-sky-500 shadow-xs animate-pulse" : "hover:bg-slate-50/10 hover:outline hover:outline-1 hover:outline-dashed hover:outline-slate-400"
                  }`}
                >
                  <input
                    type="text"
                    className="w-full bg-transparent border-none outline-none font-serif font-extrabold tracking-tight leading-tight select-text focus:ring-0"
                    style={resolveStyles("title", { fontSize: "22px", color: colors.text })}
                    value={slide.title}
                    onChange={(e) => handleTextChange("title", e.target.value)}
                  />
                  {selectedElement === "title" && (
                    <>
                      <span className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                      <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                      <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                      <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                    </>
                  )}
                </div>

                {/* HEADLINE INTERACTIVE BLOCK */}
                <div 
                  onClick={(e) => { e.stopPropagation(); setSelectedElement("headline"); }}
                  className={`relative p-1 rounded-lg transition-all duration-150 cursor-text ${
                    selectedElement === "headline" ? "border-2 border-dashed border-sky-500 shadow-xs animate-pulse" : "hover:bg-slate-50/10 hover:outline hover:outline-1 hover:outline-dashed hover:outline-slate-400"
                  }`}
                >
                  <input
                    type="text"
                    className="w-full bg-transparent border-none outline-none font-sans italic leading-tight select-text focus:ring-0"
                    style={resolveStyles("headline", { fontSize: "13px", color: colors.secondary })}
                    value={slide.headline}
                    onChange={(e) => handleTextChange("headline", e.target.value)}
                  />
                  {selectedElement === "headline" && (
                    <>
                      <span className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                      <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                      <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                      <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                    </>
                  )}
                </div>

                {/* BULLETS INTERACTIVE BLOCK */}
                <div 
                  onClick={(e) => { e.stopPropagation(); setSelectedElement("bullets"); }}
                  className={`relative p-1.5 rounded-lg transition-all duration-150 mt-1 cursor-text ${
                    selectedElement === "bullets" ? "border-2 border-dashed border-sky-500 shadow-xs animate-pulse" : "hover:bg-slate-50/10 hover:outline hover:outline-1 hover:outline-dashed hover:outline-slate-400"
                  }`}
                  style={resolveStyles("bullets", {})}
                >
                  <ul className="space-y-1.5">
                    {slide.bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs md:text-[13px] group/item">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors.primary }} />
                        <input
                          type="text"
                          className="flex-1 bg-transparent border-none p-0 leading-relaxed outline-none focus:ring-0 text-slate-850"
                          style={{ color: colors.text }}
                          value={bullet}
                          onChange={(e) => handleBulletTextChange(idx, e.target.value)}
                        />
                        {selectedElement === "bullets" && slide.bullets.length > 1 && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteBullet(idx); }}
                            className="opacity-0 group-hover/item:opacity-100 text-red-500 hover:text-red-600 text-[10px] font-bold px-1.5 transition cursor-pointer"
                          >
                            🗑
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                  {selectedElement === "bullets" && (
                    <div className="mt-2 flex justify-between items-center">
                      {slide.bullets.length < 5 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); addBulletPoint(); }}
                          className="text-[10px] text-sky-600 hover:text-sky-700 font-bold flex items-center gap-0.5 cursor-pointer bg-sky-50 hover:bg-sky-100 px-2 py-1 rounded-md border border-sky-200"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Key Point</span>
                        </button>
                      )}
                      <span className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                      <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                      <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                      <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                    </div>
                  )}
                </div>

              </div>

              {/* Abstract thematic analytics graphic visualization */}
              <div 
                className="md:col-span-2 aspect-square md:aspect-auto md:h-[130px] rounded-2xl flex flex-col justify-between p-3.5 border border-opacity-15 relative overflow-hidden bg-black/5"
                style={{ borderColor: colors.primary }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono tracking-wider opacity-60 uppercase font-bold">Trend Metrics</span>
                  <TrendingUp className="w-3.5 h-3.5" style={{ color: colors.primary }} />
                </div>
                <div className="flex items-end gap-2.5 h-[65px] px-2">
                  <div className="w-full bg-opacity-30 rounded-t-lg h-[40%]" style={{ backgroundColor: colors.secondary }} />
                  <div className="w-full bg-opacity-50 rounded-t-lg h-[65%]" style={{ backgroundColor: colors.primary }} />
                  <div className="w-full bg-opacity-25 rounded-t-lg h-[30%]" style={{ backgroundColor: colors.secondary }} />
                  <div className="w-full rounded-t-lg h-[85%]" style={{ backgroundColor: colors.primary }} />
                </div>
                <div className="flex justify-between text-[8px] font-mono opacity-60 font-bold">
                  <span>Performance</span>
                  <span>Growth Goal</span>
                </div>
              </div>

            </div>
          ) : (
            /* Core narrative bento-grid modular layout */
            <div className="flex flex-col gap-3 justify-center h-full">
              <div className="flex flex-col gap-1">
                
                {/* TITLE INTERACTIVE BLOCK */}
                <div 
                  onClick={(e) => { e.stopPropagation(); setSelectedElement("title"); }}
                  className={`relative p-1 rounded-lg transition-all duration-150 cursor-text ${
                    selectedElement === "title" ? "border-2 border-dashed border-sky-500 shadow-xs animate-pulse" : "hover:bg-slate-50/10 hover:outline hover:outline-1 hover:outline-dashed hover:outline-slate-400"
                  }`}
                >
                  <input
                    type="text"
                    className="w-full bg-transparent border-none outline-none font-serif font-extrabold tracking-tight leading-tight select-text focus:ring-0"
                    style={resolveStyles("title", { fontSize: "22px", color: colors.text })}
                    value={slide.title}
                    onChange={(e) => handleTextChange("title", e.target.value)}
                  />
                  {selectedElement === "title" && (
                    <>
                      <span className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                      <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                      <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                      <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                    </>
                  )}
                </div>

                {/* HEADLINE INTERACTIVE BLOCK */}
                <div 
                  onClick={(e) => { e.stopPropagation(); setSelectedElement("headline"); }}
                  className={`relative p-1 rounded-lg transition-all duration-150 cursor-text ${
                    selectedElement === "headline" ? "border-2 border-dashed border-sky-500 shadow-xs animate-pulse" : "hover:bg-slate-50/10 hover:outline hover:outline-1 hover:outline-dashed hover:outline-slate-400"
                  }`}
                >
                  <input
                    type="text"
                    className="w-full bg-transparent border-none outline-none font-sans italic leading-tight select-text focus:ring-0"
                    style={resolveStyles("headline", { fontSize: "13px", color: colors.secondary })}
                    value={slide.headline}
                    onChange={(e) => handleTextChange("headline", e.target.value)}
                  />
                  {selectedElement === "headline" && (
                    <>
                      <span className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                      <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                      <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                      <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                    </>
                  )}
                </div>

              </div>

              {/* BULLETS INTERACTIVE BLOCK */}
              <div 
                onClick={(e) => { e.stopPropagation(); setSelectedElement("bullets"); }}
                className={`relative p-2 rounded-lg transition-all duration-150 mt-1 cursor-text ${
                  selectedElement === "bullets" ? "border-2 border-dashed border-sky-500 shadow-xs animate-pulse" : "hover:bg-slate-50/10 hover:outline hover:outline-1 hover:outline-dashed hover:outline-slate-400"
                }`}
                style={resolveStyles("bullets", {})}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {slide.bullets.map((bullet, idx) => (
                    <div 
                      key={idx} 
                      className="p-3.5 rounded-2xl border border-opacity-10 bg-black/5 flex items-start gap-2.5 relative group/item"
                      style={{ borderColor: colors.secondary }}
                    >
                      <span 
                        className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0"
                        style={{ backgroundColor: colors.primary + "15", color: colors.primary }}
                      >
                        ✓
                      </span>
                      <textarea
                        className="flex-1 bg-transparent border-none p-0 text-xs leading-relaxed outline-none focus:ring-0 text-slate-850 resize-none h-11"
                        style={{ color: colors.text }}
                        value={bullet}
                        onChange={(e) => handleBulletTextChange(idx, e.target.value)}
                      />
                      {selectedElement === "bullets" && slide.bullets.length > 1 && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteBullet(idx); }}
                          className="absolute right-2 top-2 opacity-0 group-hover/item:opacity-100 text-red-500 hover:text-red-600 text-[10px] font-bold p-1 cursor-pointer transition"
                          title="Delete Item"
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {selectedElement === "bullets" && (
                  <div className="mt-3.5 flex justify-between items-center">
                    {slide.bullets.length < 5 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); addBulletPoint(); }}
                        className="text-[10px] text-sky-600 hover:text-sky-700 font-bold flex items-center gap-0.5 cursor-pointer bg-sky-50 hover:bg-sky-100 px-2 py-1 rounded-md border border-sky-200"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Bento Bullet Block</span>
                      </button>
                    )}
                    <span className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                    <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                    <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                    <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Dynamic Selection Rotation control handle trigger underneath active elements (Mockup circular refresh rotating anchor) */}
        {selectedElement && (
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 animate-in fade-in zoom-in duration-200 z-10 flex flex-col items-center gap-1">
            <button
              onClick={handleRotationClick}
              className="w-10 h-10 rounded-full bg-white shadow-xl hover:shadow-2xl border border-slate-200 hover:scale-110 flex items-center justify-center transition text-slate-700 hover:text-sky-600 cursor-pointer"
              title="Rotate layout slightly to improve visual flow"
            >
              <RefreshCw className="w-5 h-5 text-sky-600 font-black animate-spin-slow" />
            </button>
            <span className="text-[9px] bg-slate-900/95 text-white font-mono rounded-md px-1.5 py-0.5 tracking-tight">
              Rotate: {activeStyle.rotation || 0}°
            </span>
          </div>
        )}

        {/* Slide Footer */}
        <div className="flex justify-between items-center border-t border-opacity-10 pt-2 text-[8px] md:text-[10px] font-mono opacity-50 font-bold pointer-events-none">
          <span>{theme.narrativeAngle.split(" ").slice(0, 4).join(" ")}...</span>
          <span className="uppercase tracking-widest">Outline Architect Draft</span>
        </div>
      </div>
    </div>
  );
}
