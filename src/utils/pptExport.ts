import pptxgen from "pptxgenjs";
import { Slide, PresentationTheme } from "../types";

export async function exportToPPTX(slides: Slide[], theme: PresentationTheme) {
  const cleanColor = (hex: string) => {
    if (!hex) return "FFFFFF";
    return hex.replace("#", "").trim();
  };

  const generate = async (includeImages: boolean) => {
    const pptx = new pptxgen();

    // Set aspect ratio to widescreen (16:9)
    pptx.layout = "LAYOUT_16X9";

    const colors = theme?.colorPalette || {
      background: "#ffffff",
      text: "#000000",
      primary: "#0ea5e9",
      secondary: "#64748b"
    };

    slides.forEach((slide) => {
      const pptSlide = pptx.addSlide();

      // Slide background - CORRECTED: use "color" instead of "fill"
      pptSlide.background = { color: cleanColor(colors.background) };

      // Small theme label at the top
      pptSlide.addText(theme.name.toUpperCase(), {
        x: 0.5,
        y: 0.3,
        w: "90%",
        h: 0.3,
        fontSize: 10,
        fontFace: "Arial",
        color: cleanColor(colors.secondary),
        align: "left"
      });

      const isCover = slide.number === 1 || slide.title.toLowerCase().includes("title") || slide.title.toLowerCase().includes("welcome");

      if (isCover) {
        // Elegant Cover slide layout with visual divider
        pptSlide.addText(slide.title, {
          x: 1.0,
          y: 2.0,
          w: 11.3,
          h: 1.8,
          fontSize: 36,
          fontFace: "Arial",
          color: cleanColor(colors.text),
          bold: true,
          align: "center"
        });

        pptSlide.addText(slide.headline, {
          x: 1.5,
          y: 4.0,
          w: 10.3,
          h: 1.0,
          fontSize: 16,
          fontFace: "Arial",
          color: cleanColor(colors.primary),
          italic: true,
          align: "center"
        });
      } else {
        // Content slide title and key takeaway headline
        pptSlide.addText(slide.title, {
          x: 0.5,
          y: 0.8,
          w: 12.3,
          h: 0.6,
          fontSize: 24,
          fontFace: "Arial",
          color: cleanColor(colors.text),
          bold: true
        });

        pptSlide.addText(slide.headline, {
          x: 0.5,
          y: 1.4,
          w: 12.3,
          h: 0.4,
          fontSize: 12,
          fontFace: "Arial",
          color: cleanColor(colors.primary),
          italic: true
        });

        // Bullets section (Left side) - CORRECTED: use simple bullet: true
        const bulletObjects = slide.bullets.map((bulletText) => {
          return { 
            text: bulletText, 
            options: { 
              bullet: true, 
              indentLevel: 0, 
              color: cleanColor(colors.text), 
              fontSize: 14 
            } 
          };
        });

        if (bulletObjects.length > 0) {
          pptSlide.addText(bulletObjects, {
            x: 0.5,
            y: 2.0,
            w: 7.0,
            h: 4.5,
            fontFace: "Arial",
            lineSpacing: 24
          });
        }

        if (includeImages && slide.useImageOnSlide && slide.conceptImage) {
          // Add actual image on the right side
          pptSlide.addImage({
            path: slide.conceptImage,
            x: 8.0,
            y: 2.0,
            w: 4.8,
            h: 4.5
          });
        } else {
          // Sidebar visual concept placeholder (Right side)
          // Visual box shape - CORRECTED: use transparency: 90 instead of 8-character hex
          pptSlide.addShape("rect", {
            x: 8.0,
            y: 2.0,
            w: 4.8,
            h: 4.5,
            fill: { color: cleanColor(colors.primary), transparency: 90 },
            line: { color: cleanColor(colors.primary), width: 1 }
          });

          // Visual text
          pptSlide.addText("VISUAL DIRECTIVE:\n\n" + slide.visualSuggestion, {
            x: 8.2,
            y: 2.2,
            w: 4.4,
            h: 4.1,
            fontSize: 11,
            fontFace: "Courier New",
            color: cleanColor(colors.text)
          });
        }
      }

      // Set notes
      if (slide.speakerNotes) {
        pptSlide.addNotes(slide.speakerNotes);
      }
    });

    // Save/Download presentation file
    const outputName = `${theme.name.replace(/\s+/g, "_")}_Presentation.pptx`;
    await pptx.writeFile({ fileName: outputName });
  };

  try {
    // Attempt generation with slide-level images
    await generate(true);
  } catch (error) {
    console.warn("PowerPoint generation failed with custom slide images (possibly due to CORS or image download errors). Retrying with placeholder visual guides...", error);
    // Fallback generation to guarantee file is downloaded
    await generate(false);
  }
}

