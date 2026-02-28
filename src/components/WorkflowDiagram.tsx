import { Camera, Cpu, Brain, Volume2 } from "lucide-react";

const steps = [
  { icon: Camera, label: "Camera", desc: "Capture video" },
  { icon: Cpu, label: "AI Processing", desc: "COCO-SSD / OCR" },
  { icon: Brain, label: "Decision Engine", desc: "Zone analysis" },
  { icon: Volume2, label: "Voice Output", desc: "Speech alerts" },
];

const WorkflowDiagram = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 py-4">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-2 sm:gap-4">
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <step.icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-foreground">{step.label}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">{step.desc}</span>
          </div>
          {i < steps.length - 1 && (
            <div className="text-muted-foreground text-xl font-light">→</div>
          )}
        </div>
      ))}
    </div>
  );
};

export default WorkflowDiagram;
