import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { location } = body;

    if (!location) {
      return NextResponse.json(
        { error: "Location is required" },
        { status: 400 }
      );
    }

    // Get the scraper path
    const scraperPath = process.env.SCRAPER_PATH || "/Users/ekodevapps/Desktop/ekoleadgenerator/solar-data-extractor";

    // Trigger scraper in background
    const command = `cd "${scraperPath}" && node scrape-leads.js "${location}" > /dev/null 2>&1 &`;

    exec(command, (error) => {
      if (error) {
        console.error('Failed to start scraper:', error);
      }
    });

    return NextResponse.json({
      success: true,
      message: `Scraper started for ${location}`,
    });
  } catch (error) {
    console.error("Error triggering scraper:", error);
    return NextResponse.json(
      { error: "Failed to trigger scraper" },
      { status: 500 }
    );
  }
}
