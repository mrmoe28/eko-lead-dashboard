"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Key, Copy, Check, Radio, Database, Webhook } from "lucide-react";

export default function SettingsPage() {
  const [copied, setCopied] = useState(false);
  const apiKey = "eko-scraper-secret-2024"; // This should match your .env

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Configure your dashboard and integrations
        </p>
      </div>

      {/* API Key Section */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Key className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Scraper API Key</h2>
            <p className="text-sm text-gray-600">Use this key to connect your scraper CLI</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={apiKey}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>

          <div className="text-sm text-gray-600 space-y-2">
            <p className="font-medium">How to use:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Copy the API key above</li>
              <li>Open <code className="bg-gray-200 px-1 rounded">solar-data-extractor/.env</code></li>
              <li>Set <code className="bg-gray-200 px-1 rounded">SCRAPER_API_KEY=eko-scraper-secret-2024</code></li>
              <li>Run your scraper: <code className="bg-gray-200 px-1 rounded">node scrape-leads.js Georgia</code></li>
            </ol>
          </div>
        </div>
      </Card>

      {/* Integrations Section */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Webhook className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Integrations</h2>
            <p className="text-sm text-gray-600">Connected services and data sources</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Scraper Integration */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Radio className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Lead Scraper</h3>
                <p className="text-sm text-gray-600">Real-time lead scraping CLI</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Active
              </span>
            </div>
          </div>

          {/* Database Integration */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">NeonDB</h3>
                <p className="text-sm text-gray-600">PostgreSQL database</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Connected
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Dashboard URLs */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Dashboard URLs</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Production URL</label>
            <Input
              type="text"
              value="https://eko-lead-dashboard.vercel.app"
              readOnly
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Live Scraping Page</label>
            <Input
              type="text"
              value="https://eko-lead-dashboard.vercel.app/scraping"
              readOnly
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {/* Automated Setup */}
      <Card className="p-6 bg-green-50 border-green-200">
        <h3 className="font-semibold text-green-900 mb-3">✨ Automated Setup (Recommended)</h3>
        <div className="space-y-2 text-sm text-green-800">
          <p className="font-medium">No manual configuration needed! Just run:</p>
          <code className="block bg-green-100 p-3 rounded mt-2 font-mono">
            cd solar-data-extractor<br/>
            ./setup.sh
          </code>
          <p className="mt-3">Or <strong>double-click</strong> <code className="bg-green-100 px-1 rounded">setup.command</code> on Mac!</p>
          <p className="mt-2">The script automatically configures everything for you.</p>
        </div>
      </Card>

      {/* Manual Configuration Guide */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">Manual Setup (Alternative)</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>Step 1:</strong> Copy the API key from above</p>
          <p><strong>Step 2:</strong> Add it to your scraper's <code className="bg-blue-100 px-1 rounded">.env</code> file</p>
          <p><strong>Step 3:</strong> Set the dashboard URL:</p>
          <code className="block bg-blue-100 p-2 rounded mt-1">
            DASHBOARD_API_URL=https://eko-lead-dashboard.vercel.app
          </code>
          <p className="mt-3"><strong>Step 4:</strong> Run the scraper and watch live updates!</p>
        </div>
      </Card>
    </div>
  );
}