export async function exportToPPTXBlob(slides: Slide[], theme: PresentationTheme): Promise<Blob> {
  const cleanColor = (hex: string) => {
    if (!hex) return "FFFFFF";
    return hex.replace("#", "").trim();
  };

  const generate = async (includeImages: boolean): Promise<Blob> => {
    const pptx = new pptxgen();
    pptx.layout = "LAYOUT_16X9";

    const colors = theme?.colorPalette || {
      background: "#ffffff",
      text: "#000000",
      primary: "#0ea5e9",
      secondary: "#64748b"
    };

    slides.forEach((slide) => {
      const pptSlide = pptx.addSlide();
      pptSlide.background = { color: cleanColor(colors.background) };

      pptSlide.addText(theme.name.toUpperCase(), {
        x: 0.5,
        y: 0.3,
        w: "90%",
        h: 0.3,
        fontSize: 10,
        fontFace: "Arial",
        color: cleanColor(colors.secondary),
        align: "left"
      });

      const isCover = slide.number === 1 || slide.title.toLowerCase().includes("title") || slide.title.toLowerCase().includes("welcome");

      if (isCover) {
        pptSlide.addText(slide.title, {
          x: 1.0,
          y: 2.0,
          w: 11.3,
          h: 1.8,
          fontSize: 36,
          fontFace: "Arial",
          color: cleanColor(colors.text),
          bold: true,
          align: "center"
        });

        pptSlide.addText(slide.headline, {
          x: 1.5,
          y: 4.0,
          w: 10.3,
          h: 1.0,
          fontSize: 16,
          fontFace: "Arial",
          color: cleanColor(colors.primary),
          italic: true,
          align: "center"
        });
      } else {
        pptSlide.addText(slide.title, {
          x: 0.5,
          y: 0.8,
          w: 12.3,
          h: 0.6,
          fontSize: 24,
          fontFace: "Arial",
          color: cleanColor(colors.text),
          bold: true
        });

        pptSlide.addText(slide.headline, {
          x: 0.5,
          y: 1.4,
          w: 12.3,
          h: 0.4,
          fontSize: 12,
          fontFace: "Arial",
          color: cleanColor(colors.primary),
          italic: true
        });

        const bulletObjects = slide.bullets.map((bulletText) => {
          return { 
            text: bulletText, 
            options: { 
              bullet: true, 
              indentLevel: 0, 
              color: cleanColor(colors.text), 
              fontSize: 14 
            } 
          };
        });

        if (bulletObjects.length > 0) {
          pptSlide.addText(bulletObjects, {
            x: 0.5,
            y: 2.0,
            w: 7.0,
            h: 4.5,
            fontFace: "Arial",
            lineSpacing: 24
          });
        }

        if (includeImages && slide.useImageOnSlide && slide.conceptImage) {
          pptSlide.addImage({
            path: slide.conceptImage,
            x: 8.0,
            y: 2.0,
            w: 4.8,
            h: 4.5
          });
        } else {
          pptSlide.addShape("rect", {
            x: 8.0,
            y: 2.0,
            w: 4.8,
            h: 4.5,
            fill: { color: cleanColor(colors.primary), transparency: 90 },
            line: { color: cleanColor(colors.primary), width: 1 }
          });

          pptSlide.addText("VISUAL DIRECTIVE:\n\n" + slide.visualSuggestion, {
            x: 8.2,
            y: 2.2,
            w: 4.4,
            h: 4.1,
            fontSize: 11,
            fontFace: "Courier New",
            color: cleanColor(colors.text)
          });
        }
      }

      if (slide.speakerNotes) {
        pptSlide.addNotes(slide.speakerNotes);
      }
    });

    const result = await pptx.write({ outputType: "blob" });
    return result as Blob;
  };

  try {
    return await generate(true);
  } catch (error) {
    console.warn("PPTX Blob generation with images failed, retrying with placeholder templates...", error);
    return await generate(false);
  }
}
