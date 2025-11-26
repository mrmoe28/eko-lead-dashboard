import { Card } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Configure your dashboard preferences
        </p>
      </div>

      <Card className="p-12 text-center">
        <SettingsIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Settings</h2>
        <p className="text-gray-500">
          API keys, notifications, and preferences will be available here soon.
        </p>
      </Card>
    </div>
  );
}
