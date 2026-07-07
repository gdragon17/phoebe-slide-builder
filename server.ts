import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import pptxgenjsModule from "pptxgenjs";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Route to serve firebase applet configuration if present
app.get("/firebase-applet-config.json", (req, res) => {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    res.sendFile(configPath);
  } else {
    res.status(404).json({ error: "Firebase configuration is not generated yet." });
  }
});

// Initialize Gemini API client lazily
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. Analyze prompt to extract Topic, Audience, Goal and suggest themes + clarifying questions
app.post("/api/presentation/analyze", async (req, res) => {
  try {
    const { prompt, topic, audience, goal } = req.body;
    
    if (!prompt && !topic) {
      return res.status(400).json({ error: "Missing prompt or topic information" });
    }

    const ai = getAiClient();
    const systemInstruction = `You are a master presentation strategist, storyboard designer, and elite narrative consultant.
Your job is to analyze the user's initial presentation idea, prompt, or raw data, and extract three core elements:
1. Topic (What the presentation is about)
2. Target Audience (Who is listening and what they care about)
3. Primary Goal (The desired takeaway or action)

Determine if the provided input is highly detailed (isDetailed: true) or if it's vague/vague (isDetailed: false).
- If it's vague or missing any of the 3 core elements, generate 1 to 2 very brief, highly targeted clarifying questions to ask the user.
- If it's already highly detailed, do not formulate questions (keep the questions array empty).

Additionally, propose exactly 3 distinct, compelling narrative and visual themes tailored to this topic, audience, and goal.
Each theme must have:
- Theme Name (e.g., "The Data-Driven Vision", "The Human Connection", "The Bold Leap")
- Visual Style Idea (detailed visual notes on layout, typography, visual weight, and style)
- Narrative Angle (how the story flows and builds tension/excitement)
- Color Palette: Suggest a highly polished hex color palette matching the theme containing:
  - primary: Accent color
  - secondary: Sub-accent color
  - background: Base slide background color (light or dark, optimized for readability)
  - text: Main typography color

Format your response strictly as a JSON object matching the requested schema.`;

    const contents = `User Prompt/Idea: "${prompt || ""}"
Current structured inputs if any:
Topic: "${topic || ""}"
Audience: "${audience || ""}"
Goal: "${goal || ""}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING, description: "Extracted or refined presentation topic" },
            audience: { type: Type.STRING, description: "Identified target audience" },
            goal: { type: Type.STRING, description: "Primary goal or outcome of the presentation" },
            isDetailed: { type: Type.BOOLEAN, description: "True if prompt is comprehensive, false if vague/vague and needs clarifying questions" },
            clarifyingQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "1 to 2 brief, highly targeted questions to gather missing context. Empty if isDetailed is true."
            },
            themes: {
              type: Type.ARRAY,
              description: "Exactly 3 distinct narrative & visual themes",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "Unique identifier for the theme, e.g. theme-data" },
                  name: { type: Type.STRING, description: "Compelling name of the theme" },
                  visualStyle: { type: Type.STRING, description: "Creative visual style suggestion" },
                  narrativeAngle: { type: Type.STRING, description: "Narrative hook and storytelling flow" },
                  colorPalette: {
                    type: Type.OBJECT,
                    properties: {
                      primary: { type: Type.STRING, description: "Hex color for accents, e.g. #3B82F6" },
                      secondary: { type: Type.STRING, description: "Hex color for details/borders, e.g. #10B981" },
                      background: { type: Type.STRING, description: "Hex color for slide background, e.g. #F8FAFC or #0F172A" },
                      text: { type: Type.STRING, description: "Hex color for primary text, e.g. #0F172A or #F8FAFC" }
                    },
                    required: ["primary", "secondary", "background", "text"]
                  }
                },
                required: ["id", "name", "visualStyle", "narrativeAngle", "colorPalette"]
              }
            }
          },
          required: ["topic", "audience", "goal", "isDetailed", "clarifyingQuestions", "themes"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Error in /api/presentation/analyze:", error);
    res.status(500).json({ error: error.message || "Failed to analyze prompt" });
  }
});

// 2. Generate Slides Draft based on chosen theme and narrative context
app.post("/api/presentation/generate-slides", async (req, res) => {
  try {
    const { topic, audience, goal, chosenTheme, additionalNotes } = req.body;

    const finalTopic = topic || "New Presentation Outline";
    if (!chosenTheme) {
      return res.status(400).json({ error: "Missing required theme details" });
    }

    // Defensive parsing with default fallbacks to prevent nested TypeErrors
    const themeName = chosenTheme.name || "Modern Minimalist";
    const themeAngle = chosenTheme.narrativeAngle || "Straightforward narrative hook";
    const themeStyle = chosenTheme.visualStyle || "Clean and structured visual layout";
    const primaryColor = chosenTheme.colorPalette?.primary || "#3B82F6";
    const secondaryColor = chosenTheme.colorPalette?.secondary || "#10B981";
    const bgColor = chosenTheme.colorPalette?.background || "#F8FAFC";
    const textColor = chosenTheme.colorPalette?.text || "#0F172A";

    const ai = getAiClient();
    const systemInstruction = `You are a world-class presentation designer and slide writer.
Your goal is to write a highly structured, compelling slide-by-slide presentation deck.

Topic: ${finalTopic}
Target Audience: ${audience || "General Audience"}
Primary Goal: ${goal || "To inform and engage"}
Chosen Theme: ${themeName}
Narrative Angle: ${themeAngle}
Visual Style: ${themeStyle}

Create an outline of exactly 6 to 8 highly optimized, engaging slides.
Follow these professional guidelines:
- Slide 1 must be a beautiful, high-impact Title Slide.
- Slide 2 must be an Agenda or Narrative Journey roadmap.
- Mid-slides (Slides 3 to 6 or 7) MUST focus entirely on the concrete concept offered and provide the absolute BEST strategic and actionable solution for the client's issue.
- Under NO circumstances should you include or show any past case studies or historical retrospectives. Focus 100% on immediate strategic forward-looking solutions, implementation blueprints, value generation, and target outcomes for the client.
- The final slide must be a high-impact Call to Action or Conclusion/Next Steps.
- Keep bullet points incredibly brief and punchy. Avoid walls of text. Max 4 points per slide.
- For each slide, write specific, highly tailored visual layout instructions and chart suggestions based on the theme's color palette (background: ${bgColor}, text: ${textColor}, accent: ${primaryColor}).
- Write descriptive, high-value Speaker Notes to help the presenter shine.

Format your response strictly as a JSON object matching the requested schema.`;

    const contents = `Create the slide deck draft now. Additional inputs from user: "${additionalNotes || ""}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            slides: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  number: { type: Type.INTEGER, description: "Slide sequence index" },
                  title: { type: Type.STRING, description: "Compelling slide header" },
                  headline: { type: Type.STRING, description: "A single, punchy takeaway sentence summarizing the main point of this slide" },
                  bullets: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Short bullets/content blocks. Max 4 items."
                  },
                  visualSuggestion: { type: Type.STRING, description: "Highly specific instructions for visual elements, layout, or chart structure" },
                  speakerNotes: { type: Type.STRING, description: "Professional voiceover notes for the speaker" }
                },
                required: ["number", "title", "headline", "bullets", "visualSuggestion", "speakerNotes"]
              }
            }
          },
          required: ["slides"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Error in /api/presentation/generate-slides:", error);
    res.status(500).json({ error: error.message || "Failed to generate slides" });
  }
});

