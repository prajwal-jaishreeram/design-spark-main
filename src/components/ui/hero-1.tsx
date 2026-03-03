"use client";

import * as React from "react";
import { useState, useRef } from "react";
import { Paperclip, Sparkles, Mic, MicOff, ArrowUp, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Hero1 = () => {
  const [prompt, setPrompt] = useState("");
  const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([]);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!prompt.trim() && attachments.length === 0) return;
    navigate("/ai-chat", { state: { prompt, attachments } });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      setAttachments((prev) => [...prev, { name: file.name, url }]);
    });
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleMic = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    if (isListening) {
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setPrompt((prev) => (prev ? prev + " " + transcript : transcript));
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
  };

  const handleSuggestionClick = (text: string) => {
    setPrompt(text);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background">
      {/* Gradient layers */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -right-1/4 top-1/4 h-[400px] w-[400px] rounded-full bg-accent/15 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[600px] rounded-full bg-primary/10 blur-[80px]" />
      </div>

      {/* Dot grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold text-foreground">DesignForge</span>
        </div>
        <button
          onClick={() => navigate("/signup")}
          className="rounded-full border border-border/50 bg-card/50 px-4 py-1.5 text-sm text-foreground backdrop-blur-sm transition-colors hover:bg-card"
        >
          Get Started
        </button>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center px-6 pt-24 text-center">
        {/* Badge */}
        <div className="mb-6 animate-float">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/60 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
            🥳 Introducing Magic Components
          </span>
        </div>

        {/* Headline */}
        <h1 className="mb-4 text-5xl font-bold leading-[1.1] tracking-tight text-foreground md:text-7xl">
          Build Stunning websites{" "}
          <span className="gradient-text">effortlessly</span>
        </h1>

        {/* Subtitle */}
        <p className="mb-10 max-w-xl text-lg text-muted-foreground">
          DesignForge can create amazing websites with a few lines of prompt.
        </p>

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap justify-center gap-2">
            {attachments.map((file, i) => (
              <div key={i} className="group relative">
                <img
                  src={file.url}
                  alt={file.name}
                  className="h-16 w-16 rounded-lg border border-border/50 object-cover"
                />
                <button
                  onClick={() => removeAttachment(i)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Search bar */}
        <div className="w-full max-w-xl">
          <div className="flex items-center gap-2 rounded-full border border-border/50 bg-card/60 px-4 py-2 backdrop-blur-xl transition-colors focus-within:border-primary/50 focus-within:shadow-[0_0_15px_-3px_hsl(var(--glow)/0.3)]">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              title="Attach image"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the website you want to build..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <button
              onClick={toggleMic}
              className={`flex-shrink-0 transition-colors ${
                isListening
                  ? "text-destructive animate-pulse"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title={isListening ? "Stop listening" : "Voice input"}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            <button
              onClick={handleSubmit}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Sparkles className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Suggestion pills */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {[
            "Launch a blog with Astro",
            "Build a SaaS landing page",
            "Create a portfolio site",
            "Generate UI with shadcn",
            "Design a dashboard layout",
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className="rounded-full border border-border/30 bg-card/40 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm transition-colors hover:border-primary/50 hover:text-foreground"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export { Hero1 };
