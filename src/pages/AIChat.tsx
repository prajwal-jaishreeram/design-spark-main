import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useCredits } from "@/hooks/useCredits";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles, Send, Plus, Code, ChevronDown, ThumbsUp, ThumbsDown,
  Copy, MoreHorizontal, ArrowLeft, Settings, Star, FolderInput, Info,
  Moon, HelpCircle, Edit3, GitBranch, ExternalLink, History, PanelLeft,
  Globe, Cloud, BarChart3, RefreshCw, Share2, Monitor, Tablet, Smartphone, X,
  Loader2, Pause, Play, Pencil, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { DesignSelectionModal } from "@/components/DesignSelectionModal";
import { SectionProgress, type SectionItem } from "@/components/SectionProgress";
import { GitHubConnectModal } from "@/components/GitHubConnectModal";
import * as api from "@/lib/api";
import { AuthError } from "@/lib/api";
import { SandpackProvider, SandpackPreview } from "@codesandbox/sandpack-react";
import { CreditsExhaustedModal } from "@/components/CreditsExhaustedModal";

// --- Types ---
interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  messageType?: string;
}

interface DesignOption {
  id: string;
  imageUrl: string;
  prompt: string;
}

type PipelineStage =
  | "idle"
  | "questioning"
  | "generating_fullpage_designs"
  | "awaiting_selection"
  | "generating_all_code"
  | "project_complete";

type ViewportSize = "desktop" | "tablet" | "mobile";
type MobileTab = "chat" | "preview";

// --- Questions the AI asks before generating ---
const FALLBACK_QUESTIONS = [
  "What specific vibe or color scheme are you envisioning?",
  "What specific pages or sections do you want? (e.g., Hero, About, Gallery, Contact) or just say 'Standard' and I'll generate a typical layout.",
];