// 3. Refine or modify slides with user chat or commands
async function generateImageAndExplanation(title: string, headline: string, visualSuggestion: string, themeStyle: string) {
  const ai = getAiClient();
  
  // Create a highly descriptive prompt for the image generation model
  const imagePrompt = `A premium professional minimalist slide presentation concept image or abstract technical visual diagram representing the topic "${title || 'Concept'}". Headline focus: "${headline || 'Visual outline'}". Style instructions: "${visualSuggestion || 'Clean layout'}". The graphic should be high-contrast, modern vector style or subtle sleek 3D graphic, using a clean color scheme. No text, no watermarks, clear and professional layout.`;

  let imageUrl = null;
  let conceptExplanation = "";

  // Generate description / concept explanation first using the robust gemini-3.5-flash
  try {
    const explainResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are an elite creative design director. Given a presentation slide titled "${title || 'Slide'}" with the headline "${headline || ''}" and visual suggestion guidelines "${visualSuggestion || ''}", write a concise creative explanation of the visual solution.
Explain:
- Core Symbolism (why this layout or image is chosen to communicate the key message)
- Color Strategy & Composition (use of negative space, primary and secondary accents)
Keep the description highly technical, professional, elegant, and concise. Formulate as 2 to 3 bullet points. No conversational filler.`,
    });
    conceptExplanation = explainResponse.text || "Visual mockup solution representing the core slide strategy.";
  } catch (err) {
    console.error("Failed to generate concept explanation text:", err);
    conceptExplanation = "A high-impact conceptual design representing the key message of the slide.";
  }

  // Attempt to generate the base64 image using gemini-3.1-flash-lite-image
  try {
    const imageResponse = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-image",
      contents: {
        parts: [
          {
            text: imagePrompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    if (imageResponse.candidates?.[0]?.content?.parts) {
      for (const part of imageResponse.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }
    }
  } catch (imageErr: any) {
    console.warn("Gemini image generation model failed or is not available. Falling back to curated Unsplash visual concept.", imageErr.message);
  }

  // If Gemini Image API fails (e.g. key doesn't support paid models yet), fall back to curated high-quality context-specific Unsplash photos
  if (!imageUrl) {
    const keywords = `${title} ${headline} ${visualSuggestion}`.toLowerCase();
    let photoId = "1557804506-669a67965ba0"; // Default: modern sleek business abstract
    
    if (keywords.includes("tech") || keywords.includes("ai") || keywords.includes("cyber") || keywords.includes("code") || keywords.includes("data") || keywords.includes("algorithm")) {
      photoId = "1518770660439-4636190af475"; // abstract networking/circuit
    } else if (keywords.includes("agenda") || keywords.includes("roadmap") || keywords.includes("plan") || keywords.includes("journey") || keywords.includes("timeline")) {
      photoId = "1507842217343-583bb7270b66"; // library path/milestones
    } else if (keywords.includes("chart") || keywords.includes("growth") || keywords.includes("market") || keywords.includes("finance") || keywords.includes("trend") || keywords.includes("money")) {
      photoId = "1460925895917-afdab827c52f"; // charts/metrics sketches
    } else if (keywords.includes("people") || keywords.includes("team") || keywords.includes("human") || keywords.includes("social") || keywords.includes("collaboration") || keywords.includes("service")) {
      photoId = "1522071820081-009f0129c71c"; // premium team meeting
    } else if (keywords.includes("concept") || keywords.includes("ideas") || keywords.includes("vision") || keywords.includes("creative") || keywords.includes("spark")) {
      photoId = "1457369804613-52c61a468e7d"; // abstract splash/spark
    } else if (keywords.includes("thank") || keywords.includes("questions") || keywords.includes("end") || keywords.includes("contact") || keywords.includes("conclusion") || keywords.includes("closing")) {
      photoId = "1516321318423-f06f85e504b3"; // welcoming laptop/workspace
    } else {
      const fallbackUrls = [
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&h=675&q=80",
        "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&h=675&q=80",
        "https://images.unsplash.com/photo-1502691876148-a89975787081?auto=format&fit=crop&w=1200&h=675&q=80"
      ];
      imageUrl = fallbackUrls[Math.abs(title.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)) % fallbackUrls.length];
    }

    if (imageUrl && !imageUrl.startsWith("http")) {
      imageUrl = `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1200&h=675&q=80`;
    }
  }

  return { imageUrl, conceptExplanation };
}

app.post("/api/presentation/refine", async (req, res) => {
  try {
    const { slides, instruction, topic, audience, goal, chosenTheme } = req.body;

    if (!slides || !instruction) {
      return res.status(400).json({ error: "Missing slides or instruction" });
    }

    const ai = getAiClient();
    const systemInstruction = `You are a master presentation co-pilot named Phoebe. The user has a draft slide deck and wants to refine, modify, edit, add, or delete slides based on their instruction.
You must return the COMPLETE updated list of slides.

CRITICAL: If the user asks you to edit the content of a slide (such as changing the title, headline, bullets, or speaker notes of a specific slide), you must apply their request EXACTLY. Do not refuse, do not make up unrelated content, and do not ignore their text edits. If they ask to edit slide content, apply their modifications word-for-word or in the exact direction requested.

Context:
Topic: ${topic || ""}
Audience: ${audience || ""}
Goal: ${goal || ""}
Theme: ${chosenTheme?.name || ""}

Current slides list:
${JSON.stringify(slides, null, 2)}

User's instruction:
"${instruction}"

Analyze the user's instruction:
- If they ask to add a slide, insert a highly relevant new slide with correct sequential numbering.
- If they ask to delete a slide, remove it and re-index the slide numbers.
- If they ask to edit slide content, change specific details, rewrite titles, headlines, bullets, speaker notes, or visual suggestions of any slide, do so exactly as requested.
- If they ask to edit, change, or regenerate the image, illustration, graphic, or visual concept of any slide, modify the "visualSuggestion" to reflect their new image request, and set the "regenerateImage" flag to true in the JSON response.
- Ensure the slides focus entirely on the concrete concept offered and provide the absolute BEST strategic and actionable solution for the client's issue.
- Keep bullet points brief (max 4). Keep visual suggestions and speaker notes tailored.

If the user explicitly asks to edit, change, or regenerate the image, illustration, graphic, or visual concept of any slide, or if a slide is newly added, set the corresponding "regenerateImage" flag to true in your JSON response for that slide so the backend can generate a new image matching the new context.
If a slide already has a "conceptImage", you should preserve it exactly in the "conceptImage" field unless the user wants to change/edit it (in which case, set "regenerateImage" to true and leave "conceptImage" empty).

Format your response strictly as a JSON object matching the requested schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Apply the requested modifications and return the updated slide deck structure.",
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            slides: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  number: { type: Type.INTEGER, description: "Slide sequence index" },
                  title: { type: Type.STRING, description: "Compelling slide header" },
                  headline: { type: Type.STRING, description: "A single, punchy takeaway sentence" },
                  bullets: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Short bullets/content blocks. Max 4 items."
                  },
                  visualSuggestion: { type: Type.STRING, description: "Specific instructions for visual elements" },
                  speakerNotes: { type: Type.STRING, description: "Speaker voiceover notes" },
                  conceptImage: { type: Type.STRING, description: "The existing conceptImage string. Keep it exactly as-is unless regenerating." },
                  conceptExplanation: { type: Type.STRING, description: "The existing conceptExplanation. Keep it exactly as-is unless regenerating." },
                  useImageOnSlide: { type: Type.BOOLEAN, description: "Whether this slide uses the image directly. Keep it exactly as-is unless requested otherwise." },
                  regenerateImage: { type: Type.BOOLEAN, description: "Set to true if the user's instruction explicitly asks to change, edit, or regenerate the image/illustration for this slide, or if this is a newly added slide that needs an illustration." }
                },
                required: ["number", "title", "headline", "bullets", "visualSuggestion", "speakerNotes"]
              }
            }
          },
          required: ["slides"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    const returnedSlides = parsedData.slides || [];

    // Simple matching function to copy over previous image data if not being regenerated
    function findMatchingOriginalSlide(newSlide: any, originalSlides: any[]) {
      // 1. Try matching slide title
      const titleMatch = originalSlides.find(
        (s) => s.title && s.title.toLowerCase().trim() === newSlide.title.toLowerCase().trim()
      );
      if (titleMatch) return titleMatch;

      // 2. Try matching slide number
      const numberMatch = originalSlides.find((s) => s.number === newSlide.number);
      if (numberMatch) return numberMatch;

      return null;
    }

    const isImageRequest = /image|picture|photo|graphic|illustration|visual|logo|sketch|drawing|unsplash|regenerate|redraw|draw/i.test(instruction);

    // Process each returned slide
    for (const newSlide of returnedSlides) {
      const matchedOrig = findMatchingOriginalSlide(newSlide, slides);

      // Check if the visual suggestion description actually changed
      const visualSuggestionChanged = matchedOrig && 
        newSlide.visualSuggestion && 
        matchedOrig.visualSuggestion && 
        newSlide.visualSuggestion.toLowerCase().trim() !== matchedOrig.visualSuggestion.toLowerCase().trim();

      const shouldRegenerate =
        newSlide.regenerateImage === true ||
        (isImageRequest && visualSuggestionChanged) ||
        (newSlide.useImageOnSlide && !newSlide.conceptImage && (!matchedOrig || !matchedOrig.conceptImage));

      if (shouldRegenerate) {
        console.log(`[Copilot Refinement] Generating new illustration for Slide ${newSlide.number}: "${newSlide.title}"`);
        try {
          const { imageUrl, conceptExplanation } = await generateImageAndExplanation(
            newSlide.title,
            newSlide.headline,
            newSlide.visualSuggestion,
            chosenTheme?.colorPalette ? `${chosenTheme.name} style` : ""
          );
          newSlide.conceptImage = imageUrl;
          newSlide.conceptExplanation = conceptExplanation;
          newSlide.useImageOnSlide = true; // Automatically turn on slide image display
        } catch (genErr) {
          console.error("Failed to generate image in refine:", genErr);
          if (matchedOrig) {
            newSlide.conceptImage = matchedOrig.conceptImage;
            newSlide.conceptExplanation = matchedOrig.conceptExplanation;
            newSlide.useImageOnSlide = matchedOrig.useImageOnSlide;
          }
        }
      } else {
        // Carry over original attributes
        if (matchedOrig) {
          const isInvalidImage = !newSlide.conceptImage || 
                                 newSlide.conceptImage === "" || 
                                 newSlide.conceptImage.toLowerCase().includes("keep") || 
                                 newSlide.conceptImage.toLowerCase().includes("original") ||
                                 newSlide.conceptImage.toLowerCase().includes("as-is");

          if (isInvalidImage && matchedOrig.conceptImage) {
            newSlide.conceptImage = matchedOrig.conceptImage;
          }

          const isInvalidExplanation = !newSlide.conceptExplanation || 
                                       newSlide.conceptExplanation === "" || 
                                       newSlide.conceptExplanation.toLowerCase().includes("keep") || 
                                       newSlide.conceptExplanation.toLowerCase().includes("original") ||
                                       newSlide.conceptExplanation.toLowerCase().includes("as-is");

          if (isInvalidExplanation && matchedOrig.conceptExplanation) {
            newSlide.conceptExplanation = matchedOrig.conceptExplanation;
          }

          if (newSlide.useImageOnSlide === undefined && matchedOrig.useImageOnSlide !== undefined) {
            newSlide.useImageOnSlide = matchedOrig.useImageOnSlide;
          }
        }
      }

      // Cleanup internal flag
      delete newSlide.regenerateImage;
    }

    res.json({ slides: returnedSlides });
  } catch (error: any) {
    console.error("Error in /api/presentation/refine:", error);
    res.status(500).json({ error: error.message || "Failed to refine slides" });
  }
});

