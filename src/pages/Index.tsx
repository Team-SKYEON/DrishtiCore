import { useState } from "react";
import DetectionCanvas from "@/components/DetectionCanvas";
import WorkflowDiagram from "@/components/WorkflowDiagram";
import { Eye, BookOpen, TreePine, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

type Mode = "obstacle" | "signboard";
type Environment = "indoor" | "outdoor";

const Index = () => {
  const [mode, setMode] = useState<Mode>("obstacle");
  const [environment, setEnvironment] = useState<Environment>("indoor");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container max-w-4xl mx-auto px-4 py-4 sm:py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary flex items-center justify-center">
              <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                DrishtiCore
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                AI Assistive Navigation System
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Workflow */}
        <section className="bg-card rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 text-center uppercase tracking-wider">
            System Architecture
          </h2>
          <WorkflowDiagram />
        </section>

        {/* Mode & Environment Selectors */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Mode */}
          <div className="flex-1 bg-card rounded-xl border border-border p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Mode</p>
            <div className="flex gap-2">
              <Button
                variant={mode === "obstacle" ? "default" : "outline"}
                className="flex-1 gap-2"
                onClick={() => setMode("obstacle")}
              >
                <Eye className="w-4 h-4" />
                Obstacle
              </Button>
              <Button
                variant={mode === "signboard" ? "default" : "outline"}
                className="flex-1 gap-2"
                onClick={() => setMode("signboard")}
              >
                <BookOpen className="w-4 h-4" />
                Signboard
              </Button>
            </div>
          </div>

          {/* Environment */}
          <div className="flex-1 bg-card rounded-xl border border-border p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Environment</p>
            <div className="flex gap-2">
              <Button
                variant={environment === "indoor" ? "default" : "outline"}
                className="flex-1 gap-2"
                onClick={() => setEnvironment("indoor")}
              >
                <Home className="w-4 h-4" />
                Indoor
              </Button>
              <Button
                variant={environment === "outdoor" ? "default" : "outline"}
                className="flex-1 gap-2"
                onClick={() => setEnvironment("outdoor")}
              >
                <TreePine className="w-4 h-4" />
                Outdoor
              </Button>
            </div>
          </div>
        </div>

        {/* Detection Area */}
        <section className="bg-card rounded-xl border border-border p-4 sm:p-6">
          <DetectionCanvas mode={mode} environment={environment} />
        </section>

        {/* Info */}
        <section className="text-center text-xs text-muted-foreground pb-6">
          <p>
            DrishtiCore uses TensorFlow.js (COCO-SSD) for object detection and Tesseract.js for OCR.
            Voice alerts are powered by the Web Speech API. Allow camera access to begin.
          </p>
        </section>
      </main>
    </div>
  );
};

export default Index;
