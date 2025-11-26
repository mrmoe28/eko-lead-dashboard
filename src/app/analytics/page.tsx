import { Card } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">
          Detailed insights and metrics coming soon
        </p>
      </div>

      <Card className="p-12 text-center">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Analytics Dashboard</h2>
        <p className="text-gray-500">
          Charts, graphs, and detailed analytics will be available here soon.
        </p>
      </Card>
    </div>
  );
}