// 4. Generate Image Visual Concept & Explanation for slides (single click)
app.post("/api/presentation/generate-image", async (req, res) => {
  try {
    const { title, headline, visualSuggestion, themeStyle } = req.body;
    const { imageUrl, conceptExplanation } = await generateImageAndExplanation(title, headline, visualSuggestion, themeStyle);
    res.json({ imageUrl, conceptExplanation });
  } catch (error: any) {
    console.error("Error in /api/presentation/generate-image:", error);
    res.status(500).json({ error: error.message || "Failed to generate visual concept solution" });
  }
});

type DeckTemplate = {
  id: string;
  name: string;
  background: string;
  surface: string;
  panel: string;
  text: string;
  muted: string;
  accent: string;
  secondary: string;
  bullet: string;
  titleFont: string;
  bodyFont: string;
};

const deckTemplates: Record<string, DeckTemplate> = {
  executiveDark: {
    id: "executiveDark",
    name: "Executive Dark",
    background: "0B1220",
    surface: "101B2D",
    panel: "0F2740",
    text: "FFFFFF",
    muted: "94A3B8",
    accent: "22D3EE",
    secondary: "38BDF8",
    bullet: "FF007F",
    titleFont: "Georgia",
    bodyFont: "Aptos",
  },
  cleanWhite: {
    id: "cleanWhite",
    name: "Clean White",
    background: "F8FAFC",
    surface: "FFFFFF",
    panel: "E0F2FE",
    text: "0F172A",
    muted: "64748B",
    accent: "2563EB",
    secondary: "0EA5E9",
    bullet: "475569",
    titleFont: "Aptos Display",
    bodyFont: "Aptos",
  },
  neonPitch: {
    id: "neonPitch",
    name: "Neon Pitch",
    background: "130A2A",
    surface: "1E1140",
    panel: "251254",
    text: "FFFFFF",
    muted: "C4B5FD",
    accent: "A3FF12",
    secondary: "7C3AED",
    bullet: "FF2E88",
    titleFont: "Aptos Display",
    bodyFont: "Aptos",
  },
};

