import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  HelpCircle, 
  Layers, 
  Tv, 
  Download, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Send, 
  ArrowRight, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  RefreshCw, 
  Monitor, 
  Clock, 
  User, 
  Target, 
  Compass, 
  Lightbulb,
  AlertCircle,
  UploadCloud,
  Link,
  Clipboard,
  Palette,
  Users,
  PenTool,
  GitBranch,
  Gift,
  Globe,
  LogOut,
  ChevronDown,
  ChevronUp,
  Check,
  Edit2,
  FileEdit,
  Menu,
  History,
  Sliders,
  Save,
  X
} from "lucide-react";
import { Slide, PresentationTheme, WorkflowStep, PresentationContext, SavedPresentation } from "./types";
import SlideViewer from "./components/SlideViewer";
import { exportToPPTX, exportToPPTXBlob } from "./utils/pptExport";
import { initAuth, googleSignIn, logout as googleLogout, uploadPresentationToGoogleDrive } from "./lib/googleDrive";

// Pre-filled dynamic examples for onboarding
const EXAMPLES = [
  {
    label: "🚀 EcoSmart Smart Bottle",
    prompt: "Launch presentation of our new biodegradable, app-connected smart water bottle, seeking $1.5M in seed funding.",
    topic: "EcoSmart Water Bottle Pitch",
    audience: "Seed Investors & Venture Capitalists",
    goal: "Secure $1.5M in seed funding to scale initial production."
  },
  {
    label: "⚙️ Microservice Migration",
    prompt: "Annual technical retrospect of our cloud infrastructure migration from monolithic to microservices, highlighting a 40% reduction in latency.",
    topic: "Monolith to Microservice Retrospective",
    audience: "Engineering Leadership and Technical Advisory Board",
    goal: "Obtain approval for Phase 2 cloud budget expansion."
  },
  {
    label: "📈 Corporate Sales Roadmap",
    prompt: "A quarterly product strategy alignment for the enterprise sales force, focusing on AI-assisted feature upgrades and global CRM integration.",
    topic: "Enterprise Sales & AI Roadmap",
    audience: "Global Enterprise Sales Team",
    goal: "Align the sales force on key value propositions and target quotas."
  }
];

const DECK_TEMPLATE_OPTIONS = [
  { id: "executiveDark", label: "Executive Dark" },
  { id: "cleanWhite", label: "Clean White" },
  { id: "neonPitch", label: "Neon Pitch" }
] as const;

type DeckTemplateId = typeof DECK_TEMPLATE_OPTIONS[number]["id"];

