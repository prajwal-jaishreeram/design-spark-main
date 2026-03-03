import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sparkles, Send, Plus, Code, ChevronDown, ThumbsUp, ThumbsDown,
  Copy, MoreHorizontal, ArrowLeft, Settings, Star, FolderInput, Info,
  Moon, HelpCircle, Edit3, GitBranch, ExternalLink, History, PanelLeft,
  Globe, Cloud, BarChart3, RefreshCw, Share2, Monitor, Tablet, Smartphone, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

// --- Types ---
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}

// --- Sub-components ---
function ChatMessage({ msg }: { msg: Message }) {
  return (
    <div className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[90%] rounded-2xl px-3 md:px-4 py-2.5 md:py-3 text-sm leading-relaxed break-words overflow-hidden",
          msg.role === "user"
            ? "bg-primary text-primary-foreground"
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
            <button className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
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

function SuggestionChips({ onSelect }: { onSelect: (text: string) => void }) {
  const suggestions = ["Add Contact Page", "Customize Branding", "Add Authentication"];
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {suggestions.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          {s}
        </button>
      ))}
    </div>
  );
}

function ProjectDropdown({ title, onClose }: { title: string; onClose: () => void }) {
  const navigate = useNavigate();

  const menuItems = [
    { type: "link" as const, icon: ArrowLeft, label: "Go to Dashboard", onClick: () => navigate("/dashboard") },
    { type: "divider" as const },
    { type: "link" as const, icon: GitBranch, label: "Connect to GitHub", onClick: () => {}, badge: "Connect" },
    { type: "link" as const, icon: ExternalLink, label: "Connect to Vercel", onClick: () => {}, badge: "Connect" },
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
              <p className="text-[11px] text-muted-foreground">Previewing last saved version</p>
            </div>
          </div>
        </div>

        {menuItems.map((item, i) => {
          if (item.type === "divider") {
            return <div key={i} className="my-1 border-t border-border" />;
          }
          const Icon = item.icon!;
          return (
            <button
              key={i}
              onClick={() => { item.onClick?.(); onClose(); }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                  {item.badge}
                </span>
              )}
              {item.shortcut && (
                <span className="text-[11px] text-muted-foreground/60">{item.shortcut}</span>
              )}
              {item.hasSubmenu && (
                <ExternalLink className="h-3 w-3 text-muted-foreground/40" />
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}

type ViewportSize = "desktop" | "tablet" | "mobile";
type MobileTab = "chat" | "preview";

// --- Main Component ---
const AIChat = () => {
  const { pendingPrompt, setPendingPrompt } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [input, setInput] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<"preview" | "code">("preview");
  const [isTyping, setIsTyping] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [viewportSize, setViewportSize] = useState<ViewportSize>("desktop");
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");
  const [mobileRoutesOpen, setMobileRoutesOpen] = useState(false);
  const [mobilePathInput, setMobilePathInput] = useState("/");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const projectTitle = activeConv?.title || "New Project";
  const generatedRoutes = ["/login", "/signup", "/dashboard", "/ai-chat"];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages, isTyping]);

  useEffect(() => {
    const statePrompt = (location.state as any)?.prompt;
    const prompt = pendingPrompt?.prompt || statePrompt;
    if (prompt) {
      handleSendMessage(prompt);
      setPendingPrompt(null);
      window.history.replaceState({}, document.title);
    }
  }, []);

  const createConversation = (firstMessage: string): string => {
    const id = Date.now().toString();
    const title = firstMessage.length > 40 ? firstMessage.slice(0, 40) + "..." : firstMessage;
    const conv: Conversation = { id, title, messages: [] };
    setConversations((prev) => [conv, ...prev]);
    setActiveConvId(id);
    return id;
  };

  const handleSendMessage = (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");

    let convId = activeConvId;
    if (!convId) {
      convId = createConversation(msg);
    }

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: msg, timestamp: new Date() };
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, messages: [...c.messages, userMsg] } : c))
    );

    setIsTyping(true);
    setTimeout(() => {
      const responses = [
        `This looks like a visually rich landing page with video backgrounds, animated text effects, and feature sections.\nHere are some great next steps depending on your goals:\n\n1. **Add more pages** - Contact, Services, or Portfolio pages to make it a complete site\n2. **Add authentication** - Enable user login/signup if you need user accounts\n3. **Connect a database** - Store leads, form submissions, or dynamic content\n4. **Customize the branding** - Update colors, fonts, and content to match your brand\n5. **Add a contact form** - Capture visitor information with email notifications\n\nWhat direction interests you most?`,
        `I'll help you build that! Let me create a modern design for "${msg}". Here's what I'm thinking:\n\n- Clean, responsive layout\n- Dark theme with accent colors\n- Smooth animations with Framer Motion\n- Mobile-first approach\n\nI'm generating the components now...`,
        `Great idea! I'm working on your request. Here's the plan:\n\n1. **Layout** — Responsive grid with sidebar navigation\n2. **Components** — Custom cards, buttons, and forms\n3. **Styling** — Tailwind CSS with custom design tokens\n4. **Interactions** — Hover effects and transitions\n\nGenerating code...`,
      ];
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      };
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, messages: [...c.messages, aiMsg] } : c))
      );
      setIsTyping(false);
    }, 2000);
  };

  // --- Chat Panel Content ---
  const chatPanel = (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {!activeConv?.messages.length && (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">What would you like to build?</h3>
              <p className="text-xs text-muted-foreground max-w-[250px]">
                Describe your website and I'll generate it for you.
              </p>
            </div>
          </div>
        )}
        {activeConv?.messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} />
        ))}
        {isTyping && <TypingIndicator />}
        {activeConv?.messages.some((m) => m.role === "assistant") && !isTyping && (
          <SuggestionChips onSelect={(text) => handleSendMessage(text)} />
        )}
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
            placeholder="Ask DesignForge..."
            className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground truncate"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-[11px] text-muted-foreground mr-1 hidden lg:inline">Plan</span>
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim()}
              className="h-7 w-7 rounded-full gradient-bg text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity flex-shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // --- Preview Panel Content ---
  const previewPanel = (
    <div className="relative flex-1 flex flex-col bg-muted/20 min-w-0 h-full">

      {previewTab === "preview" ? (
        <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-auto">
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
        </div>
      ) : (
        <div className="flex-1 p-4 md:p-6 font-mono text-xs text-muted-foreground overflow-auto">
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
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <header className="h-11 border-b border-border flex items-center px-2 md:px-3 gap-1 md:gap-2 flex-shrink-0 bg-background">
        {/* Project name dropdown */}
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
          {projectMenuOpen && (
            <ProjectDropdown title={projectTitle} onClose={() => setProjectMenuOpen(false)} />
          )}
        </div>

        {/* Center toolbar */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-0.5">
            <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors hidden md:flex">
              <PanelLeft className="h-4 w-4" />
            </button>

            {/* Preview button */}
            <button
              onClick={() => setPreviewTab("preview")}
              className={cn(
                "h-8 px-2 md:px-3 rounded-lg flex items-center gap-1 md:gap-1.5 text-xs font-medium transition-colors",
                previewTab === "preview"
                  ? "border border-border bg-muted/60 text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Preview</span>
            </button>

            <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors hidden sm:flex">
              <Cloud className="h-4 w-4" />
            </button>
            <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
              <Sparkles className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPreviewTab("code")}
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                previewTab === "code"
                  ? "border border-border bg-muted/60 text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Code className="h-4 w-4" />
            </button>
            <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors hidden sm:flex">
              <BarChart3 className="h-4 w-4" />
            </button>
            <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right section - hidden on mobile */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-border bg-muted/40 text-xs text-muted-foreground">
            <PanelLeft className="h-3 w-3" />
            <span>/ai-chat</span>
            <ExternalLink className="h-3 w-3 ml-1 cursor-pointer hover:text-foreground transition-colors" />
            <RefreshCw className="h-3 w-3 cursor-pointer hover:text-foreground transition-colors" />
          </div>

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

          <button className="h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
          <button className="h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors border border-border">
            <GitBranch className="h-3.5 w-3.5" /> GitHub
          </button>
          <button className="h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors border border-border">
            <svg className="h-3.5 w-3.5" viewBox="0 0 76 65" fill="currentColor"><path d="M37.5274 0L75.0548 65H0L37.5274 0Z" /></svg>
            Vercel
          </button>
          <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
            <Settings className="h-4 w-4" />
          </button>
          <Button size="sm" className="h-8 text-xs px-4 rounded-lg">Publish</Button>
        </div>
      </header>

      {/* Desktop: Resizable split layout */}
      <div className="hidden md:flex flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel defaultSize={25} minSize={20} maxSize={60}>
            {chatPanel}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={75} minSize={30}>
            {previewPanel}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile: Tabbed layout */}
      <div className="flex md:hidden flex-col flex-1 min-h-0 relative">
        <div className="flex-1 min-h-0">
          {mobileTab === "chat" ? chatPanel : previewPanel}
        </div>

        {/* Route switcher popup - opens upward from path bar */}
        {mobileRoutesOpen && (
          <div className="absolute bottom-[96px] left-3 right-3 z-30 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
            <div className="p-3 border-b border-border">
              <div className="h-10 rounded-full bg-muted/70 px-4 flex items-center text-lg font-medium text-foreground">/</div>
            </div>
            <div className="px-5 py-3 space-y-3 max-h-[240px] overflow-auto">
              {generatedRoutes.map((route) => (
                <button
                  key={route}
                  onClick={() => {
                    setMobilePathInput(route);
                    setMobileRoutesOpen(false);
                  }}
                  className="block text-left text-base font-medium text-foreground/90 hover:text-foreground transition-colors"
                >
                  {route}
                </button>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-border flex items-center gap-3">
              <input
                type="text"
                value={mobilePathInput}
                onChange={(e) => setMobilePathInput(e.target.value)}
                className="flex-1 bg-transparent text-base font-medium outline-none text-primary"
              />
              <button
                onClick={() => setMobileRoutesOpen(false)}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Path bar + action icons (between preview and tabs) */}
        {mobileTab === "preview" && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-background">
            <button
              onClick={() => setMobileRoutesOpen((prev) => !prev)}
              className="text-sm text-muted-foreground font-mono"
            >
              {mobilePathInput}
            </button>
            <div className="flex items-center gap-1">
              <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <ExternalLink className="h-4 w-4" />
              </button>
              <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <RefreshCw className="h-4 w-4" />
              </button>
              <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <Monitor className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Bottom tab bar */}
        <div className="flex items-center justify-center gap-3 py-2.5 bg-background border-t border-border">
          <button
            onClick={() => {
              setMobileTab("preview");
              setMobileRoutesOpen((prev) => !prev);
            }}
            className="h-9 w-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <History className="h-4 w-4" />
          </button>
          <div className="flex items-center bg-muted rounded-full p-1">
            <button
              onClick={() => setMobileTab("chat")}
              className={cn(
                "px-5 py-1.5 rounded-full text-sm font-medium transition-all",
                mobileTab === "chat"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              Chat
            </button>
            <button
              onClick={() => setMobileTab("preview")}
              className={cn(
                "px-5 py-1.5 rounded-full text-sm font-medium transition-all",
                mobileTab === "preview"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              Preview
            </button>
          </div>
          <button className="h-9 w-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