function chooseDeckTemplate(requestedTemplate?: string): DeckTemplate {
  return deckTemplates[requestedTemplate || ""] || deckTemplates.executiveDark;
}

function safeText(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim() || fallback;
}

function slideNumber(index: number) {
  return String(index + 1).padStart(2, "0");
}

function addDeckChrome(slide: any, template: DeckTemplate, index: number, label = "STRATEGIC OUTLINE") {
  slide.addText(label, {
    x: 0.62,
    y: 0.43,
    w: 3.4,
    h: 0.24,
    fontFace: template.bodyFont,
    fontSize: 9,
    bold: true,
    charSpace: 2.2,
    color: template.muted,
    margin: 0,
  });

  slide.addText(slideNumber(index), {
    x: 12.12,
    y: 0.42,
    w: 0.55,
    h: 0.24,
    fontFace: template.bodyFont,
    fontSize: 10,
    bold: true,
    color: template.muted,
    align: "right",
    margin: 0,
  });

  slide.addShape("line", {
    x: 0.62,
    y: 6.72,
    w: 12.08,
    h: 0,
    line: { color: template.muted, transparency: 55, width: 0.7 },
  });

  slide.addText("OUTLINE ARCHITECT DRAFT", {
    x: 9.6,
    y: 6.92,
    w: 3.1,
    h: 0.24,
    fontFace: template.bodyFont,
    fontSize: 8,
    bold: true,
    charSpace: 1.9,
    color: template.muted,
    align: "right",
    margin: 0,
  });
}

