#!/usr/bin/env tsx

/**
 * Screenshot Tool
 * Takes screenshots of web pages using Playwright
 */

import { chromium, Browser, Page } from 'playwright';

interface ScreenshotOptions {
  url: string;
  outputPath?: string;
  width?: number;
  height?: number;
  fullPage?: boolean;
  waitTime?: number;
  selector?: string;
}

export class ScreenshotTool {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async initialize(): Promise<void> {
    console.log('🚀 Initializing Playwright browser...');
    
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Set default viewport
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    
    console.log('✅ Browser initialized');
  }

  async takeScreenshot(options: ScreenshotOptions): Promise<string> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    const {
      url,
      outputPath = `screenshot-${Date.now()}.png`,
      width = 1920,
      height = 1080,
      fullPage = true,
      waitTime = 3000,
      selector
    } = options;

    console.log(`📸 Taking screenshot of: ${url}`);
    console.log(`   Output: ${outputPath}`);
    console.log(`   Size: ${width}x${height}`);
    console.log(`   Full page: ${fullPage}`);

    try {
      // Set viewport
      await this.page.setViewportSize({ width, height });
      
      // Navigate to URL
      console.log('🌐 Navigating to page...');
      await this.page.goto(url, { waitUntil: 'networkidle' });
      
      // Wait for page to load
      if (waitTime > 0) {
        console.log(`⏳ Waiting ${waitTime}ms for page to settle...`);
        await this.page.waitForTimeout(waitTime);
      }
      
      // Wait for specific selector if provided
      if (selector) {
        console.log(`🎯 Waiting for selector: ${selector}`);
        await this.page.waitForSelector(selector, { timeout: 10000 });
      }
      
      // Take screenshot
      console.log('📸 Capturing screenshot...');
      await this.page.screenshot({
        path: outputPath,
        fullPage,
        type: 'png'
      });
      
      console.log(`✅ Screenshot saved: ${outputPath}`);
      return outputPath;
      
    } catch (error: any) {
      console.error(`❌ Failed to take screenshot: ${error.message}`);
      throw error;
    }
  }

  async takeMultipleScreenshots(urls: string[], outputDir: string = './screenshots'): Promise<string[]> {
    console.log(`📸 Taking ${urls.length} screenshots...`);
    
    // Create output directory if it doesn't exist
    const fs = require('fs');
    const path = require('path');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const screenshots: string[] = [];
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const filename = `screenshot-${i + 1}-${Date.now()}.png`;
      const outputPath = path.join(outputDir, filename);
      
      try {
        const result = await this.takeScreenshot({
          url,
          outputPath,
          waitTime: 3000
        });
        screenshots.push(result);
        
        // Small delay between screenshots
        if (i < urls.length - 1) {
          await this.page?.waitForTimeout(1000);
        }
      } catch (error) {
        console.error(`Failed to screenshot ${url}: ${error}`);
      }
    }
    
    return screenshots;
  }

  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
      console.log('📄 Page closed');
    }
    
    if (this.browser) {
      await this.browser.close();
      console.log('🌐 Browser closed');
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
📸 Playwright Screenshot Tool

Usage:
  tsx screenshot-tool.ts <url> [output-file]
  tsx screenshot-tool.ts --multiple <url1,url2,url3> [output-dir]

Examples:
  tsx screenshot-tool.ts https://example.com my-screenshot.png
  tsx screenshot-tool.ts https://eko-lead-dashboard.vercel.app dashboard.png
  tsx screenshot-tool.ts --multiple "https://google.com,https://github.com" ./screenshots

Options:
  --wait <ms>        Wait time after page load (default: 3000)
  --width <px>       Browser width (default: 1920)
  --height <px>      Browser height (default: 1080)
  --selector <css>    Wait for CSS selector before screenshot
  --no-fullpage      Don't capture full page
    `);
    process.exit(0);
  }

  const screenshotTool = new ScreenshotTool();
  
  try {
    await screenshotTool.initialize();
    
    if (args[0] === '--multiple') {
      const urls = args[1].split(',').map((url: string) => url.trim());
      const outputDir = args[2] || './screenshots';
      
      await screenshotTool.takeMultipleScreenshots(urls, outputDir);
    } else {
      const url = args[0];
      const outputPath = args[1] || `screenshot-${Date.now()}.png`;
      
      // Parse additional options
      const options: any = { url, outputPath };
      
      for (let i = 2; i < args.length; i += 2) {
        const flag = args[i];
        const value = args[i + 1];
        
        switch (flag) {
          case '--wait':
            options.waitTime = parseInt(value);
            break;
          case '--width':
            options.width = parseInt(value);
            break;
          case '--height':
            options.height = parseInt(value);
            break;
          case '--selector':
            options.selector = value;
            break;
          case '--no-fullpage':
            options.fullPage = false;
            i--; // No value for this flag
            break;
        }
      }
      
      await screenshotTool.takeScreenshot(options);
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await screenshotTool.close();
  }
}

if (require.main === module) {
  main();
}