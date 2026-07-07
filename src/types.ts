export interface ColorPalette {
  primary: string;
  secondary: string;
  background: string;
  text: string;
}

export interface PresentationTheme {
  id: string;
  name: string;
  visualStyle: string;
  narrativeAngle: string;
  colorPalette: ColorPalette;
}

export interface ElementStyle {
  fontSize?: number;
  fontFace?: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right';
  rotation?: number;
  flipH?: boolean;
  flipV?: boolean;
  scale?: number;
  cropX?: number;
  cropY?: number;
  cropW?: number;
  cropH?: number;
}

export interface Slide {
  number: number;
  title: string;
  headline: string;
  bullets: string[];
  visualSuggestion: string;
  speakerNotes: string;
  conceptImage?: string;
  conceptExplanation?: string;
  useImageOnSlide?: boolean;
  titleStyle?: ElementStyle;
  headlineStyle?: ElementStyle;
  bulletsStyle?: ElementStyle;
  imageStyle?: ElementStyle;
}

export interface PresentationContext {
  prompt: string;
  topic: string;
  audience: string;
  goal: string;
  isDetailed: boolean;
  clarifyingQuestions: string[];
  clarifyingAnswers: Record<string, string>;
  themes: PresentationTheme[];
  chosenTheme: PresentationTheme | null;
  slides: Slide[];
}

export type WorkflowStep = "ingestion" | "clarification" | "themes" | "draft" | "review";

export interface SavedPresentation {
  id: string;
  topic: string;
  timestamp: string;
  step: WorkflowStep;
  context: PresentationContext;
  activeSlideIdx: number;
  outlineFinalized: boolean;
}