function addVisualPanel(slide: any, template: DeckTemplate, item: any) {
  slide.addShape("rect", {
    x: 7.45,
    y: 1.55,
    w: 5.05,
    h: 4.65,
    fill: { color: template.surface },
    line: { color: template.accent, transparency: 75, width: 1.1 },
  });

  slide.addShape("rect", {
    x: 7.78,
    y: 1.88,
    w: 4.39,
    h: 4.0,
    fill: { color: template.panel, transparency: 8 },
    line: { color: template.muted, transparency: 82, width: 0.7 },
  });

  for (let i = 0; i < 4; i += 1) {
    slide.addShape("ellipse", {
      x: 8.02 + i * 0.86,
      y: 2.18 + (i % 2) * 0.42,
      w: 0.38,
      h: 0.38,
      fill: { color: i % 2 === 0 ? template.accent : template.bullet, transparency: 12 },
      line: { color: i % 2 === 0 ? template.accent : template.bullet, transparency: 35 },
    });
  }

  slide.addShape("line", {
    x: 8.2,
    y: 3.25,
    w: 3.6,
    h: 0,
    line: { color: template.accent, transparency: 25, width: 1.2 },
  });
  slide.addShape("line", {
    x: 8.2,
    y: 3.58,
    w: 2.65,
    h: 0,
    line: { color: template.bullet, transparency: 30, width: 1.2 },
  });
  slide.addShape("line", {
    x: 8.2,
    y: 3.91,
    w: 3.05,
    h: 0,
    line: { color: template.secondary, transparency: 30, width: 1.2 },
  });

  slide.addText("VISUAL DIRECTION", {
    x: 8.18,
    y: 4.55,
    w: 3.8,
    h: 0.22,
    fontFace: template.bodyFont,
    fontSize: 7,
    bold: true,
    charSpace: 1.6,
    color: template.accent,
    margin: 0,
  });

  slide.addText(safeText(item.visualSuggestion, "Use a bold editorial visual, diagram, or metaphor that clarifies the core message."), {
    x: 8.18,
    y: 4.86,
    w: 3.6,
    h: 0.74,
    fontFace: template.bodyFont,
    fontSize: 8.2,
    color: template.muted,
    breakLine: false,
    fit: "shrink",
    valign: "top",
    margin: 0,
  });
}

