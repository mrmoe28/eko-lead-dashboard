import { AssistantChat } from "@/components/assistant-chat";

export default function AssistantPage() {
  return (
    <div className="h-[calc(100vh-8rem)] rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl">
      <AssistantChat />
    </div>
  );
}