// --- Sub-components ---
function ChatMessage({ msg, onEditMessage, isTyping: chatIsTyping }: { msg: Message; onEditMessage?: (msgId: string, newContent: string) => void; isTyping?: boolean }) {
  const [editValue, setEditValue] = useState(msg.content);
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleEditClick = () => {
    if (chatIsTyping) return;
    setEditValue(msg.content);
    setShowRevertModal(true);
  };

  const handleRevertAndResend = () => {
    setShowRevertModal(false);
    onEditMessage?.(msg.id, editValue.trim());
  };

  return (
    <>
      <div className={cn("group flex", msg.role === "user" ? "justify-end" : "justify-start")}>
        {/* Edit/Copy icons for user messages (left side) */}
        {msg.role === "user" && (
          <div className="flex items-end gap-0.5 mr-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleEditClick}
              className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Edit message"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleCopy}
              className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Copy message"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}

        <div
          className={cn(
            "max-w-[90%] rounded-2xl px-3 md:px-4 py-2.5 md:py-3 text-sm leading-relaxed break-words overflow-hidden",
            msg.role === "user"
              ? "bg-primary text-primary-foreground"
              : msg.role === "system"
                ? "bg-muted/50 text-muted-foreground border border-border"
                : "bg-transparent text-foreground"
          )}
        >
          <div className="whitespace-pre-wrap">{msg.content}</div>

          {msg.role === "assistant" && (
            <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/30">
              <button className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <ThumbsUp className="h-3.5 w-3.5" />
              </button>
              <button className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <ThumbsDown className="h-3.5 w-3.5" />
              </button>
              <button onClick={handleCopy} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Revert and Resend Modal */}
      {showRevertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowRevertModal(false)}>
          <div
            className="bg-[#2f2f2f] rounded-2xl shadow-2xl w-[90%] max-w-[420px] p-6 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-[15px] font-semibold text-white leading-snug">
                Revert and resend<br />message?
              </h3>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="text-xs text-muted-foreground hover:text-white transition-colors flex items-center gap-1 mt-0.5"
              >
                Preview version <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Editable message area */}
            <div className="relative rounded-xl bg-[#424242] border border-[#555] p-3">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full bg-transparent text-sm outline-none resize-none min-h-[44px] text-white pr-8 leading-relaxed"
                autoFocus
              />
              <div className="absolute bottom-2.5 right-2.5">
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-primary-foreground" />
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-[13px] text-[#aaa] mt-4 leading-relaxed">
              Your message will be updated, and the conversation continues from here. Recent changes after this point stay in the chat and can be reapplied anytime.
            </p>

            {/* Buttons */}
            <div className="flex items-center gap-2 mt-5">
              <button
                onClick={() => setShowRevertModal(false)}
                className="flex-1 h-10 rounded-xl border border-[#555] text-sm font-medium text-white hover:bg-[#424242] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRevertAndResend}
                className="flex-1 h-10 rounded-xl bg-white text-[#2f2f2f] text-sm font-medium hover:bg-white/90 transition-colors"
              >
                Revert and resend
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-muted rounded-2xl px-4 py-3">
        <div className="flex gap-1">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectDropdown({ title, onClose }: { title: string; onClose: () => void }) {
  const navigate = useNavigate();
  const menuItems = [
    { type: "link" as const, icon: ArrowLeft, label: "Go to Dashboard", onClick: () => navigate("/dashboard") },
    { type: "divider" as const },
    { type: "link" as const, icon: Settings, label: "Settings", shortcut: "Ctrl ," },
    { type: "link" as const, icon: Edit3, label: "Rename project" },
    { type: "link" as const, icon: Star, label: "Star project" },
    { type: "link" as const, icon: FolderInput, label: "Move to folder" },
    { type: "link" as const, icon: Info, label: "Details" },
    { type: "divider" as const },
    { type: "link" as const, icon: Moon, label: "Appearance", hasSubmenu: true },
    { type: "link" as const, icon: HelpCircle, label: "Help", hasSubmenu: true },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute top-full left-0 mt-1 w-64 rounded-xl border border-border bg-card shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
        <div className="px-3 py-2.5 border-b border-border mb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center text-[11px] font-bold text-background">
              {title.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{title}</p>
              <p className="text-[11px] text-muted-foreground">AI-generated website</p>
            </div>
          </div>
        </div>
        {menuItems.map((item, i) => {
          if (item.type === "divider") return <div key={i} className="my-1 border-t border-border" />;
          const Icon = item.icon!;
          return (
            <button
              key={i}
              onClick={() => { item.onClick?.(); onClose(); }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.shortcut && <span className="text-[11px] text-muted-foreground/60">{item.shortcut}</span>}
            </button>
          );
        })}
      </div>
    </>
  );
}

// --- Main Component ---
const AIChat = () => {
  const { user, profile, pendingPrompt, setPendingPrompt } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { credits, useCredit, showCreditsModal, setShowCreditsModal } = useCredits();
  const { toast } = useToast();

  // Core state
  const [projectId, setProjectId] = useState<string | null>(searchParams.get("project"));
  const [projectTitle, setProjectTitle] = useState("New Project");
  const [projectDescription, setProjectDescription] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Pipeline state
  const [stage, setStage] = useState<PipelineStage>("idle");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [dynamicQuestions, setDynamicQuestions] = useState<string[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);

  const [designModalOpen, setDesignModalOpen] = useState(false);
  const [currentDesigns, setCurrentDesigns] = useState<DesignOption[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);

  // Preview state
  const [previewTab, setPreviewTab] = useState<"preview" | "code">("preview");
  const [generatedCode, setGeneratedCode] = useState<Record<string, string>>({});
  const [viewportSize, setViewportSize] = useState<ViewportSize>("desktop");
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [previewSectionId, setPreviewSectionId] = useState<string | null>(null);
  const [designSystem, setDesignSystem] = useState<any>(null);
  const [designTokens, setDesignTokens] = useState<any>(null);
  const [fullPageDesignUrl, setFullPageDesignUrl] = useState<string | null>(null);

  // GitHub state
  const [githubModalOpen, setGithubModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Handle incoming prompt
  useEffect(() => {
    const statePrompt = (location.state as { prompt?: string })?.prompt;
    const prompt = pendingPrompt?.prompt || statePrompt;
    if (prompt) {
      addMessage("user", prompt); // Show user's message in chat first
      if (isProjectRequest(prompt)) {
        startProject(prompt);
      } else {
        setIsTyping(true);
        handleCasualMessage(prompt);
      }
      setPendingPrompt(null);
      window.history.replaceState({}, document.title);
    }
  }, []);

  // Load existing project
  useEffect(() => {
    const pid = searchParams.get("project");
    if (pid) {
      loadProject(pid);
    }
  }, [searchParams]);

  const addMessage = useCallback((role: Message["role"], content: string, messageType = "chat") => {
    const msg: Message = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
      messageType,
    };
    setMessages((prev) => [...prev, msg]);
    return msg;
  }, []);

  const loadProject = async (pid: string) => {
    try {
      const project = await api.getProject(pid);
      setProjectId(pid);
      setProjectTitle(project.title);
      setProjectDescription(project.description || "");

      const msgs = await api.getMessages(pid);
      setMessages(msgs.map((m: Record<string, unknown>) => ({
        id: m.id as string,
        role: m.role as Message["role"],
        content: m.content as string,
        timestamp: new Date(m.created_at as string),
        messageType: m.message_type as string,
      })));

      if (project.project_sections?.length) {
        // Sort sections by order_index just to be safe
        const sortedSections = [...project.project_sections].sort(
          (a: Record<string, unknown>, b: Record<string, unknown>) => (a.order_index as number) - (b.order_index as number)
        );

        setSections(sortedSections.map((s: Record<string, unknown>) => ({
          id: s.id as string,
          section_type: s.section_type as string,
          section_title: s.section_title as string,
          sort_order: s.order_index as number,
          status: s.status as SectionItem["status"],
        })));

        // Load generated code
        const codeMap: Record<string, string> = {};
        for (const s of sortedSections) {
          if ((s as Record<string, unknown>).generated_code) {
            codeMap[(s as Record<string, unknown>).id as string] = (s as Record<string, unknown>).generated_code as string;
          }
        }
        setGeneratedCode(codeMap);

        // Load design tokens
        if (project.design_tokens) {
          setDesignTokens(project.design_tokens);
        }



        // Figure out where we left off
        const firstIncompleteIndex = sortedSections.findIndex((s: Record<string, unknown>) => s.status !== "complete");

        if (firstIncompleteIndex === -1) {
          setStage("project_complete");
        } else {
          setCurrentSectionIndex(firstIncompleteIndex);
          const currentSec = sortedSections[firstIncompleteIndex];
          setCurrentSectionId(currentSec.id as string);

          if (currentSec.status === "awaiting_selection") {
            setStage("awaiting_selection");
            // Load designs for this section to populate the modal
            if (currentSec.section_designs && Array.isArray(currentSec.section_designs)) {
              setCurrentDesigns(currentSec.section_designs.map((d: any) => ({
                id: d.id,
                imageUrl: d.image_url,
                prompt: d.prompt_used || ""
              })));
              setDesignModalOpen(true);
            } else {
              // If designs failed to load but status is awaiting, restart for safety
              setStage("idle");
              setSections(prev => prev.map((s, i) => i === firstIncompleteIndex ? { ...s, status: "pending" } : s));
            }
          } else if (currentSec.status === "generating_code" || currentSec.status === "generating_design" || currentSec.status === "generating_all_code" || currentSec.status === "generating_fullpage_designs") {
            // Processing was interrupted, reset to pending
            setStage("idle");
            setSections(prev => prev.map((s, i) => i === firstIncompleteIndex ? { ...s, status: "pending" } : s));
          } else {
            setStage("idle");
          }
        }
      }

      if (project.design_system) {
        setDesignSystem(project.design_system);
      }
    } catch {
      toast({ title: "Failed to load project", variant: "destructive" });
    }
  };

  const startProject = async (prompt: string) => {
    // Note: User message already added to local state in handleSendMessage
    console.log("[startProject] Starting with prompt:", prompt);
    setIsTyping(true);

    try {
      // Create project in DB
      const userId = user?.id;
      if (!userId) {
        throw new Error("Not authenticated. Please log in again.");
      }
      console.log("[startProject] Creating project for user:", userId);
      const project = await api.createProject(prompt.slice(0, 60), userId, prompt);
      console.log("[startProject] Project created:", project.id);
      setProjectId(project.id);
      setProjectTitle(project.title);
      setProjectDescription(prompt);

      // Persist project ID in URL so refresh reloads the project
      setSearchParams({ project: project.id }, { replace: true });

      // Save user message
      await api.addMessage(project.id, "user", prompt, "chat");
      console.log("[startProject] User message saved");

      // Start questioning
      setStage("questioning");
      setQuestionIndex(0);

      // Fetch dynamic questions
      addMessage("system", "Thinking of follow-up questions...");
      let questions = FALLBACK_QUESTIONS;
      try {
        console.log("[startProject] Fetching dynamic questions...");
        const { questions: fetchedQs } = await api.generateQuestions(prompt);
        console.log("[startProject] Got questions:", fetchedQs);
        if (fetchedQs && fetchedQs.length > 0) {
          questions = fetchedQs;
        }
      } catch (err) {
        console.error("[startProject] Failed to fetch dynamic questions, using fallback:", err);
      }
      setDynamicQuestions(questions);

      const firstQuestion = `Great! I'd love to help you build that.\n\n**${questions[0]}**`;
      addMessage("assistant", firstQuestion, "question");
      api.addMessage(project.id, "assistant", firstQuestion, "question");
      setIsTyping(false);
    } catch (error: unknown) {
      setIsTyping(false);
      if ((error as any)?.name === "AuthError" || error instanceof AuthError) {
        toast({ title: "Session Expired", description: "Your session has expired. Please log in again.", variant: "destructive" });
        navigate("/login");
        return;
      }
      const msg = error && typeof error === 'object' && 'message' in error
        ? String((error as { message: string }).message)
        : JSON.stringify(error);
      console.error("[startProject] FAILED:", msg, error);
      toast({ title: "Internal Error", description: `Failed to create project: ${msg}`, variant: "destructive" });
    }
  };

  // --- Intent classifier ---
  const isProjectRequest = (msg: string): boolean => {
    const lower = msg.toLowerCase().trim();
    // Too short to be a real project request
    if (lower.length < 8) return false;

    // Common greetings and casual messages
    const casualPatterns = /^(hi|hey|hello|yo|sup|hii+|hola|howdy|good\s*(morning|evening|afternoon|night)|what'?s?\s*up|how\s*are\s*you|thanks?|thank\s*you|ok|okay|sure|cool|nice|great|wow|lol|haha|help|\?)$/i;
    if (casualPatterns.test(lower)) return false;

    // Questions about the tool itself
    const metaPatterns = /^(what\s*(can|do)\s*you|how\s*does\s*this|who\s*are\s*you|what\s*is\s*this|tell\s*me\s*about)/i;
    if (metaPatterns.test(lower)) return false;

    // Project-related keywords
    const projectKeywords = /\b(website|web\s*site|web\s*app|webapp|landing\s*page|portfolio|blog|store|shop|e-?commerce|saas|dashboard|homepage|page|app|application|site|design|build|create|make|develop|code|generate|startup|business|company|brand|agency|restaurant|gym|clinic|hotel|real\s*estate|crypto|nft|marketplace|social|platform|forum|wiki|docs|documentation)\b/i;
    if (projectKeywords.test(lower)) return true;

    // Action verbs that suggest a request
    const actionPatterns = /^(i\s*(want|need|would\s*like)|can\s*you|please|make\s*me|build\s*me|create|design|generate|develop)/i;
    if (actionPatterns.test(lower)) return true;

    // If longer than 20 chars, likely a description even without keywords
    if (lower.length > 40) return true;

    return false;
  };

  const handleCasualMessage = (msg: string) => {
    const lower = msg.toLowerCase().trim();
    let response: string;

    if (/^(hi|hey|hello|yo|sup|hii+|hola|howdy)/.test(lower)) {
      response = `Hey there! 👋 I'm your AI website builder.\n\nTell me what kind of website you'd like to create and I'll design it for you — for example:\n- "Build me a modern SaaS landing page"\n- "Create a portfolio website for a photographer"\n- "Design an e-commerce store for sneakers"`;
    } else if (/^(what\s*(can|do)\s*you|how\s*does\s*this|what\s*is\s*this)/.test(lower)) {
      response = `I'm an AI-powered website builder! 🚀\n\nHere's how I work:\n1. **You describe** the website you want\n2. **I ask** a couple of clarifying questions\n3. **I generate** design options for each section\n4. **You pick** your favorites, and I write the code\n\nJust describe the website you'd like to create and we'll get started!`;
    } else if (/^(thanks?|thank\s*you)/.test(lower)) {
      response = `You're welcome! 😊 Let me know if you'd like to build something — just describe the website you have in mind.`;
    } else {
      response = `I'm not sure I understood that as a website request. 🤔\n\nCould you describe the website you'd like to build? For example:\n- "A modern portfolio for a designer"\n- "An e-commerce store selling coffee"\n- "A SaaS landing page for a project management tool"`;
    }

    setTimeout(() => {
      addMessage("assistant", response);
      setIsTyping(false);
    }, 500);
  };

  const handleSendMessage = async (text?: string) => {
    const msg = text || input.trim();
    console.log("[handleSendMessage] called, msg:", msg, "isTyping:", isTyping, "stage:", stage, "projectId:", projectId);
    if (!msg || isTyping) {
      console.log("[handleSendMessage] BLOCKED — msg empty:", !msg, "isTyping:", isTyping);
      return;
    }
    setInput("");

    addMessage("user", msg);
    if (projectId) {
      api.addMessage(projectId, "user", msg, stage === "questioning" ? "answer" : "chat");
    }

    if (!projectId && stage === "idle") {
      if (!isProjectRequest(msg)) {
        setIsTyping(true);
        handleCasualMessage(msg);
        return;
      }
      await startProject(msg);
    } else if (stage === "questioning") {
      await handleQuestionAnswer(msg);
    } else if (stage === "idle" && projectId) {
      const continuePattern = /^(yes|y|go|start|ok|okay|sure|continue|proceed|resume|next|keep going|do it)/i;
      if (continuePattern.test(msg.trim())) {
        handleFreeChat(msg);
      } else {
        handleFreeChat(msg);
      }
    } else if (stage === "project_complete") {
      // Free chat after project is done
      handleFreeChat(msg);
    }
  };

  const handleQuestionAnswer = async (answer: string) => {
    const qKey = `q${questionIndex}`;
    setUserAnswers((prev) => ({ ...prev, [qKey]: answer }));

    const nextIndex = questionIndex + 1;
    setIsTyping(true);

    if (nextIndex < dynamicQuestions.length) {
      // Ask next question
      setTimeout(() => {
        const nextQ = `Got it! **${dynamicQuestions[nextIndex]}**`;
        addMessage("assistant", nextQ, "question");
        if (projectId) api.addMessage(projectId, "assistant", nextQ, "question");
        setQuestionIndex(nextIndex);
        setIsTyping(false);
      }, 800);
    } else {
      // All questions answered — generate full-page designs
      const allAnswers = { ...userAnswers, [qKey]: answer };
      setUserAnswers(allAnswers);
      await generateFullPageDesigns(allAnswers);
    }
  };

  // =============================================
  // FULL-PAGE DESIGN APPROACH
  // =============================================

  const generateFullPageDesigns = async (answers: Record<string, string>) => {
    if (!projectId) return;

    setStage("generating_fullpage_designs");
    setIsTyping(true);
    addMessage("system", "🎨 Generating full-page website designs based on your requirements...");

    // Check credits
    const hasCredits = await useCredit(1, "generate full-page designs");
    if (!hasCredits) {
      setIsTyping(false);
      setStage("idle");
      return;
    }

    try {
      // Build project context from answers
      const businessContext = Object.values(answers).join(". ");

      // Auto-derive project name from answers
      const derivedName = Object.values(answers).find((a: string) =>
        a.length > 1 && a.length < 40 && /^[A-Z]/.test(a)
      ) || projectDescription.slice(0, 40);

      if (derivedName && projectId) {
        const cleanName = derivedName.replace(/['"]/g, '').trim().slice(0, 60);
        setProjectTitle(cleanName);
        api.updateProject(projectId, { title: cleanName });
      }

      // Build prompt directly — Ideogram's magic_prompt will enhance it
      const designPrompt = `Complete full-page website landing page design for: ${projectDescription}. Business: ${derivedName || projectDescription}. ${businessContext}`;

      // Generate 3 full-page designs (2:3 aspect ratio) — Ideogram handles prompt enhancement
      const { designs } = await api.generateDesigns(designPrompt, businessContext, 3);

      setCurrentDesigns(designs.map((d: { id: string; imageUrl: string }) => ({
        id: d.id,
        imageUrl: d.imageUrl,
        prompt: designPrompt,
      })));

      // Save thumbnail from first design
      if (projectId && designs.length > 0) {
        api.updateProject(projectId, { thumbnail_url: designs[0].imageUrl });
      }

      setIsTyping(false);
      addMessage("assistant", `Here are **${designs.length} full-page design options** for your website. Pick the one you like best! 👇\n\nThe AI will then analyze your chosen design and generate code for ALL sections at once.`);

      setStage("awaiting_selection");
      setDesignModalOpen(true);
    } catch (error) {
      setIsTyping(false);
      setStage("idle");
      if ((error as any)?.name === "AuthError" || error instanceof AuthError) {
        toast({ title: "Session Expired", description: "Your session has expired. Please log in again.", variant: "destructive" });
        navigate("/login");
        return;
      }
      toast({ title: "Design generation failed", description: "There was an error generating designs. Please try again.", variant: "destructive" });
    }
  };

  // --- Syntax validation helper ---
  const validateCodeSyntax = (code: string): string | null => {
    // Check for unmatched brackets/braces/parens
    const brackets: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
    const closers = new Set(Object.values(brackets));
    const stack: string[] = [];
    let inString = false;
    let stringChar = '';
    let inTemplate = false;
    let inJSX = false;

    for (let i = 0; i < code.length; i++) {
      const ch = code[i];
      const prev = i > 0 ? code[i - 1] : '';

      // Handle string boundaries
      if (!inString && !inTemplate && (ch === '"' || ch === "'" || ch === '`')) {
        if (ch === '`') {
          inTemplate = true;
        } else {
          inString = true;
          stringChar = ch;
        }
        continue;
      }
      if (inString && ch === stringChar && prev !== '\\') {
        inString = false;
        continue;
      }
      if (inTemplate && ch === '`' && prev !== '\\') {
        inTemplate = false;
        continue;
      }
      if (inString || inTemplate) continue;

      // Track JSX
      if (ch === '<' && /[A-Za-z/]/.test(code[i + 1] || '')) {
        inJSX = true;
      }
      if (inJSX && ch === '>') {
        inJSX = false;
      }

      // Track brackets
      if (brackets[ch]) {
        stack.push(brackets[ch]);
      } else if (closers.has(ch)) {
        if (stack.length === 0 || stack[stack.length - 1] !== ch) {
          return `Unmatched '${ch}' at position ${i}`;
        }
        stack.pop();
      }
    }

    if (stack.length > 0) {
      return `Unclosed bracket — expected '${stack[stack.length - 1]}' but reached end of file`;
    }
    if (inString) {
      return `Unclosed string literal (${stringChar})`;
    }
    if (inTemplate) {
      return `Unclosed template literal`;
    }

    // Check for missing export default
    if (!code.includes('export default')) {
      return `Missing 'export default' — component must have a default export`;
    }

    // Check for common JSX issues
    if ((code.match(/<[A-Z][a-zA-Z]*/g) || []).length > (code.match(/<\/[A-Z][a-zA-Z]*/g) || []).length + (code.match(/\/>/g) || []).length) {
      return `Potential unclosed JSX tag`;
    }

    return null;
  };

  const handleFullPageDesignSelect = async (design: DesignOption) => {
    setDesignModalOpen(false);
    if (!projectId) return;

    setIsTyping(true);
    setFullPageDesignUrl(design.imageUrl);
    setStage("generating_all_code");

    // Save the selected design URL to project
    api.updateProject(projectId, { thumbnail_url: design.imageUrl, full_page_design_url: design.imageUrl });

    addMessage("system", `✅ Great choice! Now analyzing the design and generating code for ALL sections...\n\n⏳ This may take 30-60 seconds — the AI is writing code for your entire website.`);

    try {
      // Build context
      const businessContext = Object.values(userAnswers).join(". ");
      const businessName = projectTitle !== "New Project" ? projectTitle : projectDescription.split(" ")[0];

      // Call the full-page code generation
      const result = await api.generateFullPageCode(
        design.imageUrl,
        projectDescription,
        businessName,
        `${projectDescription}. ${businessContext}`,
        userAnswers
      );

      const { sections: generatedSections, designTokens: tokens } = result;

      if (!generatedSections || generatedSections.length === 0) {
        throw new Error("No sections were generated");
      }

      // Save design tokens
      if (tokens) {
        setDesignTokens(tokens);
        api.updateProject(projectId, { design_tokens: tokens });
      }

      // Create sections in DB
      const sectionPlan = generatedSections.map((s: { section_type: string; section_title: string }, i: number) => ({
        section_type: s.section_type || "section",
        section_title: s.section_title || `Section ${i + 1}`,
        sort_order: i,
      }));

      const dbSections = await api.createProjectSections(projectId, sectionPlan);

      // Map generated code to sections and save
      const sectionItems: SectionItem[] = [];
      const codeMap: Record<string, string> = {};

      for (let i = 0; i < dbSections.length; i++) {
        const dbSection = dbSections[i] as Record<string, unknown>;
        const genSection = generatedSections[i];
        const sectionId = dbSection.id as string;

        // Clean the code — strip any markdown fences
        let code = genSection?.code || "";
        code = code
          .replace(/^```(tsx|jsx|javascript|typescript|react)\n?/i, "")
          .replace(/^```\n?/i, "")
          .replace(/\n?```$/i, "")
          .trim();

        // Validate code has required structure
        if (!code.includes("export default")) {
          code = `import { ArrowRight } from 'lucide-react';\n\nexport default function Section${i}() {\n  return (\n    <section className="py-16 px-4">\n      <div className="max-w-6xl mx-auto">\n        <h2 className="text-3xl font-bold">${genSection?.section_title || 'Section'}</h2>\n        <p className="mt-4 text-gray-400">Content coming soon...</p>\n      </div>\n    </section>\n  );\n}`;
        }

        // Auto-fix: validate syntax and fix errors automatically
        const syntaxError = validateCodeSyntax(code);
        if (syntaxError) {
          console.log(`[auto-fix] Section "${genSection?.section_title}" has error: ${syntaxError}`);
          addMessage("system", `🔧 Auto-fixing **${genSection?.section_title}**...`);

          let fixAttempts = 0;
          let currentCode = code;
          let currentError = syntaxError;

          while (currentError && fixAttempts < 2) {
            fixAttempts++;
            try {
              const { code: fixedCode } = await api.fixCode(
                currentCode,
                currentError,
                genSection?.section_type,
                genSection?.section_title,
                projectDescription
              );
              currentCode = fixedCode;
              currentError = validateCodeSyntax(currentCode);
              if (!currentError) {
                console.log(`[auto-fix] Fixed "${genSection?.section_title}" on attempt ${fixAttempts}`);
              }
            } catch (fixErr) {
              console.error(`[auto-fix] Fix attempt ${fixAttempts} failed:`, fixErr);
              break;
            }
          }

          code = currentCode;
        }

        // Save to DB
        await api.updateSection(sectionId, { generated_code: code, status: "complete" });

        codeMap[sectionId] = code;
        sectionItems.push({
          id: sectionId,
          section_type: dbSection.section_type as string,
          section_title: dbSection.section_title as string,
          sort_order: dbSection.sort_order as number,
          status: "complete",
        });
      }

      setSections(sectionItems);
      setGeneratedCode(codeMap);
      setCurrentSectionIndex(0);
      setCurrentSectionId(sectionItems[0]?.id || null);
      setPreviewSectionId(null);

      setIsTyping(false);
      setStage("project_complete");

      addMessage(
        "assistant",
        `🚀 **Your website is ready!** I've generated code for **${sectionItems.length} sections**:\n\n` +
        sectionItems.map((s, i) => `${i + 1}. ✅ **${s.section_title}**`).join("\n") +
        `\n\nYou can:\n- Preview each section in the panel on the right\n- Click on a section to see its code\n- Chat with me to make edits (e.g., "Make the hero section more colorful")\n\nGreat work! 🎨`
      );

      if (projectId) {
        api.updateProject(projectId, { status: "complete" });
      }
    } catch (error) {
      console.error("[handleFullPageDesignSelect] Error:", error);
      setIsTyping(false);
      setStage("idle");
      if ((error as any)?.name === "AuthError" || error instanceof AuthError) {
        toast({ title: "Session Expired", description: "Your session has expired. Please log in again.", variant: "destructive" });
        navigate("/login");
        return;
      }
      toast({ title: "Code generation failed", description: "There was an error generating code from the design. Please try again.", variant: "destructive" });
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    const hasCredits = await useCredit(1, "regenerate designs");
    if (!hasCredits) {
      setIsRegenerating(false);
      return;
    }

    try {
      const businessContext = Object.values(userAnswers).join(". ");
      const regenPrompt = `Complete full-page website landing page design for: ${projectDescription}. Business: ${projectTitle}. ${businessContext}. Alternative creative direction.`;
      const { designs } = await api.generateDesigns(regenPrompt, businessContext, 3);

      setCurrentDesigns(designs.map((d: { id: string; imageUrl: string }) => ({
        id: d.id,
        imageUrl: d.imageUrl,
        prompt: regenPrompt,
      })));

      addMessage("system", "🔄 New full-page designs generated! Take another look.");
    } catch {
      toast({ title: "Regeneration failed", variant: "destructive" });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleFreeChat = async (msg: string) => {
    setIsTyping(true);

    try {
      // Determine which section to edit
      // If a section is selected in preview, edit that one. Otherwise, default to the first section.
      const targetId = previewSectionId || sections[0]?.id;
      if (!targetId) {
        addMessage("assistant", "I'm not sure which section to edit. Could you please select a section first?");
        setIsTyping(false);
        return;
      }

      const section = sections.find(s => s.id === targetId);
      const existingCode = generatedCode[targetId];

      if (!existingCode) {
        addMessage("assistant", `I haven't generated the code for **${section?.section_title}** yet. Let's finish that first!`);
        setIsTyping(false);
        return;
      }

      addMessage("system", `🛠️ Modifying **${section?.section_title}** based on your request...`);

      let { code } = await api.editCode(
        existingCode,
        msg,
        section?.section_type || "section",
        projectDescription,
        designSystem,
        section?.section_title
      );

      // Safety net: extract code from response if Claude added explanation text
      const codeBlockMatch = code.match(/```(?:tsx|jsx|javascript|typescript|react)?\n?([\s\S]*?)```/);
      if (codeBlockMatch) {
        code = codeBlockMatch[1].trim();
      } else if (!code.trim().startsWith("import") && !code.trim().startsWith("export") && !code.trim().startsWith("const") && !code.trim().startsWith("function")) {
        const importIdx = code.indexOf("import ");
        const exportIdx = code.indexOf("export ");
        const codeStart = Math.min(
          importIdx >= 0 ? importIdx : Infinity,
          exportIdx >= 0 ? exportIdx : Infinity
        );
        if (codeStart < Infinity) {
          code = code.slice(codeStart).trim();
        }
      }

      if (!code.includes("export default")) {
        addMessage("assistant", `⚠️ The edit didn't produce valid code. Please try rephrasing your request.`);
        setIsTyping(false);
        return;
      }

      // Save updated code to DB
      await api.updateSection(targetId, { generated_code: code });

      // Update local state
      setGeneratedCode(prev => ({ ...prev, [targetId!]: code }));
      setPreviewSectionId(targetId);

      addMessage("assistant", `✅ I've updated the **${section?.section_title}** section! Check it out in the preview.`);
    } catch (err) {
      console.error("Failed to edit code:", err);
      toast({ title: "Edit failed", description: "I couldn't apply those changes. Please try again.", variant: "destructive" });
    } finally {
      setIsTyping(false);
    }
  };

  const handleEditAndResend = (msgId: string, newContent: string) => {
    // Find the index of the edited message
    const msgIndex = messages.findIndex((m) => m.id === msgId);
    if (msgIndex === -1) return;

    // Build new message list: everything before this message + the edited message (no messages after)
    const editedMessage: Message = {
      ...messages[msgIndex],
      content: newContent,
      timestamp: new Date(),
    };
    const newMessages = [...messages.slice(0, msgIndex), editedMessage];
    setMessages(newMessages);

    // Reset pipeline state
    setIsTyping(false);
    setDesignModalOpen(false);

    // Use setTimeout to let the setMessages state update commit
    setTimeout(() => {
      // Determine the correct action based on context
      if (!projectId && stage === "idle") {
        // First message — start a new project (startProject will add user msg, so remove it from our truncated list)
        setMessages(messages.slice(0, msgIndex));
        startProject(newContent);
      } else if (stage === "questioning") {
        // Re-send as a question answer
        if (projectId) {
          api.addMessage(projectId, "user", newContent, "answer");
        }
        handleQuestionAnswer(newContent);
      } else {
        // Free-chat re-send
        if (projectId) {
          api.addMessage(projectId, "user", newContent, "chat");
        }
        handleFreeChat(newContent);
      }
    }, 50);
  };

  const handleTogglePause = () => {
    const newPaused = !isPaused;
    setIsPaused(newPaused);
    isPausedRef.current = newPaused;

    if (!newPaused) {
      toast({ title: "Generation resumed" });
    } else {
      toast({ title: "Auto-generation paused", description: "The AI will stop after the current task finishes." });
    }
  };

  // Get Sandpack files structure
  const getSandpackFiles = () => {
    const files: Record<string, any> = {
      "/public/index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
      h1, h2, h3, h4, h5, h6 { font-family: 'Space Grotesk', sans-serif; }
      ${designSystem?.headingFont ? `h1, h2, h3, h4, h5, h6 { font-family: '${designSystem.headingFont}', sans-serif !important; }` : ''}
      ${designSystem?.bodyFont ? `body { font-family: '${designSystem.bodyFont}', sans-serif !important; }` : ''}
      /* Modern scrollbar */
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 999px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
      html { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.15) transparent; }
    </style>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`
    };

    const sectionFiles: string[] = [];
    const imports: string[] = [];
    const components: string[] = [];

    // Known lucide-react icon names for auto-import detection
    const LUCIDE_ICONS = [
      "ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Check", "CheckCircle", "ChevronRight", "ChevronLeft", "ChevronDown", "ChevronUp",
      "Star", "Heart", "Mail", "Phone", "MapPin", "Globe", "Search", "Menu", "X", "Plus", "Minus", "Eye", "EyeOff",
      "User", "Users", "Settings", "Home", "Shield", "Lock", "Unlock", "Calendar", "Clock", "Bell", "Bookmark",
      "Download", "Upload", "Share", "Share2", "ExternalLink", "Link", "Link2", "Copy", "Clipboard",
      "Edit", "Edit2", "Edit3", "Pencil", "Trash", "Trash2", "Save", "File", "FileText", "Folder", "Image",
      "Camera", "Video", "Mic", "Volume", "VolumeX", "Play", "Pause", "SkipForward", "SkipBack",
      "Sun", "Moon", "Cloud", "Zap", "Award", "Target", "TrendingUp", "TrendingDown", "BarChart", "BarChart2", "BarChart3", "PieChart", "Activity",
      "Code", "Terminal", "Database", "Server", "Cpu", "Wifi", "Bluetooth", "Monitor", "Smartphone", "Tablet",
      "Send", "MessageSquare", "MessageCircle", "ThumbsUp", "ThumbsDown", "AlertCircle", "AlertTriangle", "Info", "HelpCircle",
      "Sparkles", "Rocket", "Flame", "Gift", "Coffee", "Briefcase", "Building", "Store", "ShoppingCart", "ShoppingBag", "CreditCard", "DollarSign",
      "Facebook", "Twitter", "Instagram", "Linkedin", "Github", "Youtube", "Twitch",
      "LayoutGrid", "LayoutList", "Grid", "List", "Columns", "Rows", "Layers", "Box", "Package", "Archive",
      "RefreshCw", "RotateCw", "RotateCcw", "Repeat", "Shuffle", "Filter", "SlidersHorizontal",
      "MoveRight", "MoveLeft", "MoveUp", "MoveDown", "Maximize", "Minimize", "Expand", "Shrink",
      "CircleDot", "Circle", "Square", "Triangle", "Hexagon", "Octagon", "Pentagon",
      "Headphones", "Lightbulb", "Key", "Wrench", "Hammer", "Scissors", "Paintbrush", "Palette",
      "Navigation", "Compass", "Map", "Flag", "Crosshair", "Anchor", "LifeBuoy", "Umbrella",
      "Truck", "Car", "Plane", "Train", "Bike", "Ship", "Bus",
      "Smile", "Frown", "Meh", "Angry", "Laugh",
      "BookOpen", "GraduationCap", "Library", "Newspaper", "Rss",
      "Fingerprint", "ScanLine", "QrCode", "Barcode",
      "Crown", "Gem", "Medal", "Trophy", "BadgeCheck", "Verified",
      "Workflow", "GitBranch", "GitCommit", "GitMerge", "GitPullRequest",
      "Timer", "Hourglass", "Alarm", "Watch", "Stopwatch",
      "PanelLeft", "PanelRight", "Sidebar", "ArrowUpRight", "ArrowDownRight", "ArrowUpLeft", "ArrowDownLeft",
      "MousePointer", "MousePointer2", "Pointer", "Hand", "Grab",
      "FileCode", "FilePlus", "FileMinus", "FileSearch", "FileCheck", "FileWarning", "FileX",
      "FolderOpen", "FolderPlus", "FolderMinus", "FolderSearch",
      "CloudUpload", "CloudDownload", "CloudOff", "CloudLightning", "CloudRain", "CloudSnow",
      "Loader", "Loader2", "LoaderCircle", "Spinner",
    ];

    // Auto-fix: detect used lucide icons and add import if missing
    const fixLucideImports = (code: string): string => {
      // Check if the code already imports from lucide-react
      const hasLucideImport = /import\s+\{[^}]+\}\s+from\s+['"]lucide-react['"]/.test(code);

      // Find all PascalCase identifiers that could be lucide icons used as JSX
      const usedIconsInJsx = new Set<string>();
      const jsxTagRegex = /<([A-Z][a-zA-Z0-9]*)\s/g;
      let match;
      while ((match = jsxTagRegex.exec(code)) !== null) {
        const name = match[1];
        if (LUCIDE_ICONS.includes(name)) {
          usedIconsInJsx.add(name);
        }
      }

      if (usedIconsInJsx.size === 0) return code;

      if (hasLucideImport) {
        // Parse existing import and add any missing icons
        return code.replace(
          /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/,
          (fullMatch, iconList) => {
            const existingIcons = iconList.split(',').map((s: string) => s.trim()).filter(Boolean);
            const existingSet = new Set(existingIcons);
            usedIconsInJsx.forEach(icon => existingSet.add(icon));
            return `import { ${Array.from(existingSet).join(', ')} } from 'lucide-react'`;
          }
        );
      } else {
        // Add a new import at the top
        const iconImport = `import { ${Array.from(usedIconsInJsx).join(', ')} } from 'lucide-react';\n`;
        return iconImport + code;
      }
    };

    // Sanitize code for Sandpack compatibility
    const sanitizeCode = (code: string): string => {
      let cleaned = code;
      // Remove 'use client' directive
      cleaned = cleaned.replace(/^['"]use client['"];?\s*\n?/m, '');
      // Remove Next.js imports
      cleaned = cleaned.replace(/import\s+.*from\s+['"]next\/(image|link|router|navigation)['"];?\s*\n?/g, '');
      // Replace Next.js Image with standard img
      cleaned = cleaned.replace(/<Image\s/g, '<img ');
      cleaned = cleaned.replace(/<\/Image>/g, '</img>');
      // Replace Next.js Link with standard a
      cleaned = cleaned.replace(/<Link\s+href=/g, '<a href=');
      cleaned = cleaned.replace(/<\/Link>/g, '</a>');
      return cleaned;
    };

    // Add each section as a separate file
    sections.forEach((section) => {
      const compName = section.section_title.replace(/[^a-zA-Z0-9]/g, "");
      const code = generatedCode[section.id];

      if (code) {
        let processedCode = sanitizeCode(code);
        processedCode = fixLucideImports(processedCode);

        // Handle: export default function OriginalName -> export default function CompName
        if (/export\s+default\s+function\s+[A-Z]/i.test(processedCode)) {
          processedCode = processedCode.replace(
            /export\s+default\s+function\s+([A-Z][a-zA-Z0-9]*)/g,
            `export default function ${compName}`
          );
        }
        // Handle: const X = ... ; export default X -> rename
        else if (/export\s+default/.test(processedCode)) {
          processedCode = processedCode.replace(/export\s+default\s+([A-Z][a-zA-Z0-9]*)/, `export default ${compName}`);
        }
        // Handle: function X() { ... } (no export) -> add export default
        else if (/^function\s+[A-Z]/m.test(processedCode)) {
          processedCode = processedCode.replace(
            /^function\s+([A-Z][a-zA-Z0-9]*)/m,
            `export default function ${compName}`
          );
        }
        // Fallback: wrap in a default export if nothing matched
        else {
          processedCode = `export default function ${compName}() {\n  return (\n    ${processedCode}\n  );\n}`;
        }

        files[`/sections/${compName}.tsx`] = processedCode;
      } else {
        // Placeholder for ungenerated section
        files[`/sections/${compName}.tsx`] = `
export default function ${compName}() {
  return (
    <section className="py-20 flex items-center justify-center bg-neutral-900 border-y border-dashed border-neutral-700">
      <div className="text-center">
        <h2 className="text-xl font-medium text-neutral-400">${section.section_title}</h2>
        <p className="text-sm text-neutral-500">Waiting for design & code generation...</p>
      </div>
    </section>
  );
}
        `.trim();
      }

      // Always include completed sections + current section in the full site view
      // Only filter when a specific section is selected for individual preview
      if (!previewSectionId || previewSectionId === section.id || generatedCode[section.id]) {
        imports.push(`import ${compName} from "./sections/${compName}";`);
        components.push(`<${compName} />`);
      }
    });

    // Create App.tsx
    files["/App.tsx"] = `
import React from "react";
${imports.join("\n")}

export default function App() {
  return (
    <div className="flex flex-col min-h-screen">
      ${components.join("\n      ")}
    </div>
  );
}
    `.trim();

    return files;
  };

  // --- Chat Panel ---
  const chatPanel = (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Section Progress */}
        {sections.length > 0 && (
          <div className="mb-4">
            <SectionProgress
              sections={sections}
              currentSectionId={currentSectionId}
              onSectionClick={(section) => {
                if (generatedCode[section.id]) {
                  setPreviewSectionId(section.id);
                  setMobileTab("preview");
                }
              }}
            />
          </div>
        )}

        {!messages.length && (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">What would you like to build?</h3>
              <p className="text-xs text-muted-foreground max-w-[250px]">
                Describe your website and I'll design it section by section.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} onEditMessage={handleEditAndResend} isTyping={isTyping} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-2 md:p-3 border-t border-border flex-shrink-0 min-w-0">
        <div className="flex items-center gap-1.5 md:gap-2 rounded-xl border border-border bg-card px-2 md:px-3 py-2 md:py-2.5 focus-within:border-primary/50 transition-colors min-w-0">
          <Plus className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors flex-shrink-0" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={stage === "questioning" ? "Type your answer..." : "Ask CreatorUncle..."}
            className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground truncate"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isTyping}
          />
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-[10px] text-muted-foreground mr-1 hidden lg:inline px-1.5 py-0.5 rounded bg-muted">
              {credits} credits
            </span>
            {isPaused ? (
              <button
                onClick={handleTogglePause}
                className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all flex-shrink-0"
                title="Resume generation"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
              </button>
            ) : isTyping ? (
              <button
                onClick={handleTogglePause}
                className="h-7 w-7 rounded-full bg-muted border border-border flex items-center justify-center hover:bg-muted/80 transition-all flex-shrink-0 group"
                title="Stop generation"
              >
                <div className="h-2.5 w-2.5 rounded-sm bg-foreground group-hover:scale-110 transition-transform" />
              </button>
            ) : (
              <button
                onClick={() => handleSendMessage()}
                disabled={!input.trim()}
                className="h-7 w-7 rounded-full gradient-bg text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity flex-shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // --- Preview Panel ---
  const currentFiles = getSandpackFiles();
  const hasGeneratedCode = Object.keys(generatedCode).length > 0;
  const previewCode = hasGeneratedCode
    ? (previewSectionId ? generatedCode[previewSectionId] : currentFiles["/App.tsx"])
    : null;

  const previewPanel = (
    <div className="relative flex-1 flex flex-col bg-muted/20 min-w-0 h-full">
      {previewTab === "preview" ? (
        <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-auto">
          {previewCode ? (
            <div
              className={cn(
                "border border-border rounded-lg bg-white shadow-sm transition-all duration-300 w-full h-full overflow-hidden flex flex-col",
                viewportSize === "tablet" && "md:w-[768px] md:h-[1024px] md:max-h-full",
                viewportSize === "mobile" && "md:w-[375px] md:h-[812px] md:max-h-full"
              )}
            >
              <SandpackProvider
                template="react-ts"
                theme="light"
                files={getSandpackFiles()}
                customSetup={{
                  dependencies: {
                    "lucide-react": "latest",
                    "framer-motion": "latest",
                    "clsx": "latest",
                    "tailwind-merge": "latest"
                  }
                }}
                options={{
                  externalResources: [
                    "https://cdn.tailwindcss.com",
                    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
                  ],
                }}
                className="w-full h-full flex flex-col"
              >
                <SandpackPreview
                  showOpenInCodeSandbox={false}
                  showRefreshButton={false}
                  style={{ height: "100%", width: "100%", border: "none" }}
                />
              </SandpackProvider>
            </div>
          ) : (
            <div
              className={cn(
                "border border-border rounded-lg bg-background shadow-sm transition-all duration-300 flex items-center justify-center w-full h-full",
                viewportSize === "tablet" && "md:w-[768px] md:h-[1024px] md:max-h-full",
                viewportSize === "mobile" && "md:w-[375px] md:h-[812px] md:max-h-full"
              )}
            >
              <div className="text-center">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Globe className="h-6 w-6 md:h-7 md:w-7 text-muted-foreground/40" />
                </div>
                <h3 className="font-medium text-sm mb-1">Live Preview</h3>
                <p className="text-xs text-muted-foreground">
                  Your generated website will appear here.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 p-4 md:p-6 font-mono text-xs text-muted-foreground overflow-auto">
          {previewCode ? (
            <pre className="whitespace-pre-wrap text-foreground/80">{previewCode}</pre>
          ) : (
            <div className="space-y-1">
              <p className="text-foreground">// Generated code will appear here</p>
              <p>{'import React from "react";'}</p>
              <p>&nbsp;</p>
              <p>{"export default function App() {"}</p>
              <p>{"  return ("}</p>
              <p>{'    <div className="min-h-screen">'}</p>
              <p>{"      {/* Your components */}"}</p>
              <p>{"    </div>"}</p>
              <p>{"  );"}</p>
              <p>{"}"}</p>
            </div>
          )}
        </div>
      )}

      {/* Section tabs in preview */}
      {Object.keys(generatedCode).length > 1 && (
        <div className="flex gap-1 p-2 border-t border-border bg-card overflow-x-auto">
          {sections
            .filter((s) => generatedCode[s.id])
            .map((s) => (
              <button
                key={s.id}
                onClick={() => setPreviewSectionId(s.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors",
                  previewSectionId === s.id
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s.section_title}
              </button>
            ))}
          <button
            onClick={() => setPreviewSectionId(null)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors",
              !previewSectionId ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Full Site
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <header className="h-11 border-b border-border flex items-center px-2 md:px-3 gap-1 md:gap-2 flex-shrink-0 bg-background">
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setProjectMenuOpen(!projectMenuOpen)}
            className="flex items-center gap-1 md:gap-1.5 text-xs md:text-sm font-medium hover:text-foreground/80 transition-colors"
          >
            <div className="w-5 h-5 rounded bg-foreground flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-background" />
            </div>
            <span className="truncate max-w-[80px] md:max-w-[160px]">{projectTitle}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
          {projectMenuOpen && <ProjectDropdown title={projectTitle} onClose={() => setProjectMenuOpen(false)} />}
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-0.5">
            <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors hidden md:flex">
              <PanelLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPreviewTab("preview")}
              className={cn(
                "h-8 px-2 md:px-3 rounded-lg flex items-center gap-1 md:gap-1.5 text-xs font-medium transition-colors",
                previewTab === "preview" ? "border border-border bg-muted/60 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Preview</span>
            </button>
            <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
              <Sparkles className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPreviewTab("code")}
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                previewTab === "code" ? "border border-border bg-muted/60 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Code className="h-4 w-4" />
            </button>
            <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-0.5 border border-border rounded-lg p-0.5">
            {(["desktop", "tablet", "mobile"] as ViewportSize[]).map((size) => {
              const Icon = size === "desktop" ? Monitor : size === "tablet" ? Tablet : Smartphone;
              return (
                <button
                  key={size}
                  onClick={() => setViewportSize(size)}
                  className={cn(
                    "h-6 w-6 rounded flex items-center justify-center transition-colors",
                    viewportSize === size ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                  title={`${size} view`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
          <button className="h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            onClick={() => setGithubModalOpen(true)}
          >
            <GitBranch className="h-3.5 w-3.5" />
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
          </button>
          <button className="h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
          <Button size="sm" className="h-8 text-xs px-4 rounded-lg">Publish</Button>
        </div>
      </header>

      {/* Desktop: Resizable split layout */}
      <div className="hidden md:flex flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel defaultSize={30} minSize={20} maxSize={60}>
            {chatPanel}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={70} minSize={30}>
            {previewPanel}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile: Tabbed layout */}
      <div className="flex md:hidden flex-col flex-1 min-h-0 relative">
        <div className="flex-1 min-h-0">
          {mobileTab === "chat" ? chatPanel : previewPanel}
        </div>
        <div className="flex items-center justify-center gap-3 py-2.5 bg-background border-t border-border">
          <div className="flex items-center bg-muted rounded-full p-1">
            <button
              onClick={() => setMobileTab("chat")}
              className={cn(
                "px-5 py-1.5 rounded-full text-sm font-medium transition-all",
                mobileTab === "chat" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground"
              )}
            >
              Chat
            </button>
            <button
              onClick={() => setMobileTab("preview")}
              className={cn(
                "px-5 py-1.5 rounded-full text-sm font-medium transition-all",
                mobileTab === "preview" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground"
              )}
            >
              Preview
            </button>
          </div>
        </div>
      </div>

      {/* Design Selection Modal */}
      <DesignSelectionModal
        isOpen={designModalOpen}
        designs={currentDesigns}
        sectionTitle="Website Design"
        credits={credits}
        isRegenerating={isRegenerating}
        onSelect={handleFullPageDesignSelect}
        onRegenerate={handleRegenerate}
        onClose={() => setDesignModalOpen(false)}
      />

      {/* GitHub Connect Modal */}
      <GitHubConnectModal
        open={githubModalOpen}
        onClose={() => setGithubModalOpen(false)}
        projectId={projectId || ""}
        projectTitle={projectTitle}
        githubConnected={!!profile?.api_keys?.github_username}
        githubUsername={profile?.api_keys?.github_username}
        existingRepoUrl={undefined}
        onSynced={() => { }}
      />

      {/* Credits Exhausted Modal */}
      <CreditsExhaustedModal
        open={showCreditsModal}
        onClose={() => setShowCreditsModal(false)}
        credits={credits}
        plan={profile?.plan}
      />
    </div>
  );
};

export default AIChat;