function addCoverSlide(pptx: any, template: DeckTemplate, topic: string, slides: any[], audience?: string) {
  const slide = pptx.addSlide();
  slide.background = { color: template.background };

  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: 13.33,
    h: 7.5,
    fill: { color: template.background },
    line: { color: template.background },
  });
  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: 13.33,
    h: 0.16,
    fill: { color: template.accent },
    line: { color: template.accent },
  });
  slide.addShape("rect", {
    x: 8.5,
    y: 0.9,
    w: 3.55,
    h: 5.55,
    fill: { color: template.surface, transparency: 6 },
    line: { color: template.accent, transparency: 78 },
  });
  slide.addShape("line", {
    x: 8.92,
    y: 1.52,
    w: 2.62,
    h: 0,
    line: { color: template.bullet, width: 2.2 },
  });
  slide.addShape("line", {
    x: 8.92,
    y: 2.12,
    w: 1.8,
    h: 0,
    line: { color: template.accent, width: 2.2 },
  });
  slide.addShape("line", {
    x: 8.92,
    y: 2.72,
    w: 2.35,
    h: 0,
    line: { color: template.secondary, width: 2.2 },
  });

  slide.addText("PHOEBE PRESENTS", {
    x: 0.82,
    y: 0.72,
    w: 3.6,
    h: 0.24,
    fontFace: template.bodyFont,
    fontSize: 9,
    bold: true,
    charSpace: 2.1,
    color: template.muted,
    margin: 0,
  });
  slide.addText(topic, {
    x: 0.78,
    y: 1.84,
    w: 7.1,
    h: 1.5,
    fontFace: template.titleFont,
    fontSize: 34,
    bold: true,
    color: template.text,
    margin: 0,
    fit: "shrink",
    breakLine: false,
  });
  slide.addText(audience ? `Built for ${audience}` : "A generated strategic presentation blueprint", {
    x: 0.82,
    y: 3.52,
    w: 5.9,
    h: 0.38,
    fontFace: template.bodyFont,
    fontSize: 13,
    italic: true,
    color: template.accent,
    margin: 0,
  });

  const agenda = slides.slice(0, 4).map((item: any, index: number) => `${slideNumber(index)}  ${safeText(item.title, `Section ${index + 1}`)}`);
  slide.addText(agenda.join("\n"), {
    x: 0.84,
    y: 4.65,
    w: 6.4,
    h: 1.25,
    fontFace: template.bodyFont,
    fontSize: 10.5,
    color: template.muted,
    breakLine: false,
    fit: "shrink",
    margin: 0,
  });
  slide.addText(template.name.toUpperCase(), {
    x: 9.02,
    y: 5.7,
    w: 2.6,
    h: 0.24,
    fontFace: template.bodyFont,
    fontSize: 8,
    bold: true,
    charSpace: 1.7,
    color: template.muted,
    align: "right",
    margin: 0,
  });
}

function addAgendaSlide(pptx: any, template: DeckTemplate, slides: any[]) {
  const slide = pptx.addSlide();
  slide.background = { color: template.background };
  addDeckChrome(slide, template, 1, "DECK ROADMAP");

  slide.addText("Presentation Flow", {
    x: 0.75,
    y: 1.02,
    w: 5.7,
    h: 0.62,
    fontFace: template.titleFont,
    fontSize: 30,
    bold: true,
    color: template.text,
    margin: 0,
  });
  slide.addText("A quick read of how the story builds from context to recommendation.", {
    x: 0.78,
    y: 1.78,
    w: 6.8,
    h: 0.36,
    fontFace: template.bodyFont,
    fontSize: 12,
    italic: true,
    color: template.accent,
    margin: 0,
  });

  slides.slice(0, 6).forEach((item: any, index: number) => {
    const rowY = 2.55 + index * 0.55;
    slide.addText(slideNumber(index), {
      x: 0.82,
      y: rowY,
      w: 0.45,
      h: 0.24,
      fontFace: template.bodyFont,
      fontSize: 9,
      bold: true,
      color: template.bullet,
      margin: 0,
    });
    slide.addText(safeText(item.title, `Section ${index + 1}`), {
      x: 1.35,
      y: rowY - 0.02,
      w: 6.7,
      h: 0.28,
      fontFace: template.bodyFont,
      fontSize: 12,
      bold: true,
      color: template.text,
      margin: 0,
      fit: "shrink",
    });
  });

  slide.addShape("rect", {
    x: 8.55,
    y: 1.05,
    w: 3.8,
    h: 4.85,
    fill: { color: template.surface },
    line: { color: template.accent, transparency: 72 },
  });
  for (let i = 0; i < 5; i += 1) {
    slide.addShape("ellipse", {
      x: 9.05 + i * 0.54,
      y: 2.45 + i * 0.36,
      w: 0.32,
      h: 0.32,
      fill: { color: i % 2 === 0 ? template.accent : template.bullet, transparency: 10 },
      line: { color: i % 2 === 0 ? template.accent : template.bullet, transparency: 20 },
    });
  }
}

function addSectionDivider(pptx: any, template: DeckTemplate, item: any, visualIndex: number) {
  const slide = pptx.addSlide();
  slide.background = { color: template.background };
  addDeckChrome(slide, template, visualIndex, "SECTION BREAK");

  slide.addShape("rect", {
    x: 0.8,
    y: 1.25,
    w: 0.12,
    h: 4.25,
    fill: { color: template.bullet },
    line: { color: template.bullet },
  });
  slide.addText(safeText(item.title, "Next Section"), {
    x: 1.18,
    y: 2.25,
    w: 8.7,
    h: 1.2,
    fontFace: template.titleFont,
    fontSize: 36,
    bold: true,
    color: template.text,
    fit: "shrink",
    margin: 0,
  });
  slide.addText(safeText(item.headline, "A new movement in the presentation story."), {
    x: 1.22,
    y: 3.6,
    w: 7.1,
    h: 0.38,
    fontFace: template.bodyFont,
    fontSize: 13,
    italic: true,
    color: template.accent,
    margin: 0,
  });
  slide.addShape("ellipse", {
    x: 10.55,
    y: 1.65,
    w: 1.7,
    h: 1.7,
    fill: { color: template.accent, transparency: 20 },
    line: { color: template.accent, transparency: 35 },
  });
  slide.addShape("ellipse", {
    x: 9.72,
    y: 3.25,
    w: 2.25,
    h: 2.25,
    fill: { color: template.bullet, transparency: 24 },
    line: { color: template.bullet, transparency: 42 },
  });
}

