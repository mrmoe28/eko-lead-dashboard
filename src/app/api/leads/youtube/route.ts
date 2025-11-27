import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

interface YouTubeLead {
  id: string;
  priority: string;
  score: number;
  source: string;
  name: string;
  location: string;
  message: string;
  profileUrl: string;
  postUrl: string;
  timestamp: string;
  intent: string;
  phone: string;
  email: string;
}

export async function GET(request: NextRequest) {
  try {
    const outputPath = process.env.SCRAPER_OUTPUT_PATH || '/Users/ekodevapps/Desktop/ekoleadgenerator/solar-data-extractor/output';

    // Find the latest CSV file
    const files = readdirSync(outputPath)
      .filter(f => f.startsWith('georgia-solar-leads-') && f.endsWith('.csv'))
      .sort()
      .reverse();

    if (files.length === 0) {
      return NextResponse.json({ error: 'No CSV files found' }, { status: 404 });
    }

    const latestFile = join(outputPath, files[0]);
    const csvContent = readFileSync(latestFile, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return NextResponse.json({ leads: [] });
    }

    const headers = lines[0].split(',');
    const leads: YouTubeLead[] = [];

    // Parse CSV and filter for YouTube leads with Hot/Warm priority
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);

      if (values.length !== headers.length) continue;

      const lead: Record<string, string> = {};
      headers.forEach((header, index) => {
        lead[header] = values[index];
      });

      // Only include YouTube leads that are Hot or Warm
      if (lead.Source === 'YouTube' && (lead.Priority === 'Hot' || lead.Priority === 'Warm')) {
        leads.push({
          id: `youtube-${i}-${Date.now()}`,
          priority: lead.Priority,
          score: parseInt(lead.Score) || 0,
          source: lead.Source,
          name: lead.Name,
          location: lead.Location,
          message: lead.Message || '',
          profileUrl: lead['Profile URL'] || '',
          postUrl: lead['Post URL'] || '',
          timestamp: lead.Timestamp || '',
          intent: lead.Intent || '',
          phone: lead.Phone || '',
          email: lead.Email || '',
        });
      }
    }

    return NextResponse.json({ leads, totalCount: leads.length });

  } catch (error) {
    console.error('Error fetching YouTube leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch YouTube leads' },
      { status: 500 }
    );
  }
}

// Helper function to parse CSV line properly (handles quoted commas)
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}
