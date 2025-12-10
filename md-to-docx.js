#!/usr/bin/env node

/**
 * Markdown to DOCX Converter
 *
 * Converts Markdown files to DOCX format using:
 * - markdown-it (same package used in index.html for displaying MD as HTML)
 * - html-to-docx for DOCX generation
 *
 * Usage:
 *   node md-to-docx.js <input.md> [output.docx]
 *
 * If output filename is not provided, it will use the input filename with .docx extension
 */

import fs from "fs";
import path from "path";
import MarkdownIt from "markdown-it";
import HTMLtoDOCX from "html-to-docx";

// Initialize markdown-it with default options (same as index.html)
const md = new MarkdownIt();

/**
 * Generate a complete HTML document with proper styling for DOCX conversion
 * @param {string} htmlContent - The HTML content from markdown-it
 * @param {string} title - Document title
 * @returns {string} Complete HTML document
 */
function generateStyledHTML(htmlContent, title) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #333;
    }
    h1 {
      font-size: 24pt;
      font-weight: bold;
      margin-top: 24pt;
      margin-bottom: 12pt;
      color: #2c3e50;
    }
    h2 {
      font-size: 18pt;
      font-weight: bold;
      margin-top: 18pt;
      margin-bottom: 10pt;
      color: #34495e;
    }
    h3 {
      font-size: 14pt;
      font-weight: bold;
      margin-top: 14pt;
      margin-bottom: 8pt;
    }
    h4 {
      font-size: 12pt;
      font-weight: bold;
      margin-top: 12pt;
      margin-bottom: 6pt;
    }
    p {
      margin-top: 0;
      margin-bottom: 10pt;
      text-align: justify;
    }
    ul, ol {
      margin-top: 0;
      margin-bottom: 10pt;
      padding-left: 20pt;
    }
    li {
      margin-bottom: 4pt;
    }
    blockquote {
      margin: 10pt 0;
      padding-left: 15pt;
      border-left: 3px solid #3498db;
      color: #666;
      font-style: italic;
    }
    code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 10pt;
      background-color: #f4f4f4;
      padding: 2pt 4pt;
    }
    pre {
      font-family: 'Courier New', Courier, monospace;
      font-size: 10pt;
      background-color: #f4f4f4;
      padding: 10pt;
      margin: 10pt 0;
      overflow-x: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    pre code {
      padding: 0;
      background: none;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 10pt 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8pt;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    hr {
      border: none;
      border-top: 1px solid #ddd;
      margin: 20pt 0;
    }
    a {
      color: #3498db;
      text-decoration: underline;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    strong {
      font-weight: bold;
    }
    em {
      font-style: italic;
    }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`;
}

/**
 * Extract title from markdown content (first H1 heading)
 * @param {string} markdown - The markdown content
 * @returns {string} The title or default
 */
function extractTitle(markdown) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "Document";
}

/**
 * Convert a Markdown file to DOCX
 * @param {string} inputPath - Path to the input markdown file
 * @param {string} outputPath - Path to the output DOCX file
 */
async function convertMdToDocx(inputPath, outputPath) {
  try {
    // Validate input file exists
    if (!fs.existsSync(inputPath)) {
      console.error(`Error: Input file not found: ${inputPath}`);
      process.exit(1);
    }

    console.log(`Reading markdown file: ${inputPath}`);

    // Read the markdown file
    const markdown = fs.readFileSync(inputPath, "utf-8");

    // Extract title from markdown
    const title = extractTitle(markdown);
    console.log(`Document title: ${title}`);

    // Convert markdown to HTML using markdown-it (same as index.html)
    console.log("Converting markdown to HTML...");
    const htmlContent = md.render(markdown);

    // Generate complete styled HTML document
    const fullHtml = generateStyledHTML(htmlContent, title);

    // Convert HTML to DOCX
    console.log("Converting HTML to DOCX...");
    const docxBuffer = await HTMLtoDOCX(fullHtml, null, {
      title: title,
      subject: "Converted from Markdown",
      creator: "Marky MD to DOCX Converter",
      keywords: ["markdown", "document"],
      description: `Document converted from ${path.basename(inputPath)}`,
      orientation: "portrait",
      margins: {
        top: 1440, // 1 inch in TWIP
        right: 1440,
        bottom: 1440,
        left: 1440,
        header: 720, // 0.5 inch in TWIP
        footer: 720, // 0.5 inch in TWIP
        gutter: 0,
      },
      font: "Times New Roman",
      fontSize: 24, // 12pt in HIP (Half of point)
      table: {
        row: {
          cantSplit: true,
        },
      },
    });

    // Write the DOCX file
    fs.writeFileSync(outputPath, docxBuffer);

    console.log(`✓ Successfully created: ${outputPath}`);
    console.log(`  File size: ${(docxBuffer.length / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error("Error converting file:", error.message);
    process.exit(1);
  }
}

/**
 * Main function - parse arguments and run conversion
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Marky - Markdown to DOCX Converter

Usage:
  node md-to-docx.js <input.md> [output.docx]

Arguments:
  input.md     Path to the input Markdown file
  output.docx  Path to the output DOCX file (optional)
               If not provided, uses input filename with .docx extension

Examples:
  node md-to-docx.js document.md
  node md-to-docx.js document.md output.docx
  node md-to-docx.js ./docs/readme.md ./exports/readme.docx
`);
    process.exit(0);
  }

  const inputPath = path.resolve(args[0]);

  // Generate output path if not provided
  let outputPath;
  if (args[1]) {
    outputPath = path.resolve(args[1]);
  } else {
    const inputDir = path.dirname(inputPath);
    const inputName = path.basename(inputPath, path.extname(inputPath));
    outputPath = path.join(inputDir, `${inputName}.docx`);
  }

  await convertMdToDocx(inputPath, outputPath);
}

// Run the main function
main();