function addContentSlide(pptx: any, template: DeckTemplate, item: any, index: number) {
  const slide = pptx.addSlide();
  slide.background = { color: template.background };
  addDeckChrome(slide, template, index + 2);

  slide.addText(safeText(item.title, `Slide ${index + 1}`), {
    x: 0.72,
    y: 1.24,
    w: 6.3,
    h: 0.95,
    fontFace: template.titleFont,
    fontSize: 28,
    bold: true,
    color: template.text,
    fit: "shrink",
    margin: 0,
    breakLine: false,
  });

  slide.addText(safeText(item.headline, "A focused point of view for this section."), {
    x: 0.76,
    y: 2.18,
    w: 6.1,
    h: 0.48,
    fontFace: template.bodyFont,
    fontSize: 13.5,
    italic: true,
    color: template.accent,
    fit: "shrink",
    margin: 0,
  });

  const bullets = Array.isArray(item.bullets) ? item.bullets.slice(0, 5) : [];
  bullets.forEach((bullet: string, bulletIndex: number) => {
    const y = 3.05 + bulletIndex * 0.52;
    slide.addShape("ellipse", {
      x: 0.79,
      y: y + 0.12,
      w: 0.08,
      h: 0.08,
      fill: { color: template.bullet },
      line: { color: template.bullet },
    });
    slide.addText(bullet, {
      x: 1.08,
      y,
      w: 5.9,
      h: 0.36,
      fontFace: template.bodyFont,
      fontSize: 12.5,
      color: template.text,
      fit: "shrink",
      margin: 0,
      breakLine: false,
    });
  });

  addVisualPanel(slide, template, item);

  if (item.speakerNotes) {
    slide.addNotes(item.speakerNotes);
  }
}

// 5. Unified API to generate a complete deck in a single call (useful for programmatic usage or integrations)
app.post("/api/generate-deck", async (req, res) => {
  try {
    const {
      slides = [],
      topic = "Beautiful Deck",
      audience = "",
      template = "executiveDark",
    } = req.body || {};
    const slideItems = Array.isArray(slides) ? slides : [];
    const selectedTemplate = chooseDeckTemplate(template);

    const PptxGenJS = (pptxgenjsModule as any).default || pptxgenjsModule;
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";
    pptx.author = "Phoebe";
    pptx.subject = "Beautiful AI-generated presentation";
    pptx.company = "Phoebe";

    pptx.theme = {
      headFontFace: selectedTemplate.titleFont,
      bodyFontFace: selectedTemplate.bodyFont,
      lang: "en-US",
    };

    addCoverSlide(pptx, selectedTemplate, safeText(topic, "Beautiful Deck"), slideItems, audience);
    if (slideItems.length > 1) {
      addAgendaSlide(pptx, selectedTemplate, slideItems);
    }

    slideItems.forEach((item: any, index: number) => {
      if (index > 0 && index % 3 === 0) {
        addSectionDivider(pptx, selectedTemplate, item, index + 2);
      }
      addContentSlide(pptx, selectedTemplate, item, index);
    });

    const buffer = await pptx.write({ outputType: "nodebuffer" });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${selectedTemplate.id}-beautiful-deck.pptx"`
    );

    res.send(buffer);
  } catch (error: any) {
    console.error("Generate deck error:", error);
    res.status(500).json({
      error: error.message || "Failed to generate deck",
    });
  }
});