export default function App() {
  // Sidebar tab selection
  const [sidebarTab, setSidebarTab] = useState<"slides" | "writer" | "summarizer" | "chat" | "pdf" | "mindmap" | "themes" | "teamwork" | "history">("slides");

  // Saved decks state
  const [savedPresentations, setSavedPresentations] = useState<SavedPresentation[]>([]);
  const [currentPresentationId, setCurrentPresentationId] = useState<string | null>(null);

  // Workflow steps: ingestion, clarification, themes, draft, review
  const [step, setStep] = useState<WorkflowStep>("ingestion");
  const [context, setContext] = useState<PresentationContext>({
    prompt: "",
    topic: "",
    audience: "Investors",
    goal: "",
    isDetailed: true,
    clarifyingQuestions: [],
    clarifyingAnswers: {},
    themes: [],
    chosenTheme: null,
    slides: []
  });

  // Refs to manage robust auto-saving and prevent losing pending edits on navigation / loads / resets
  const pendingSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestSaveDataRef = useRef({ context, step, currentPresentationId });

  // Keep latest save data ref synchronized on every render
  useEffect(() => {
    latestSaveDataRef.current = { context, step, currentPresentationId };
  }, [context, step, currentPresentationId]);

  // Source selection tabs
  const [activeSourceTab, setActiveSourceTab] = useState<"generate" | "file" | "url" | "text">("generate");

  // Interactive inputs
  const [selectedAudience, setSelectedAudience] = useState<string>("Investors");
  const [selectedCardCount, setSelectedCardCount] = useState<string>("11-15 cards");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");
  const [selectedTextLength, setSelectedTextLength] = useState<string>("Detailed");
  const [selectedDeckTemplate, setSelectedDeckTemplate] = useState<DeckTemplateId>("executiveDark");

  // Dropdown states
  const [showAudienceMenu, setShowAudienceMenu] = useState(false);
  const [showCardMenu, setShowCardMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showLengthMenu, setShowLengthMenu] = useState(false);

  // File uploading/URL state mock
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState<string>("");
  const [pasteRawText, setPasteRawText] = useState<string>("");

  // Outline inline editing
  const [editingOutlineItem, setEditingOutlineItem] = useState<{
    slideIdx: number;
    type: "title" | "bullet";
    bulletIdx?: number;
  } | null>(null);
  const [outlineEditValue, setOutlineEditValue] = useState<string>("");

  // Global loading / error
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Chat copilot state
  const [chatInput, setChatInput] = useState<string>("");
  const [isChatting, setIsChatting] = useState<boolean>(false);
  const [chatLog, setChatLog] = useState<Array<{ sender: "user" | "copilot"; text: string }>>([
    { sender: "copilot", text: "Hello! I am your Presentation Story Strategist. Let me know if you would like to edit, add, or delete slides, or rewrite any copy to sound more impactful." }
  ]);
  const [isCopilotMinimized, setIsCopilotMinimized] = useState<boolean>(false);

  // Google Drive states
  const [googleUser, setGoogleUser] = useState<any | null>(null);
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(null);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState<boolean>(false);
  const [uploadedDriveLink, setUploadedDriveLink] = useState<string | null>(null);

  // Active slide visual stage index
  const [activeSlideIdx, setActiveSlideIdx] = useState<number>(0);
  const [outlineFinalized, setOutlineFinalized] = useState<boolean>(false);

  // Mode select inside drafting/review stage: "outline" vs "visual" vs "both"
  const [workspaceMode, setWorkspaceMode] = useState<"outline" | "visual" | "both">("both");

  // Load saved decks and last active presentation from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("phoebe_saved_decks");
      let decks: SavedPresentation[] = [];
      if (saved) {
        decks = JSON.parse(saved);
        setSavedPresentations(decks);
      }

      const lastActiveId = localStorage.getItem("phoebe_current_presentation_id");
      if (lastActiveId && decks.length > 0) {
        const found = decks.find(p => p.id === lastActiveId);
        if (found) {
          setCurrentPresentationId(found.id);
          setContext(found.context);
          setStep(found.step);
          setActiveSlideIdx(found.activeSlideIdx || 0);
          setOutlineFinalized(found.outlineFinalized || false);
        }
      }
    } catch (e) {
      console.error("Failed to load saved decks", e);
    }
  }, []);

  // Persist current active presentation ID to localStorage
  useEffect(() => {
    if (currentPresentationId) {
      localStorage.setItem("phoebe_current_presentation_id", currentPresentationId);
    } else {
      localStorage.removeItem("phoebe_current_presentation_id");
    }
  }, [currentPresentationId]);

  // Save any pending changes before browser unload/refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushPendingSave();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Initialize Google Drive Auth
  useEffect(() => {
    let unsubscribe = () => {};
    initAuth(
      (user, token) => {
        setGoogleUser(user);
        setDriveAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setDriveAccessToken(null);
      }
    ).then((unsub) => {
      if (unsub) unsubscribe = unsub;
    }).catch(err => {
      console.log("Auth setup delayed:", err);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Save / auto-save helper
  const saveDeck = (
    customContext?: PresentationContext,
    customStep?: WorkflowStep,
    customId?: string | null,
    showFeedback: boolean = false
  ) => {
    const ctx = customContext || context;
    const stp = customStep || step;

    // Only save if some topic or slides are defined
    if (!ctx.topic && !ctx.prompt && ctx.slides.length === 0) return;

    const idToSave = customId || currentPresentationId || Date.now().toString();
    if (!currentPresentationId && !customId) {
      setCurrentPresentationId(idToSave);
    }
    try {
      localStorage.setItem("phoebe_current_presentation_id", idToSave);
    } catch (e) {
      console.error(e);
    }

    const titleToSave = ctx.topic || ctx.prompt.slice(0, 40) || "Untitled Presentation";

    const newSaved: SavedPresentation = {
      id: idToSave,
      topic: titleToSave,
      timestamp: new Date().toLocaleString(),
      step: stp,
      context: ctx,
      activeSlideIdx,
      outlineFinalized
    };

    setSavedPresentations(prev => {
      const filtered = prev.filter(p => p.id !== idToSave);
      const updated = [newSaved, ...filtered];
      try {
        localStorage.setItem("phoebe_saved_decks", JSON.stringify(updated));
      } catch (err) {
        console.error("LocalStorage write error:", err);
      }
      return updated;
    });

    if (showFeedback) {
      setError(`Successfully saved "${titleToSave}" to Saved Decks!`);
    }
  };

  const flushPendingSave = () => {
    if (pendingSaveTimeoutRef.current) {
      clearTimeout(pendingSaveTimeoutRef.current);
      pendingSaveTimeoutRef.current = null;
    }
    const { context: ctx, step: stp, currentPresentationId: id } = latestSaveDataRef.current;
    if (ctx && ctx.slides && ctx.slides.length > 0 && id) {
      saveDeck(ctx, stp, id, false);
    }
  };

  const handleSidebarTabChange = (tabId: "slides" | "writer" | "summarizer" | "chat" | "pdf" | "mindmap" | "themes" | "teamwork" | "history") => {
    flushPendingSave();
    setSidebarTab(tabId);
    if (tabId === "themes" && context.themes.length > 0) {
      setStep("themes");
    }
  };

  const handleDeleteDeck = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedPresentations.filter(p => p.id !== idToDelete);
    setSavedPresentations(updated);
    try {
      localStorage.setItem("phoebe_saved_decks", JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    if (currentPresentationId === idToDelete) {
      setCurrentPresentationId(null);
    }
  };

  const handleLoadDeck = (saved: SavedPresentation) => {
    // 1. Flush any pending saves on the current presentation first
    flushPendingSave();

    // 2. Load the deck using a deep clone to completely eliminate reference-sharing bugs
    const clonedSaved = JSON.parse(JSON.stringify(saved)) as SavedPresentation;
    setCurrentPresentationId(clonedSaved.id);
    setContext(clonedSaved.context);
    setStep(clonedSaved.step);
    setActiveSlideIdx(clonedSaved.activeSlideIdx || 0);
    setOutlineFinalized(clonedSaved.outlineFinalized || false);
    setSidebarTab("slides");
  };

  // Auto-save on presentation alterations
  useEffect(() => {
    if (context.slides.length > 0 && currentPresentationId) {
      if (pendingSaveTimeoutRef.current) {
        clearTimeout(pendingSaveTimeoutRef.current);
      }
      
      pendingSaveTimeoutRef.current = setTimeout(() => {
        saveDeck(context, step, currentPresentationId, false);
        pendingSaveTimeoutRef.current = null;
      }, 1000);

      return () => {
        if (pendingSaveTimeoutRef.current) {
          clearTimeout(pendingSaveTimeoutRef.current);
        }
      };
    }
  }, [context.slides, context.topic, step, outlineFinalized, activeSlideIdx, currentPresentationId]);

  // Apply quick onboard examples
  const handleSelectExample = (ex: typeof EXAMPLES[0]) => {
    setContext(prev => ({
      ...prev,
      prompt: ex.prompt,
      topic: ex.topic,
      audience: ex.audience,
      goal: ex.goal
    }));
    setSelectedAudience(ex.audience);
  };

  // Build the context arguments before post
  const getPromptAndMetadataPayload = () => {
    let finalPrompt = context.prompt;
    if (activeSourceTab === "file") {
      finalPrompt = `Document outline based on uploaded source file: ${uploadedFileName || "ProjectSpecs.pdf"}. Focus on comprehensive alignment.`;
    } else if (activeSourceTab === "url") {
      finalPrompt = `Presentation derived from URL: ${inputUrl || "https://example.com/project-brief"}. Focus on core tech data.`;
    } else if (activeSourceTab === "text") {
      finalPrompt = `Storyboard built from pasted document content: ${pasteRawText || "Enter raw technical notes..."}`;
    }

    return {
      prompt: finalPrompt,
      topic: context.topic || finalPrompt.split(" ").slice(0, 5).join(" ") || "New Project Outline",
      audience: selectedAudience,
      goal: `Target outline length: ${selectedCardCount}, in ${selectedLanguage} language. Style: ${selectedTextLength}.`
    };
  };

  // STEP 1: Ingest topic details and parse
  const handleAnalyzePrompt = async () => {
    const payload = getPromptAndMetadataPayload();
    if (!payload.prompt.trim() && !payload.topic.trim()) {
      setError("Write one magical paragraph or idea first, or select a source.");
      return;
    }

    setIsLoading(true);
    setLoadingText("Analyzing presentation vision, topic details, and target audience context using Gemini AI...");
    setError(null);

    try {
      const response = await fetch("/api/presentation/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Analysis failed. Please check your Gemini connection or credentials.");
      }

      const data = await response.json();
      
      setContext(prev => ({
        ...prev,
        topic: data.topic || payload.topic,
        audience: data.audience || payload.audience,
        goal: data.goal || payload.goal,
        isDetailed: data.isDetailed,
        clarifyingQuestions: data.clarifyingQuestions || [],
        themes: data.themes || []
      }));

      // If vague or has clarifying questions, proceed to clarification, else go straight to themes
      if (!data.isDetailed && data.clarifyingQuestions && data.clarifyingQuestions.length > 0) {
        setStep("clarification");
      } else {
        setStep("themes");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during ingestion.");
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 1B: Submit answers to clarifying questions
  const handleClarifySubmit = async () => {
    setIsLoading(true);
    setLoadingText("Combining inputs and structuring custom visual themes...");
    setError(null);

    // Build enhanced prompt using answers
    const answersText = Object.entries(context.clarifyingAnswers)
      .map(([q, a]) => `Q: ${q}\nA: ${a}`)
      .join("\n");
    
    const combinedPrompt = `${context.prompt}\n\nClarifying Context:\n${answersText}`;

    try {
      const response = await fetch("/api/presentation/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: combinedPrompt,
          topic: context.topic,
          audience: selectedAudience,
          goal: context.goal
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Refined theme analysis failed.");
      }

      const data = await response.json();
      setContext(prev => ({
        ...prev,
        topic: data.topic,
        audience: data.audience,
        goal: data.goal,
        themes: data.themes || []
      }));
      
      setStep("themes");
    } catch (err: any) {
      setError(err.message || "Failed to finalize themes after clarification.");
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Theme Selection & Slide Draft Generation
  const handleSelectThemeAndGenerate = async (theme: PresentationTheme) => {
    setContext(prev => ({ ...prev, chosenTheme: theme }));
    setIsLoading(true);
    setLoadingText(`Synthesizing your presentation storyboard on "${theme.name}" style guide. Framing slides...`);
    setError(null);

    try {
      const response = await fetch("/api/presentation/generate-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: context.topic || context.prompt || "New Presentation Theme Draft",
          audience: selectedAudience,
          goal: context.goal,
          chosenTheme: theme,
          additionalNotes: context.prompt + ` [Total Cards: ${selectedCardCount}, Length: ${selectedTextLength}]`
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Slide outline generation failed.");
      }

      const data = await response.json();
      
      const updatedContext = {
        ...context,
        chosenTheme: theme,
        slides: data.slides || []
      };

      setContext(updatedContext);
      setActiveSlideIdx(0);
      setStep("draft");
      setWorkspaceMode("outline"); // Default to outline tree first to match screenshot, then generate to slide stage
      
      // Auto-save the newly generated presentation with a fresh ID
      const freshId = Date.now().toString();
      setCurrentPresentationId(freshId);
      saveDeck(updatedContext, "draft", freshId);
    } catch (err: any) {
      setError(err.message || "Failed to generate initial presentation draft.");
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3: Handle slide update from direct inline editing
  const handleUpdateSlide = (updatedSlide: Slide) => {
    setContext(prev => {
      const updatedSlides = [...prev.slides];
      const idx = updatedSlides.findIndex(s => s.number === updatedSlide.number);
      if (idx !== -1) {
        updatedSlides[idx] = updatedSlide;
      }
      return { ...prev, slides: updatedSlides };
    });
  };

  // STEP 4: Chat Copilot refinement
  const handleSendChat = async () => {
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatLog(prev => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");
    setIsChatting(true);

    try {
      const response = await fetch("/api/presentation/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slides: context.slides,
          instruction: userMsg,
          topic: context.topic,
          audience: selectedAudience,
          goal: context.goal,
          chosenTheme: context.chosenTheme
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Co-pilot refinement failed.");
      }

      const data = await response.json();
      
      if (data.slides && data.slides.length > 0) {
        setContext(prev => ({ ...prev, slides: data.slides }));
        if (activeSlideIdx >= data.slides.length) {
          setActiveSlideIdx(0);
        }
        setChatLog(prev => [...prev, { 
          sender: "copilot", 
          text: `I've successfully updated your slides. The storyboard has been adjusted. Feel free to review the changes!` 
        }]);
      } else {
        setChatLog(prev => [...prev, { 
          sender: "copilot", 
          text: "I analyzed that but wasn't able to restructure the slides cleanly. Try phrasing your command differently (e.g. 'Add a slide about security', 'make slide 2 bullet points shorter')." 
        }]);
      }
    } catch (err: any) {
      setChatLog(prev => [...prev, { sender: "copilot", text: `Error adjusting outline: ${err.message}` }]);
    } finally {
      setIsChatting(false);
    }
  };

  // Create empty default slide
  const handleAddSlide = () => {
    const nextNum = context.slides.length + 1;
    const newSlide: Slide = {
      number: nextNum,
      title: "New Narrative Point",
      headline: "A clear, compelling takeaway statement.",
      bullets: ["First detail about this point", "Supporting parameter"],
      visualSuggestion: "Clean side-by-side card layouts using the primary theme color.",
      speakerNotes: "Explain the context behind this point clearly to the stakeholders."
    };

    setContext(prev => ({
      ...prev,
      slides: [...prev.slides, newSlide]
    }));
    setActiveSlideIdx(context.slides.length);
  };

  // Delete specific slide and renumber
  const handleDeleteSlide = (idxToDelete: number) => {
    if (context.slides.length <= 1) {
      setError("A presentation outline must have at least one slide.");
      return;
    }
    
    const updated = context.slides
      .filter((_, idx) => idx !== idxToDelete)
      .map((slide, idx) => ({ ...slide, number: idx + 1 }));

    setContext(prev => ({ ...prev, slides: updated }));
    
    if (activeSlideIdx >= updated.length) {
      setActiveSlideIdx(updated.length - 1);
    }
  };

  // Finalize storyboard
  const handleFinalizeDeck = () => {
    setStep("review");
    setOutlineFinalized(true);
    setWorkspaceMode("visual");
  };

  // PPTX Export trigger (Uses robust server-side generation & form submit to fully bypass iframe sandbox download restrictions)
  const handleDownloadPPTX = async () => {
    if (!context.slides.length || !context.chosenTheme) return;
    try {
      setIsLoading(true);
      setLoadingText("Generating and bundling your native PowerPoint presentation...");

      // Programmatically create a form to submit to our download-pptx API.
      // Doing this with target="_blank" is a bulletproof way to bypass iframe sandbox download blocks,
      // as the browser handles the download attachment in a separate top-level download thread.
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/api/presentation/download-pptx";
      form.target = "_blank";

      const slidesInput = document.createElement("input");
      slidesInput.type = "hidden";
      slidesInput.name = "slides";
      slidesInput.value = JSON.stringify(context.slides);
      form.appendChild(slidesInput);

      const themeInput = document.createElement("input");
      themeInput.type = "hidden";
      themeInput.name = "theme";
      themeInput.value = JSON.stringify(context.chosenTheme);
      form.appendChild(themeInput);

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);

      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    } catch (err) {
      console.error("PPTX Download Error:", err);
      setError("Failed to download PPTX file directly. Please use Google Drive integration!");
      setIsLoading(false);
    }
  };

const handleGenerateBeautifulDeck = async () => {
  try {
    setIsLoading(true);
    setLoadingText("Generating beautiful deck...");
    setError(null);

    const response = await fetch("/api/generate-deck", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        slides: context.slides,
        theme: context.chosenTheme,
        topic: context.topic,
        audience: context.audience,
        template: selectedDeckTemplate,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to generate deck");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "beautiful-deck.pptx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    setError(error.message || "Failed to generate deck");
  } finally {
    setIsLoading(false);
  }
};

  // Upload/Save presentation to Google Drive and return webViewLink to open in Google Drive or Google Slides
  const handleSaveToGoogleDrive = async () => {
    if (!context.slides.length || !context.chosenTheme) return;
    try {
      setIsUploadingToDrive(true);
      setError(null);

      let token = driveAccessToken;
      if (!token) {
        // Trigger Google Workspace Sign-In
        const result = await googleSignIn();
        if (result) {
          setGoogleUser(result.user);
          setDriveAccessToken(result.accessToken);
          token = result.accessToken;
        } else {
          throw new Error("Sign-In with Google was cancelled or failed.");
        }
      }

      if (!token) {
        throw new Error("Could not acquire Google Workspace access token.");
      }

      // Generate the presentation file as a Blob using client-side pptxgenjs (more lightweight)
      const blob = await exportToPPTXBlob(context.slides, context.chosenTheme);
      const fileName = `${context.chosenTheme.name.replace(/\s+/g, "_")}_Presentation.pptx`;

      // Upload the Blob to Drive
      const uploadResult = await uploadPresentationToGoogleDrive(blob, fileName, token);
      setUploadedDriveLink(uploadResult.webViewLink);
    } catch (err: any) {
      console.error("Google Drive Save Error:", err);
      setError(err.message || "Failed to upload presentation to Google Drive.");
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await googleLogout();
      setGoogleUser(null);
      setDriveAccessToken(null);
      setUploadedDriveLink(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Reset work
  const handleReset = () => {
    // Save any outstanding changes before starting fresh
    flushPendingSave();

    setCurrentPresentationId(null);
    setContext({
      prompt: "",
      topic: "",
      audience: "Investors",
      goal: "",
      isDetailed: true,
      clarifyingQuestions: [],
      clarifyingAnswers: {},
      themes: [],
      chosenTheme: null,
      slides: []
    });
    setStep("ingestion");
    setOutlineFinalized(false);
    setUploadedFileName(null);
    setInputUrl("");
    setPasteRawText("");
  };

  // Handle inline edit submit
  const handleSaveInlineEdit = () => {
    if (!editingOutlineItem) return;
    const { slideIdx, type, bulletIdx } = editingOutlineItem;
    
    const updatedSlides = [...context.slides];
    const slide = { ...updatedSlides[slideIdx] };

    if (type === "title") {
      slide.title = outlineEditValue;
    } else if (type === "bullet" && bulletIdx !== undefined) {
      const updatedBullets = [...slide.bullets];
      updatedBullets[bulletIdx] = outlineEditValue;
      slide.bullets = updatedBullets;
    }

    updatedSlides[slideIdx] = slide;
    setContext({ ...context, slides: updatedSlides });
    setEditingOutlineItem(null);
  };

  // Handle file mock drag/drop
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setUploadedFileName(file.name);
      setContext(prev => ({ ...prev, topic: file.name.split(".")[0] }));
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-sky-500/20 selection:text-sky-950">
      
      {/* 1. LEFT SIDEBAR NAVIGATION (Sky Blue and White Theme) */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-100 flex-col justify-between h-screen sticky top-0 z-40 p-5">
        <div className="flex flex-col gap-6">
          
          {/* Brand Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-tr from-sky-500 to-blue-500 text-white font-black text-2xl rounded-2xl flex items-center justify-center shadow-md shadow-sky-500/20">
                P
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-slate-800 flex items-center gap-0.5">
                  <span>Phoebe</span>
                </h1>
                <p className="text-[9px] font-mono tracking-widest text-slate-400 uppercase font-semibold">Outline Architect</p>
              </div>
            </div>
            
            {/* User Personal Orange Badge */}
            <div 
              className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold text-xs flex items-center justify-center uppercase shadow-sm cursor-pointer hover:opacity-90 active:scale-95 transition"
              title="nurdea@42race.com (User Account)"
            >
              d
            </div>
          </div>

          {/* Navigation list */}
          <nav className="flex flex-col gap-1.5 mt-2">
            {[
              { id: "slides", label: "AI Slides", icon: Tv, badge: null },
              { id: "themes", label: "Themes", icon: Palette, badge: null },
              { id: "history", label: "Saved Decks", icon: History, badge: savedPresentations.length > 0 ? savedPresentations.length.toString() : null }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = sidebarTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => handleSidebarTabChange(item.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-sky-50 text-sky-700 border-r-4 border-sky-500"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-sky-600" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
                      isActive ? "bg-sky-100 text-sky-800" : "bg-slate-100 text-slate-500"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom widgets */}
        <div className="flex flex-col gap-4 pt-4 border-t border-slate-100">
          
          {/* Usage limit indicators mimicking the design spec */}
          <div className="flex flex-col gap-2 bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
            <span className="text-[9px] font-mono uppercase text-slate-400 font-bold tracking-wider">Usage Limits</span>
            <div className="flex flex-col gap-1.5 text-[11px] text-slate-600 font-medium">
              <div className="flex justify-between items-center">
                <span>Summarize Chats</span>
                <span className="bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">1</span>
              </div>
              <div className="flex justify-between items-center">
                <span>AI Presentations</span>
                <span className="bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">1</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Word Counts</span>
                <span className="bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">15</span>
              </div>
            </div>
          </div>

          {/* Upgrade Premium CTA Button */}
          <button 
            id="upgrade-cta-button"
            className="w-full py-3 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/15 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Upgrade Pro</span>
          </button>

          {/* Footer quick action row */}
          <div className="flex items-center justify-between text-slate-400 px-1.5">
            <button className="hover:text-slate-600 transition cursor-pointer" title="Settings"><Globe className="w-4 h-4" /></button>
            <button className="hover:text-slate-600 transition cursor-pointer" title="Perks"><Gift className="w-4 h-4" /></button>
            <button className="hover:text-slate-600 transition cursor-pointer" title="Community"><Users className="w-4 h-4" /></button>
            <button onClick={handleReset} className="hover:text-red-500 transition cursor-pointer" title="Reset Session"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN APPLICATION CONTENT COLUMN */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Top Header Navigation bar */}
        <header className="border-b border-slate-100 bg-white/80 backdrop-blur sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Clock/History Back Button */}
            <button
              onClick={handleReset}
              className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-500 transition flex items-center justify-center border border-slate-100 cursor-pointer"
              title="Reset Outline Session"
            >
              <History className="w-4 h-4 text-slate-600" />
            </button>
            
            <div className="lg:hidden w-8 h-8 bg-sky-500 text-white rounded-lg flex items-center justify-center font-extrabold text-sm">P</div>
            
            <div>
              <h1 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <span>Phoebe</span>
                {context.chosenTheme && (
                  <span className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full border border-sky-100 font-mono">
                    Theme: {context.chosenTheme.name}
                  </span>
                )}
              </h1>
            </div>
          </div>

          {/* Step breadcrumb indicators */}
          <div className="hidden md:flex items-center gap-2 text-xs font-mono font-bold">
            <span className={`px-2.5 py-1 rounded-full transition ${step === "ingestion" ? "text-sky-700 bg-sky-50 border border-sky-100" : "text-slate-400"}`}>1. Ingestion</span>
            <span className="text-slate-300">➔</span>
            <span className={`px-2.5 py-1 rounded-full transition ${step === "clarification" ? "text-sky-700 bg-sky-50 border border-sky-100" : "text-slate-400"}`}>2. Clarification</span>
            <span className="text-slate-300">➔</span>
            <span className={`px-2.5 py-1 rounded-full transition ${step === "themes" ? "text-sky-700 bg-sky-50 border border-sky-100" : "text-slate-400"}`}>3. Themes</span>
            <span className="text-slate-300">➔</span>
            <span className={`px-2.5 py-1 rounded-full transition ${step === "draft" || step === "review" ? "text-sky-700 bg-sky-50 border border-sky-100" : "text-slate-400"}`}>4. Blueprint</span>
          </div>

          {/* Action Export & Save Buttons */}
          <div className="flex items-center gap-2">
            {(context.prompt || context.topic || context.slides.length > 0) && (
              <button
                onClick={() => saveDeck(undefined, undefined, undefined, true)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 rounded-full font-bold shadow-md shadow-emerald-500/10 transition cursor-pointer"
                title="Save current presentation outline"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Outline</span>
              </button>
            )}
            {context.slides.length > 0 && (
              <button
                onClick={handleDownloadPPTX}
                className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs px-4 py-2 rounded-full font-bold shadow-md shadow-sky-500/10 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PPTX</span>
              </button>
            )}
          </div>
        </header>

        {/* Core Layout Renderer */}
        <main className="flex-1 flex flex-col relative bg-[#f8fafc]">
          
          {/* Background Loader Overlay */}
          <AnimatePresence>
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-slate-800"
              >
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-sky-500 animate-spin" />
                  <Sparkles className="w-6 h-6 text-sky-600 absolute inset-0 m-auto animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-sky-700">Creative Engine Active</h3>
                <p className="text-sm text-slate-500 max-w-md mt-2 leading-relaxed">{loadingText}</p>
                
                <div className="mt-8 flex flex-col gap-1 text-[10px] font-mono text-slate-500 text-left w-56 border border-slate-100 p-4 rounded-xl bg-[#f8fafc] font-bold">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    <span>Synthesizing structural outline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse" />
                    <span>Tailoring color-way guidelines</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span>Drafting speaker voiceovers</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* System Error Message */}
          {error && (
            <div className="bg-red-50 border-b border-red-100 px-6 py-3.5 flex items-center justify-between text-xs text-red-700">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900 font-bold px-2 py-1 transition">Dismiss</button>
            </div>
          )}

          {/* MULTI-TAB DISPLAY LOGIC */}
          <div className="flex-1 flex flex-col">
            
            {/* If user selected sidebar tabs other than Slides, Themes, History, show gorgeous simulated workspaces */}
            {sidebarTab !== "slides" && sidebarTab !== "themes" && sidebarTab !== "history" && (
              <motion.div
                key={sidebarTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 max-w-4xl mx-auto w-full flex-1 flex flex-col justify-center items-center text-center gap-6"
              >
                <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-inner">
                  {sidebarTab === "writer" && <PenTool className="w-8 h-8" />}
                  {sidebarTab === "summarizer" && <FileText className="w-8 h-8" />}
                  {sidebarTab === "chat" && <MessageSquare className="w-8 h-8" />}
                  {sidebarTab === "pdf" && <FileEdit className="w-8 h-8" />}
                  {sidebarTab === "mindmap" && <GitBranch className="w-8 h-8" />}
                  {sidebarTab === "teamwork" && <Users className="w-8 h-8" />}
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-slate-800 capitalize">AI {sidebarTab} Assistant</h2>
                  <p className="text-slate-500 text-sm mt-2 max-w-md">
                    Instantly draft, modify, or sync content from your presentation with our upcoming cross-functional workspaces.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm max-w-lg w-full flex flex-col gap-4 text-left">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    <span className="text-xs font-bold text-slate-700 uppercase">Contextual Sandbox</span>
                  </div>
                  <textarea
                    className="w-full h-24 bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-600 outline-none placeholder:text-slate-400 resize-none"
                    placeholder={`Paste documents or reference material here to sync with AI ${sidebarTab}...`}
                  />
                  <button 
                    onClick={() => {
                      handleSidebarTabChange("slides");
                      setError(`Synced mock workspace information to current outline!`);
                    }}
                    className="py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Back to AI Presentation Outline</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* If user selected history tab, show Saved Decks list */}
            {sidebarTab === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 md:p-10 max-w-5xl mx-auto w-full flex-1 flex flex-col gap-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                      <History className="w-5 h-5 text-sky-600 animate-pulse" />
                      <span>Saved Presentations & Decks</span>
                    </h2>
                    <p className="text-slate-500 text-xs mt-1">
                      Load or manage your recently synthesized, edited, or auto-saved storyboards.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Manual Save Current Button */}
                    {(context.prompt || context.topic || context.slides.length > 0) && (
                      <button
                        onClick={() => saveDeck(undefined, undefined, undefined, true)}
                        className="bg-sky-600 hover:bg-sky-700 text-white text-xs px-4 py-2.5 rounded-xl font-bold shadow-md shadow-sky-500/10 transition flex items-center gap-1.5 cursor-pointer"
                        title="Save current presentation outline"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Save Current Outline</span>
                      </button>
                    )}
                    
                    {/* Clear current session button */}
                    {currentPresentationId && (
                      <button
                        onClick={() => {
                          handleReset();
                          setError("Cleared active presentation session. You can now start a new one!");
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer"
                        title="Start a fresh draft session"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Start Fresh Draft</span>
                      </button>
                    )}
                  </div>
                </div>

                {savedPresentations.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
                      <History className="w-8 h-8" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-700">No saved presentations yet</h3>
                    <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
                      As soon as you type or generate an outline blueprint, your presentation drafts will automatically persist here.
                    </p>
                    <button
                      onClick={() => handleSidebarTabChange("slides")}
                      className="mt-5 px-5 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-xl border border-sky-100 transition cursor-pointer"
                    >
                      Create a Presentation Now
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedPresentations.map((deck) => {
                      const isCurrentActive = currentPresentationId === deck.id;
                      const slideCount = deck.context.slides.length;
                      const hasTheme = !!deck.context.chosenTheme;
                      
                      return (
                        <div
                          key={deck.id}
                          onClick={() => handleLoadDeck(deck)}
                          className={`group bg-white p-5 rounded-2xl border transition-all duration-200 flex flex-col gap-4 text-left cursor-pointer hover:shadow-lg relative overflow-hidden ${
                            isCurrentActive 
                              ? "border-sky-500 ring-2 ring-sky-500/10 shadow-sm" 
                              : "border-slate-200/80 hover:border-slate-300 shadow-sm"
                          }`}
                        >
                          {/* Active Indicator Top Edge line */}
                          {isCurrentActive && (
                            <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500" />
                          )}

                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-sky-600 transition" title={deck.topic}>
                                {deck.topic}
                              </h4>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{deck.timestamp}</p>
                            </div>

                            {/* Delete button */}
                            <button
                              onClick={(e) => handleDeleteDeck(deck.id, e)}
                              className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                              title="Delete this saved deck"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Deck info parameters */}
                          <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 font-semibold text-slate-600">
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 block uppercase">Slides</span>
                              <span>{slideCount > 0 ? `${slideCount} Cards` : "Outline draft"}</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 block uppercase">Step</span>
                              <span className="capitalize">{deck.step === "ingestion" ? "Planning" : deck.step}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-[9px] font-bold text-slate-400 block uppercase">Audience</span>
                              <span className="truncate block">{deck.context.audience || "General"}</span>
                            </div>
                          </div>

                          {/* Action footer */}
                          <div className="flex items-center justify-between text-[11px] font-bold pt-1">
                            <span className="flex items-center gap-1.5">
                              {hasTheme ? (
                                <>
                                  <div 
                                    className="w-3 h-3 rounded-full border border-slate-100" 
                                    style={{ backgroundColor: deck.context.chosenTheme?.colorPalette.primary }}
                                  />
                                  <span className="text-slate-500 font-mono text-[9px]">{deck.context.chosenTheme?.name}</span>
                                </>
                              ) : (
                                <span className="text-slate-400 font-normal">No style chosen</span>
                              )}
                            </span>

                            <span className="text-sky-600 group-hover:translate-x-1 transition-transform duration-200 flex items-center gap-0.5">
                              <span>{isCurrentActive ? "Active Session" : "Load Deck"}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* MAIN AI PRESENTATION FLOW */}
            {sidebarTab === "slides" && (
              <AnimatePresence mode="wait">
                
                {/* STEP 1: Ingestion Screen (Screenshot Replica with Sky Blue/White styling) */}
                {step === "ingestion" && (
                  <motion.div
                    key="ingestion"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="flex-1 p-6 md:p-12 max-w-4xl mx-auto w-full flex flex-col gap-6 justify-center"
                  >
                    
                    {/* Top Headline labels */}
                    <div className="flex flex-col gap-1 text-left">
                      <span className="text-xs font-bold text-sky-600 tracking-wider uppercase">The Best AI-Powered Presentation Creator</span>
                      <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight leading-tight">
                        Generate your perfect presentation title here
                      </h2>
                    </div>

                    {/* Source Selection Pill tabs */}
                    <div className="grid grid-cols-4 gap-2 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100">
                      {[
                        { id: "generate", label: "Generate", icon: Sparkles },
                        { id: "file", label: "Import File", icon: UploadCloud },
                        { id: "url", label: "Import URL", icon: Link },
                        { id: "text", label: "Paste in text", icon: Clipboard }
                      ].map((tab) => {
                        const Icon = tab.icon;
                        const isSelected = activeSourceTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            id={`tab-${tab.id}`}
                            onClick={() => setActiveSourceTab(tab.id as any)}
                            className={`flex flex-col md:flex-row items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold relative transition-all cursor-pointer ${
                              isSelected
                                ? "bg-white text-sky-700 shadow-sm border border-slate-200"
                                : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${isSelected ? "text-sky-600" : "text-slate-400"}`} />
                            <span className="truncate">{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Input/Source Form Card */}
                    <div className="bg-white border border-slate-200/60 rounded-[32px] p-6 md:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.03)] flex flex-col gap-6">
                      
                      {/* Active Input Panels */}
                      {activeSourceTab === "generate" && (
                        <div className="flex flex-col gap-3">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Write one magical paragraph or idea</label>
                          <div className="relative flex items-center">
                            <textarea
                              id="main-idea-prompt"
                              className="w-full min-h-[110px] bg-slate-50/50 border border-slate-200 rounded-2xl p-4 pr-16 text-xs md:text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white transition-all outline-none resize-none leading-relaxed"
                              placeholder="Type your magical presentation idea or core storyboard elements..."
                              value={context.prompt}
                              onChange={(e) => setContext({ ...context, prompt: e.target.value })}
                            />
                            {/* Circular Sky Blue Button on the right */}
                            <button
                              onClick={handleAnalyzePrompt}
                              id="prompt-submit-circle"
                              className="absolute right-3 bottom-3 w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center transition-all cursor-pointer shadow-md shadow-sky-500/20 active:scale-95"
                              title="Generate Outline"
                            >
                              <ArrowRight className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {activeSourceTab === "file" && (
                        <div 
                          className="border-2 border-dashed border-slate-200 bg-slate-50/40 rounded-2xl p-6 text-center flex flex-col items-center gap-3 transition hover:border-sky-400"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={handleFileDrop}
                        >
                          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
                            <UploadCloud className="w-8 h-8" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">Drag & drop presentation source files here</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Supports PDF, DOCX, TXT, or PPT (Max 25MB)</p>
                          </div>
                          <div className="flex gap-2 items-center">
                            <input
                              type="file"
                              id="mock-file-input"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  setUploadedFileName(e.target.files[0].name);
                                }
                              }}
                            />
                            <label
                              htmlFor="mock-file-input"
                              className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-50 transition"
                            >
                              Choose File
                            </label>
                            {uploadedFileName && (
                              <span className="text-xs text-sky-600 font-semibold truncate max-w-[200px]">{uploadedFileName}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {activeSourceTab === "url" && (
                        <div className="flex flex-col gap-3">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paste Source URL Link</label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Link className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                              <input
                                type="url"
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-800 outline-none focus:border-sky-500 focus:bg-white transition"
                                placeholder="https://example.com/project-brief-documentation"
                                value={inputUrl}
                                onChange={(e) => setInputUrl(e.target.value)}
                              />
                            </div>
                            <button 
                              onClick={() => setInputUrl("https://en.wikipedia.org/wiki/Regenerative_agriculture")}
                              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                            >
                              Insert Demo URL
                            </button>
                          </div>
                        </div>
                      )}

                      {activeSourceTab === "text" && (
                        <div className="flex flex-col gap-3">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paste raw textual notes</label>
                          <textarea
                            className="w-full h-24 bg-slate-50/50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:border-sky-500 focus:bg-white transition"
                            placeholder="Paste long-form reports or raw slide transcripts directly here..."
                            value={pasteRawText}
                            onChange={(e) => setPasteRawText(e.target.value)}
                          />
                        </div>
                      )}

                      {/* Select Dropdown menus for parameters (investors, cards count, language, text style) */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
                        
                        {/* 1. Audience dropdown */}
                        <div className="relative">
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">AUDIENCE</label>
                          <button
                            onClick={() => {
                              setShowAudienceMenu(!showAudienceMenu);
                              setShowCardMenu(false); setShowLangMenu(false); setShowLengthMenu(false);
                            }}
                            className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl py-2 px-3 text-xs text-slate-700 font-semibold flex items-center justify-between transition cursor-pointer"
                          >
                            <span className="truncate">{selectedAudience}</span>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                          {showAudienceMenu && (
                            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden font-medium">
                              {["Investors", "Engineering Leadership", "Executive Board", "Sales Team", "General Public"].map((aud) => (
                                <div
                                  key={aud}
                                  onClick={() => { setSelectedAudience(aud); setShowAudienceMenu(false); }}
                                  className="px-3 py-2 text-xs hover:bg-sky-50 hover:text-sky-700 cursor-pointer transition"
                                >
                                  {aud}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 2. Slide count card dropdown */}
                        <div className="relative">
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">LENGTH</label>
                          <button
                            onClick={() => {
                              setShowCardMenu(!showCardMenu);
                              setShowAudienceMenu(false); setShowLangMenu(false); setShowLengthMenu(false);
                            }}
                            className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl py-2 px-3 text-xs text-slate-700 font-semibold flex items-center justify-between transition cursor-pointer"
                          >
                            <span className="truncate">{selectedCardCount}</span>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                          {showCardMenu && (
                            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden font-medium">
                              {["1-5 cards", "6-10 cards", "11-15 cards", "16-20 cards"].map((card) => (
                                <div
                                  key={card}
                                  onClick={() => { setSelectedCardCount(card); setShowCardMenu(false); }}
                                  className="px-3 py-2 text-xs hover:bg-sky-50 hover:text-sky-700 cursor-pointer transition"
                                >
                                  {card}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 3. Language dropdown */}
                        <div className="relative">
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">LANGUAGE</label>
                          <button
                            onClick={() => {
                              setShowLangMenu(!showLangMenu);
                              setShowAudienceMenu(false); setShowCardMenu(false); setShowLengthMenu(false);
                            }}
                            className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl py-2 px-3 text-xs text-slate-700 font-semibold flex items-center justify-between transition cursor-pointer"
                          >
                            <span className="truncate">{selectedLanguage}</span>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                          {showLangMenu && (
                            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden font-medium">
                              {["English", "Spanish", "French", "German", "Japanese"].map((lang) => (
                                <div
                                  key={lang}
                                  onClick={() => { setSelectedLanguage(lang); setShowLangMenu(false); }}
                                  className="px-3 py-2 text-xs hover:bg-sky-50 hover:text-sky-700 cursor-pointer transition"
                                >
                                  {lang}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 4. Text length style dropdown */}
                        <div className="relative">
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">TEXT STYLE</label>
                          <button
                            onClick={() => {
                              setShowLengthMenu(!showLengthMenu);
                              setShowAudienceMenu(false); setShowCardMenu(false); setShowLangMenu(false);
                            }}
                            className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl py-2 px-3 text-xs text-slate-700 font-semibold flex items-center justify-between transition cursor-pointer"
                          >
                            <span className="truncate">{selectedTextLength}</span>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                          {showLengthMenu && (
                            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden font-medium">
                              {["Short & Punchy", "Detailed", "Comprehensive"].map((len) => (
                                <div
                                  key={len}
                                  onClick={() => { setSelectedTextLength(len); setShowLengthMenu(false); }}
                                  className="px-3 py-2 text-xs hover:bg-sky-50 hover:text-sky-700 cursor-pointer transition"
                                >
                                  {len}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Main action triggers inside the card */}
                      <div className="flex gap-4 justify-between items-center pt-2 font-bold text-xs">
                        <span className="text-slate-400 font-mono tracking-tight uppercase">Topic: {context.topic || "Ready"}</span>
                        <button
                          onClick={handleAnalyzePrompt}
                          id="primary-generate-button"
                          className="bg-sky-600 hover:bg-sky-700 text-white font-sans font-bold px-6 py-3 rounded-full flex items-center gap-1.5 transition-all shadow-md shadow-sky-500/10 cursor-pointer"
                        >
                          <span>Analyze Topic details</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>

                    </div>

                    {/* Status instructions bullet points mimicking the screenshot below prompt card */}
                    <div className="flex flex-col gap-2 p-5 bg-white border border-slate-200/60 rounded-2xl text-[11px] md:text-xs text-slate-500">
                      <div className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5" />
                        <span>Craft Stunning Presentations Effortlessly - Try Our AI-Powered Presentations Today</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5" />
                        <span>Specify key visual theme colors and narrative tones through the Strategist Concepting Proposal.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5" />
                        <span>Here's the outline for you. What do you think?</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5" />
                        <span>Congratulations! You have started your work with the help of AI.</span>
                      </div>
                    </div>

                    {/* Onboarding Examples bento layout */}
                    <div className="flex flex-col gap-3 pt-2">
                      <span className="text-xs font-bold text-slate-400 tracking-wide block">Need inspiration? Select a sample project outline:</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {EXAMPLES.map((ex, i) => (
                          <div
                            key={i}
                            onClick={() => handleSelectExample(ex)}
                            className="bg-white hover:border-sky-400 border border-slate-200/60 p-4 rounded-2xl cursor-pointer transition-all flex flex-col gap-1.5 shadow-xs text-left"
                          >
                            <span className="text-xs font-bold text-slate-800">{ex.label}</span>
                            <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{ex.prompt}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                  </motion.div>
                )}

                {/* STEP 1B: Clarification screen */}
                {step === "clarification" && (
                  <motion.div
                    key="clarification"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="flex-1 flex items-center justify-center p-6 bg-slate-50"
                  >
                    <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col gap-6 text-left">
                      <div className="flex items-center gap-3">
                        <div className="bg-sky-50 p-2.5 rounded-xl border border-sky-100">
                          <HelpCircle className="w-5 h-5 text-sky-600" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-slate-800">Refining Your Presentation Story</h2>
                          <p className="text-xs text-slate-500">Answer these 1 or 2 core questions to sharpen the outline narrative.</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-5 mt-4">
                        {context.clarifyingQuestions.map((q, idx) => (
                          <div key={idx} className="flex flex-col gap-2.5 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                            <span className="text-xs font-bold text-sky-700">Question {idx + 1}: {q}</span>
                            <textarea
                              className="w-full h-20 bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:border-sky-500 transition resize-none placeholder:text-slate-400"
                              placeholder="Type your clarification answer..."
                              value={context.clarifyingAnswers[q] || ""}
                              onChange={(e) => {
                                const updated = { ...context.clarifyingAnswers };
                                updated[q] = e.target.value;
                                setContext({ ...context, clarifyingAnswers: updated });
                              }}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <button
                          onClick={() => setStep("themes")}
                          className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold py-3.5 rounded-full text-xs transition cursor-pointer"
                        >
                          Bypass & Propose Themes
                        </button>
                        <button
                          onClick={handleClarifySubmit}
                          className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-full text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                        >
                          <span>Finalize Alignment</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: Theme Selection Screen */}
                {step === "themes" && (
                  <motion.div
                    key="themes"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-8 flex flex-col gap-6 justify-center"
                  >
                    {/* Header Card */}
                    <div className="bg-white rounded-[24px] p-6 border border-slate-200 shadow-xs flex gap-6 items-start w-full text-left">
                      <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex-shrink-0 flex items-center justify-center font-extrabold text-xl shadow-inner">S</div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-slate-800 mb-1">Strategist's Concept Proposal</h2>
                        <p className="text-slate-500 text-sm leading-relaxed">
                          I've synthesized your project details for <span className="text-sky-600 font-bold italic">"{context.topic}"</span>. Please select the narrative framework that aligns with your goals.
                        </p>
                      </div>
                    </div>

                    {/* Grid of 3 columns matching design */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch w-full mx-auto text-left">
                      {context.themes.map((theme, index) => {
                        const isRecommended = index === 1; // Middle recommended
                        return (
                          <div
                            key={theme.id}
                            onClick={() => handleSelectThemeAndGenerate(theme)}
                            className={`rounded-3xl p-6 flex flex-col transform hover:scale-[1.01] transition-all cursor-pointer border ${
                              isRecommended 
                                ? "bg-slate-900 text-white shadow-xl border-sky-400" 
                                : "bg-white text-slate-800 border-slate-200 hover:border-sky-400"
                            }`}
                          >
                            <div className={`aspect-video w-full rounded-2xl mb-6 flex items-center justify-center ${
                              isRecommended ? "bg-white/10" : "bg-slate-50"
                            }`}>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colorPalette.primary }} />
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colorPalette.secondary }} />
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colorPalette.background }} />
                              </div>
                            </div>

                            <div className="flex justify-between items-center mb-4">
                              <h3 className="text-lg font-bold">{theme.name}</h3>
                              {isRecommended && (
                                <span className="bg-sky-500 text-white text-[8px] px-2.5 py-1 rounded-full uppercase font-extrabold tracking-wider shadow-md">Recommended</span>
                              )}
                            </div>

                            <span className={`text-[9px] uppercase tracking-wider font-black mb-1.5 ${isRecommended ? "text-sky-300" : "text-sky-600"}`}>The Narrative Angle</span>
                            <p className={`text-xs leading-relaxed mb-6 flex-1 ${isRecommended ? "text-slate-300" : "text-slate-500"}`}>{theme.narrativeAngle}</p>

                            <div className={`pt-4 border-t ${isRecommended ? "border-white/10" : "border-slate-100"}`}>
                              <p className={`text-[9px] uppercase font-bold mb-1 ${isRecommended ? "text-white/50" : "text-slate-400"}`}>Visual Style</p>
                              <p className={`text-[11px] italic ${isRecommended ? "text-slate-400" : "text-slate-500"}`}>{theme.visualStyle}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setStep("ingestion")}
                      className="self-center flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 mt-2 font-bold cursor-pointer transition"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Back to Prompt configuration</span>
                    </button>
                  </motion.div>
                )}

                {/* ACTIVE PRESENTATION BLUEPRINT & OUTLINE WORKSPACE (Draft & Review Steps) */}
                {(step === "draft" || step === "review") && context.chosenTheme && (
                  <motion.div
                    key="workspace"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col"
                  >
                    
                    {/* Workspace Segment Sub-Header Selector (Outline vs Visual vs Both) */}
                    <div className="border-b border-slate-100 bg-white px-6 py-2 flex justify-between items-center z-10">
                      <div className="flex gap-2">
                        {[
                          { id: "outline", label: "Outline Editor", icon: FileText },
                          { id: "visual", label: "Visual Deck Preview", icon: Monitor },
                          { id: "both", label: "Split View", icon: Sliders }
                        ].map((mode) => {
                          const Icon = mode.icon;
                          const isActive = workspaceMode === mode.id;
                          return (
                            <button
                              key={mode.id}
                              onClick={() => setWorkspaceMode(mode.id as any)}
                              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                                isActive 
                                  ? "bg-sky-500 text-white shadow-sm" 
                                  : "text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              <span>{mode.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Display summary status & regeneration button to maximize slides with solution */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleSelectThemeAndGenerate(context.chosenTheme!)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-lg transition text-xs font-bold cursor-pointer shadow-xs"
                          title="Regenerate slides to maximize the conceptual solution and exclude past case studies"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Maximize Solution Slides</span>
                        </button>
                        
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest hidden md:inline">
                          Storyboard status: draft active ({context.slides.length} cards)
                        </span>
                      </div>
                    </div>

                    {/* Main Layout Container based on view mode selection */}
                    <div className="flex-1 flex flex-col md:flex-row bg-[#f8fafc] overflow-hidden">
                      
                      {/* SUB-SECTION A: TREE-CONNECTED OUTLINE EDITOR (Matches requested Screenshot layout) */}
                      {(workspaceMode === "outline" || workspaceMode === "both") && (
                        <div className="flex-1 p-6 md:p-8 flex flex-col gap-6 overflow-y-auto max-h-[calc(100vh-140px)] border-r border-slate-100/80 bg-white">
                          
                          {/* Outline Header Replica */}
                          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                              <h2 className="text-base font-bold text-slate-800">You can edit the outline below</h2>
                              <p className="text-[11px] text-slate-400">Click slide titles or bullet points to edit inline instantly.</p>
                            </div>
                            <button
                              onClick={handleDownloadPPTX}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 border border-sky-100 rounded-lg hover:bg-sky-100 transition text-xs font-bold cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </button>
                          </div>

                          {/* OUTLINE TREE TREE-VIEW */}
                          <div className="flex flex-col gap-8 text-left mt-2">
                            {context.slides.map((slide, slideIdx) => {
                              const isActive = slideIdx === activeSlideIdx;
                              return (
                                <div 
                                  key={slide.number}
                                  onClick={() => setActiveSlideIdx(slideIdx)}
                                  className={`flex flex-col p-4 rounded-2xl transition-all border ${
                                    isActive 
                                      ? "bg-sky-50/20 border-sky-200/60 shadow-sm" 
                                      : "border-transparent hover:bg-slate-50/40"
                                  }`}
                                >
                                  {/* Title row */}
                                  <div className="flex items-start gap-4">
                                    {/* Left Badge representing Section */}
                                    <div className="bg-sky-50 text-sky-700 border border-sky-100 px-3 py-1 rounded-lg text-[10px] font-extrabold tracking-tight uppercase min-w-[85px] text-center self-start shadow-xs">
                                      Section {slide.number}
                                    </div>

                                    {/* Editable Title Content */}
                                    <div className="flex-1">
                                      {editingOutlineItem?.slideIdx === slideIdx && editingOutlineItem?.type === "title" ? (
                                        <div className="flex gap-2">
                                          <input
                                            type="text"
                                            className="flex-1 bg-white border border-sky-400 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none"
                                            value={outlineEditValue}
                                            onChange={(e) => setOutlineEditValue(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") handleSaveInlineEdit();
                                            }}
                                            autoFocus
                                          />
                                          <button onClick={handleSaveInlineEdit} className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition"><Check className="w-4 h-4" /></button>
                                          <button onClick={() => setEditingOutlineItem(null)} className="p-1.5 bg-slate-50 text-slate-400 rounded hover:bg-slate-100 transition"><X className="w-4 h-4" /></button>
                                        </div>
                                      ) : (
                                        <div className="group flex items-center gap-2 cursor-pointer">
                                          <h3 className="text-xs md:text-sm font-bold text-slate-800 hover:text-sky-600 transition">
                                            {slide.title}
                                          </h3>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingOutlineItem({ slideIdx, type: "title" });
                                              setOutlineEditValue(slide.title);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-sky-600 transition"
                                            title="Edit Title"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      )}
                                      <p className="text-[11px] text-slate-400 italic mt-0.5">{slide.headline}</p>
                                    </div>

                                    {/* Option to delete slide in outline */}
                                    {context.slides.length > 1 && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteSlide(slideIdx);
                                        }}
                                        className="text-slate-300 hover:text-red-500 p-1 transition"
                                        title="Delete Section"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>

                                  {/* Bullets child tree connection (dotted outline structure) */}
                                  <div className="border-l-2 border-dashed border-sky-100 ml-[42px] pl-6 pt-3 mt-1.5 space-y-3.5">
                                    {slide.bullets.map((bullet, bulletIdx) => (
                                      <div key={bulletIdx} className="relative flex items-center gap-2 group">
                                        
                                        {/* Connector horizontal guide line */}
                                        <div className="absolute -left-[26px] top-1/2 w-4 border-t border-dashed border-sky-100" />
                                        
                                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0" />
                                        
                                        {editingOutlineItem?.slideIdx === slideIdx && editingOutlineItem?.type === "bullet" && editingOutlineItem?.bulletIdx === bulletIdx ? (
                                          <div className="flex gap-2 flex-1">
                                            <input
                                              type="text"
                                              className="flex-1 bg-white border border-sky-400 rounded-lg px-2 py-0.5 text-xs text-slate-800 outline-none"
                                              value={outlineEditValue}
                                              onChange={(e) => setOutlineEditValue(e.target.value)}
                                              onKeyDown={(e) => {
                                                if (e.key === "Enter") handleSaveInlineEdit();
                                              }}
                                              autoFocus
                                            />
                                            <button onClick={handleSaveInlineEdit} className="p-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition"><Check className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => setEditingOutlineItem(null)} className="p-1 bg-slate-50 text-slate-400 rounded hover:bg-slate-100 transition"><X className="w-3.5 h-3.5" /></button>
                                          </div>
                                        ) : (
                                          <div className="flex-1 flex items-center gap-2">
                                            <p className="text-xs text-slate-600 leading-relaxed group-hover:text-slate-800 transition">
                                              {bullet}
                                            </p>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingOutlineItem({ slideIdx, type: "bullet", bulletIdx });
                                                setOutlineEditValue(bullet);
                                              }}
                                              className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-sky-600 transition"
                                              title="Edit Point"
                                            >
                                              <Edit2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    ))}

                                    {/* Quick insert bullet point link */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const updatedBullets = [...slide.bullets, "New research bullet point"];
                                        handleUpdateSlide({ ...slide, bullets: updatedBullets });
                                      }}
                                      className="text-[10px] text-sky-500 hover:text-sky-700 font-bold flex items-center gap-1 cursor-pointer hover:underline pt-1.5"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>Add Supporting Point</span>
                                    </button>
                                  </div>

                                </div>
                              );
                            })}
                          </div>

                          {/* Try Again & Generate Deck Trigger Row below Outline */}
                          <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-4 gap-4">
                            <button
                              onClick={handleReset}
                              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold px-5 py-3 rounded-full text-xs transition cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Try again</span>
                            </button>

                            <div className="flex gap-2">
                              {workspaceMode === "outline" && (
                                <button
                                  onClick={() => setWorkspaceMode("both")}
                                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-full transition cursor-pointer"
                                >
                                  Preview Slide Designs
                                </button>
                              )}
                              <button
                                onClick={handleFinalizeDeck}
                                className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white font-sans font-bold px-7 py-3 rounded-full text-xs transition-all flex items-center gap-1.5 shadow-md shadow-sky-500/15 cursor-pointer"
                              >
                                <span>Generate my presentation</span>
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                        </div>
                      )}

                      {/* SUB-SECTION B: VISUAL PREVIEW & CO-PILOT (Draft & Review Stage Panels) */}
                      {(workspaceMode === "visual" || workspaceMode === "both") && (
                        <div className="flex-1 flex flex-col md:flex-row min-w-0 max-h-[calc(100vh-140px)]">
                          
                          {/* Center Column: Presentation Stage Canvas */}
                          <section className="flex-1 p-5 md:p-6 flex flex-col justify-between gap-5 overflow-y-auto bg-slate-50 min-w-0">
                            
                            {/* Slide Canvas Render */}
                            {context.slides[activeSlideIdx] ? (
                              <SlideViewer
                                slide={context.slides[activeSlideIdx]}
                                theme={context.chosenTheme}
                                onUpdateSlide={handleUpdateSlide}
                                onPrev={() => setActiveSlideIdx(prev => prev - 1)}
                                onNext={() => setActiveSlideIdx(prev => prev + 1)}
                                hasPrev={activeSlideIdx > 0}
                                hasNext={activeSlideIdx < context.slides.length - 1}
                                currentIndex={activeSlideIdx}
                                totalSlides={context.slides.length}
                                isCopilotMinimized={isCopilotMinimized}
                                onToggleCopilot={() => setIsCopilotMinimized(prev => !prev)}
                              />
                            ) : (
                              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                                <Monitor className="w-12 h-12 stroke-1 opacity-50 mb-3" />
                                <span className="text-xs font-semibold">No slides available. Insert a slide to start building.</span>
                              </div>
                            )}

                            {/* Horizontal Controls (Status & Actions, navigation is conveniently placed adjacent to the Slide Canvas above) */}
                            <div className="flex items-center justify-end border-t border-slate-200/60 pt-4 mt-2">
                              <div className="flex items-center gap-2">
                                {outlineFinalized ? (
                                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Blueprint Ready</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={handleFinalizeDeck}
                                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-5 py-2.5 rounded-full transition shadow-sm cursor-pointer"
                                  >
                                    Finalize Draft
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Finalized Banner Option */}
                            {outlineFinalized && (
                              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 mt-2 shadow-xs text-left">
                                <div className="flex items-center gap-2.5">
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                  <p className="text-xs text-emerald-800 font-semibold">
                                    Presentation finalized. Export to download native PowerPoint slides.
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <label className="flex items-center gap-2 bg-white border border-emerald-100 text-slate-700 text-xs px-3 py-2.5 rounded-full shadow-sm">
                                    <Palette className="w-3.5 h-3.5 text-indigo-600" />
                                    <select
                                      value={selectedDeckTemplate}
                                      onChange={(event) => setSelectedDeckTemplate(event.target.value as DeckTemplateId)}
                                      className="bg-transparent text-xs font-bold outline-none cursor-pointer"
                                      aria-label="Beautiful deck template"
                                    >
                                      {DECK_TEMPLATE_OPTIONS.map((template) => (
                                        <option key={template.id} value={template.id}>
                                          {template.label}
                                        </option>
                                      ))}
                                    </select>
                                  </label>

                                  <button
                                    onClick={handleDownloadPPTX}
                                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-5 py-2.5 rounded-full transition font-bold cursor-pointer shadow-md whitespace-nowrap"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Download .PPTX</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={handleGenerateBeautifulDeck}
                                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-5 py-2.5 rounded-full transition font-bold cursor-pointer shadow-md whitespace-nowrap"
                                  >
                                    Generate Beautiful Deck
                                  </button>


                                  {uploadedDriveLink ? (
                                    <div className="flex items-center gap-1.5">
                                      <a
                                        href={uploadedDriveLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs px-5 py-2.5 rounded-full transition font-bold cursor-pointer shadow-md whitespace-nowrap"
                                        referrerPolicy="no-referrer"
                                      >
                                        <Globe className="w-3.5 h-3.5" />
                                        <span>Open in Google Slides</span>
                                      </a>
                                      <button
                                        onClick={handleSaveToGoogleDrive}
                                        disabled={isUploadingToDrive}
                                        className="text-xs text-sky-600 hover:text-sky-700 font-bold px-2 py-1 transition cursor-pointer disabled:opacity-50"
                                        title="Re-save to Google Drive"
                                      >
                                        <RefreshCw className={`w-3.5 h-3.5 ${isUploadingToDrive ? "animate-spin" : ""}`} />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={handleSaveToGoogleDrive}
                                      disabled={isUploadingToDrive}
                                      className="flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs px-5 py-2.5 rounded-full transition font-bold cursor-pointer shadow-sm whitespace-nowrap disabled:opacity-50"
                                    >
                                      <UploadCloud className={`w-3.5 h-3.5 ${isUploadingToDrive ? "animate-bounce" : ""}`} />
                                      <span>{isUploadingToDrive ? "Saving to Drive..." : "Save to Google Drive"}</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                          </section>

                          {/* Right Column: AI Co-Pilot Narrative Chat Panel */}
                          {!isCopilotMinimized ? (
                            <aside className="w-full md:w-80 border-l border-slate-200 bg-white p-5 flex flex-col justify-between gap-4 overflow-y-auto">
                              <div className="flex flex-col gap-4 overflow-hidden flex-1 text-left">
                                
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-sky-600" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Co-Pilot Assistant</span>
                                  </div>
                                  <button
                                    onClick={() => setIsCopilotMinimized(true)}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-pointer transition flex items-center justify-center"
                                    title="Minimize Co-Pilot"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                                
                                <div className="text-[10px] text-slate-500 bg-slate-50 border border-slate-100 p-3.5 rounded-xl font-medium">
                                  <span className="font-bold text-sky-700 block mb-1">PRO TIP: Try typing these instructions:</span>
                                  <ul className="list-disc pl-3.5 space-y-1">
                                    <li>"Add a new slide about security"</li>
                                    <li>"Make all bullet points shorter"</li>
                                    <li>"Rewrite slide 2 in a confident tone"</li>
                                  </ul>
                                </div>
                                
                                {/* Chat message logs */}
                                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                                  {chatLog.map((log, idx) => (
                                    <div
                                      key={idx}
                                      className={`flex flex-col gap-1 p-3.5 text-xs leading-relaxed max-w-[90%] shadow-xs ${
                                        log.sender === "user"
                                          ? "bg-slate-100 text-slate-800 rounded-[20px] rounded-br-none ml-auto"
                                          : "bg-sky-600 text-white rounded-[20px] rounded-bl-none mr-auto"
                                      }`}
                                    >
                                      <span className={`text-[8px] tracking-widest uppercase font-bold ${log.sender === "user" ? "text-slate-400" : "text-white/60"}`}>
                                        {log.sender === "user" ? "You" : "Co-Pilot"}
                                      </span>
                                      <p className="whitespace-pre-wrap">{log.text}</p>
                                    </div>
                                  ))}
                                  
                                  {isChatting && (
                                    <div className="bg-slate-100 text-slate-800 mr-auto p-3 rounded-[20px] rounded-bl-none text-xs flex items-center gap-2 max-w-[90%] shadow-xs font-semibold">
                                      <div className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                                      <div className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                                      <div className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-bounce" style={{ animationDelay: "300ms" }} />
                                      <span className="text-[10px] text-slate-400 pl-1">Strategizing...</span>
                                    </div>
                                  )}
                                </div>
                                
                              </div>
                              
                              {/* Chat controls */}
                              <div className="flex gap-2 pt-3 border-t border-slate-100">
                                <input
                                  type="text"
                                  className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-sky-500 focus:bg-white placeholder:text-slate-400"
                                  placeholder="Refine outline or change slide..."
                                  value={chatInput}
                                  onChange={(e) => setChatInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSendChat();
                                  }}
                                />
                                <button
                                  onClick={handleSendChat}
                                  className="p-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-full transition flex items-center justify-center cursor-pointer shadow-sm"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              
                            </aside>
                          ) : (
                            <aside className="border-l border-slate-200 bg-white p-3 flex flex-col items-center gap-4 w-12 justify-start pt-6 h-full shadow-xs">
                              <button
                                onClick={() => setIsCopilotMinimized(false)}
                                className="w-8 h-8 rounded-full bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-600 flex items-center justify-center cursor-pointer hover:scale-105 transition"
                                title="Expand Co-Pilot Assistant"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                            </aside>
                          )}

                        </div>
                      )}

                    </div>

                  </motion.div>
                )}

              </AnimatePresence>
            )}

          </div>

        </main>
      </div>

    </div>
  );
}