// Endpoint to generate and download PPTX file directly (bypassing client-side iframe sandbox limitations)
app.post("/api/presentation/download-pptx", async (req, res) => {
  try {
    const { slides, theme } = req.body;
    let parsedSlides = slides;
    let parsedTheme = theme;

    if (typeof slides === "string") {
      parsedSlides = JSON.parse(slides);
    }
    if (typeof theme === "string") {
      parsedTheme = JSON.parse(theme);
    }

    if (!parsedSlides || !parsedTheme) {
      return res.status(400).send("Missing slides or theme data");
    }

    const colors = parsedTheme.colorPalette || {
      background: "#ffffff",
      text: "#000000",
      primary: "#0ea5e9",
      secondary: "#64748b"
    };

    const cleanColor = (hex: string) => {
      if (!hex) return "FFFFFF";
      return hex.replace("#", "").trim();
    };

    const resolveTextOptions = (customStyle: any, baseOptions: any) => {
      if (!customStyle) return baseOptions;
      const opts = { ...baseOptions };
      if (customStyle.fontSize) {
        opts.fontSize = Math.round(customStyle.fontSize * 0.95);
      }
      if (customStyle.fontFace) opts.fontFace = customStyle.fontFace;
      if (customStyle.color) opts.color = cleanColor(customStyle.color);
      if (customStyle.bold !== undefined) opts.bold = customStyle.bold;
      if (customStyle.italic !== undefined) opts.italic = customStyle.italic;
      if (customStyle.underline !== undefined) opts.underline = customStyle.underline;
      if (customStyle.align) opts.align = customStyle.align;
      return opts;
    };

    // Helper generator that builds the pptxgen deck and writes to Buffer
    const generatePPTXBuffer = async (includeImages: boolean): Promise<Buffer> => {
      const PptxGenJS = (pptxgenjsModule as any).default || pptxgenjsModule;
      const pptx = new PptxGenJS();
      pptx.layout = "LAYOUT_16X9";

      parsedSlides.forEach((slide: any) => {
        const pptSlide = pptx.addSlide();
        pptSlide.background = { color: cleanColor(colors.background) };

        // Small theme label
        pptSlide.addText(parsedTheme.name.toUpperCase(), {
          x: 0.5,
          y: 0.3,
          w: "90%",
          h: 0.3,
          fontSize: 10,
          fontFace: "Arial",
          color: cleanColor(colors.secondary),
          align: "left"
        });

        const isCover = slide.number === 1 || slide.title?.toLowerCase().includes("title") || slide.title?.toLowerCase().includes("welcome");

        if (isCover) {
          pptSlide.addText(slide.title || "", resolveTextOptions(slide.titleStyle, {
            x: 1.0,
            y: 2.0,
            w: 11.3,
            h: 1.8,
            fontSize: 36,
            fontFace: "Arial",
            color: cleanColor(colors.text),
            bold: true,
            align: "center"
          }));

          pptSlide.addText(slide.headline || "", resolveTextOptions(slide.headlineStyle, {
            x: 1.5,
            y: 4.0,
            w: 10.3,
            h: 1.0,
            fontSize: 16,
            fontFace: "Arial",
            color: cleanColor(colors.primary),
            italic: true,
            align: "center"
          }));
        } else {
          pptSlide.addText(slide.title || "", resolveTextOptions(slide.titleStyle, {
            x: 0.5,
            y: 0.8,
            w: 12.3,
            h: 0.6,
            fontSize: 24,
            fontFace: "Arial",
            color: cleanColor(colors.text),
            bold: true
          }));

          pptSlide.addText(slide.headline || "", resolveTextOptions(slide.headlineStyle, {
            x: 0.5,
            y: 1.4,
            w: 12.3,
            h: 0.4,
            fontSize: 12,
            fontFace: "Arial",
            color: cleanColor(colors.primary),
            italic: true
          }));

          // Bullets
          const bulletObjects = (slide.bullets || []).map((bulletText: string) => {
            return {
              text: bulletText,
              options: resolveTextOptions(slide.bulletsStyle, {
                bullet: true,
                indentLevel: 0,
                color: cleanColor(colors.text),
                fontSize: 14
              })
            };
          });

          if (bulletObjects.length > 0) {
            const baseBulletsContainerOpts: any = {
              x: 0.5,
              y: 2.0,
              w: 7.0,
              h: 4.5,
              fontFace: "Arial",
              lineSpacing: 24
            };
            if (slide.bulletsStyle?.fontFace) {
              baseBulletsContainerOpts.fontFace = slide.bulletsStyle.fontFace;
            }
            pptSlide.addText(bulletObjects, baseBulletsContainerOpts);
          }

          if (includeImages && slide.useImageOnSlide && slide.conceptImage) {
            try {
              if (slide.conceptImage.startsWith("data:")) {
                pptSlide.addImage({
                  data: slide.conceptImage,
                  x: 8.0,
                  y: 2.0,
                  w: 4.8,
                  h: 4.5
                });
              } else {
                pptSlide.addImage({
                  path: slide.conceptImage,
                  x: 8.0,
                  y: 2.0,
                  w: 4.8,
                  h: 4.5
                });
              }
            } catch (imgErr) {
              console.error("Backend addImage inline error:", imgErr);
              // Fallback placeholder shape
              pptSlide.addShape("rect", {
                x: 8.0,
                y: 2.0,
                w: 4.8,
                h: 4.5,
                fill: { color: cleanColor(colors.primary), transparency: 90 },
                line: { color: cleanColor(colors.primary), width: 1 }
              });
              pptSlide.addText("VISUAL DIRECTIVE:\n\n" + (slide.visualSuggestion || ""), {
                x: 8.2,
                y: 2.2,
                w: 4.4,
                h: 4.1,
                fontSize: 11,
                fontFace: "Courier New",
                color: cleanColor(colors.text)
              });
            }
          } else {
            pptSlide.addShape("rect", {
              x: 8.0,
              y: 2.0,
              w: 4.8,
              h: 4.5,
              fill: { color: cleanColor(colors.primary), transparency: 90 },
              line: { color: cleanColor(colors.primary), width: 1 }
            });

            pptSlide.addText("VISUAL DIRECTIVE:\n\n" + (slide.visualSuggestion || ""), {
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

      const nodeBuffer = await pptx.write({ outputType: "nodebuffer" });
      return nodeBuffer as Buffer;
    };

    let buffer: Buffer;
    try {
      console.log("[PPTX Export] Generating with slide images included...");
      buffer = await generatePPTXBuffer(true);
    } catch (exportErr: any) {
      console.warn("[PPTX Export] Image-based generation failed (CORS, network error or invalid path). Retrying with placeholder visual guides...", exportErr.message);
      buffer = await generatePPTXBuffer(false);
    }

    const filename = `${(parsedTheme.name || "Presentation").replace(/\s+/g, "_")}_Presentation.pptx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error: any) {
    console.error("Server-side PPTX generation fatal error:", error);
    res.status(500).send("Failed to generate and download PowerPoint: " + error.message);
  }
});

// Serve assets and handle Vite in development, static build in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
