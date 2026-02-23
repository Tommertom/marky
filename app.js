const md = window.markdownit();
const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

// Initialize Mermaid with theme support
const currentTheme =
  document.documentElement.getAttribute("data-theme") || "light";
mermaid.initialize({
  startOnLoad: false,
  theme: currentTheme === "dark" ? "dark" : "default",
  securityLevel: "loose",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
});

// Mermaid diagram counter for unique IDs
let mermaidCounter = 0;

/**
 * Render all mermaid code blocks in the given container
 * Converts <pre><code class="language-mermaid"> to rendered SVG diagrams
 */
async function renderMermaidDiagrams(container) {
  const mermaidBlocks = container.querySelectorAll("pre code.language-mermaid");

  for (const codeBlock of mermaidBlocks) {
    const pre = codeBlock.parentElement;
    const source = codeBlock.textContent.trim();

    if (!source) continue;

    const wrapper = document.createElement("div");
    wrapper.className = "mermaid-wrapper";
    wrapper.setAttribute("contenteditable", "false");

    // Store source in hidden element for markdown conversion
    const sourceElement = document.createElement("pre");
    sourceElement.className = "mermaid-source";
    sourceElement.textContent = source;
    wrapper.appendChild(sourceElement);

    const diagramContainer = document.createElement("div");
    diagramContainer.className = "mermaid-diagram";
    wrapper.appendChild(diagramContainer);

    try {
      const id = `mermaid-${Date.now()}-${mermaidCounter++}`;
      const { svg } = await mermaid.render(id, source);
      diagramContainer.innerHTML = svg;
    } catch (error) {
      console.error("[Mermaid] Render error:", error);
      const errorDiv = document.createElement("div");
      errorDiv.className = "mermaid-error";
      errorDiv.textContent = `Mermaid Error: ${
        error.message || "Failed to render diagram"
      }`;
      diagramContainer.appendChild(errorDiv);

      // Also show the source code when there's an error
      const codeDisplay = document.createElement("pre");
      codeDisplay.style.textAlign = "left";
      codeDisplay.style.marginTop = "1rem";
      codeDisplay.innerHTML = `<code>${source
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</code>`;
      diagramContainer.appendChild(codeDisplay);
    }

    pre.parentNode.replaceChild(wrapper, pre);
  }
}

/**
 * Re-render all mermaid diagrams with new theme
 */
async function reRenderMermaidWithTheme(theme) {
  mermaid.initialize({
    startOnLoad: false,
    theme: theme === "dark" ? "dark" : "default",
    securityLevel: "loose",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
  });

  const wrappers = editor.querySelectorAll(".mermaid-wrapper");
  for (const wrapper of wrappers) {
    const sourceElement = wrapper.querySelector(".mermaid-source");
    if (!sourceElement) continue;

    const source = sourceElement.textContent.trim();
    const diagramContainer = wrapper.querySelector(".mermaid-diagram");

    try {
      const id = `mermaid-${Date.now()}-${mermaidCounter++}`;
      const { svg } = await mermaid.render(id, source);
      diagramContainer.innerHTML = svg;
    } catch (error) {
      console.error("[Mermaid] Re-render error:", error);
    }
  }
}

// Turndown rule to convert mermaid wrappers back to markdown code blocks
turndownService.addRule("mermaid", {
  filter: function (node) {
    return node.classList && node.classList.contains("mermaid-wrapper");
  },
  replacement: function (content, node) {
    const sourceElement = node.querySelector(".mermaid-source");
    if (sourceElement) {
      const source = sourceElement.textContent.trim();
      return "\n\n```mermaid\n" + source + "\n```\n\n";
    }
    return "";
  },
});

const editor = document.getElementById("editor");
const downloadBtn = document.getElementById("downloadBtn");
const exportBtn = document.getElementById("exportBtn");
const pdfBtn = document.getElementById("pdfBtn");
const uploadBtn = document.getElementById("uploadBtn");
const pasteBtn = document.getElementById("pasteBtn");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");
const fileInput = document.getElementById("fileInput");
const formatBar = document.getElementById("formatBar");

const defaultContent = `<h1>👋 Welcome to Marky</h1>
<p>A simple markdown editor that runs in your browser. Start typing and see your formatted text in real-time!</p>
<h2>✨ Quick Start</h2>
<ul>
<li><strong>Select text</strong> to see formatting options appear above</li>
<li><strong>Paste MD</strong> - Load markdown from your clipboard</li>
<li><strong>Upload MD</strong> - Import existing markdown files</li>
<li><strong>Download MD</strong> - Save your work (or press <strong>Ctrl+S</strong>)</li>
<li><strong>Copy MD</strong> - Copy to clipboard instantly</li>
<li><strong>Export HTML</strong> - Generate editable HTML files that anyone can modify and return to you!</li>
</ul>
<h2>⌨️ Keyboard Shortcuts</h2>
<ul>
<li><strong>Ctrl+S</strong> (Cmd+S on Mac) - Download markdown</li>
<li><strong>Ctrl+O</strong> (Cmd+O on Mac) - Upload file</li>
<li><strong>Ctrl+Z</strong> (Cmd+Z on Mac) - Undo</li>
<li><strong>Ctrl+Y</strong> or <strong>Ctrl+Shift+Z</strong> (Cmd+Shift+Z on Mac) - Redo</li>
</ul>
<h2>🔄 Collaborative Workflow</h2>
<p>Export as HTML to share editable documents. Recipients can open the HTML file in any browser, make their edits, save, and send it back to you. No markdown knowledge required! All editing happens locally - no data sent to servers.</p>
<p><strong>Ready to write?</strong> Click "Clear" to start with a blank document, or just start typing!</p>`;

let initialContent = editor.innerHTML;
let currentSelection = null;

function htmlToMarkdown(html) {
  return turndownService.turndown(html);
}

function markdownToHtml(markdown) {
  return md.render(markdown);
}

function generatePDFFilename() {
  const firstHeading = editor.querySelector("h1");
  let title = "marky";

  if (firstHeading && firstHeading.textContent.trim()) {
    title = firstHeading.textContent
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 50);
  }

  const timestamp = Date.now();
  return `${title}-${timestamp}.pdf`;
}

async function compressImage(imgElement, maxSizeBytes = 1048576) {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = imgElement.naturalWidth || imgElement.width;
    canvas.height = imgElement.naturalHeight || imgElement.height;

    ctx.drawImage(imgElement, 0, 0);

    let quality = 0.95;
    let compressedDataUrl = canvas.toDataURL("image/jpeg", quality);

    while (compressedDataUrl.length > maxSizeBytes * 1.37 && quality > 0.1) {
      quality -= 0.05;
      compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
    }

    const originalSize = imgElement.src.length;
    const compressedSize = compressedDataUrl.length;

    console.log(
      `[PDF] Image compressed: ${(originalSize / 1024).toFixed(2)}KB → ${(
        compressedSize / 1024
      ).toFixed(2)}KB (quality: ${quality.toFixed(2)})`,
    );

    return {
      dataUrl: compressedDataUrl,
      originalSize: originalSize,
      compressedSize: compressedSize,
      quality: quality,
      wasCompressed: compressedSize < originalSize,
    };
  } catch (error) {
    console.warn("[PDF] Image compression failed:", error);
    return {
      dataUrl: imgElement.src,
      originalSize: imgElement.src.length,
      compressedSize: imgElement.src.length,
      quality: 1.0,
      wasCompressed: false,
      error: error.message,
    };
  }
}

async function processImages(element) {
  const images = element.querySelectorAll("img");
  const warnings = [];

  for (let img of images) {
    const originalSrc = img.src;

    if (img.src.length > 1048576 * 1.37) {
      const result = await compressImage(img);

      if (result.wasCompressed) {
        img.src = result.dataUrl;
        warnings.push(
          `Image compressed from ${(result.originalSize / 1024).toFixed(
            0,
          )}KB to ${(result.compressedSize / 1024).toFixed(0)}KB`,
        );
      } else if (result.error) {
        warnings.push(`Failed to compress image: ${result.error}`);
      }
    }
  }

  return warnings;
}

async function generatePDF() {
  console.log("[PDF] Starting PDF generation");

  if (typeof html2pdf === "undefined") {
    console.error("[PDF] html2pdf library not loaded");
    throw new Error("PDF library not loaded. Please refresh the page.");
  }

  const element = editor.cloneNode(true);
  const filename = generatePDFFilename();

  // Create a temporary wrapper to hold the cloned element
  // Must be visible for html2canvas to render properly
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "-10000px"; // Off-screen but must be rendered
  wrapper.style.top = "0";
  wrapper.style.width = "210mm"; // A4 width
  wrapper.style.background = "#ffffff";
  wrapper.style.padding = "20px";
  wrapper.style.zIndex = "-1";

  // Apply light mode styles to cloned element
  element.style.background = "#ffffff";
  element.style.color = "#333333";
  element.style.border = "none";
  element.style.margin = "0";
  element.style.padding = "0";
  element.style.width = "100%";
  element.style.fontFamily =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
  element.style.fontSize = "16px";
  element.style.lineHeight = "1.6";

  // Force light mode colors on all child elements
  const allElements = element.querySelectorAll("*");
  allElements.forEach((el) => {
    // Reset color to inherit from parent
    el.style.color = "#333333";

    // Fix specific elements that might have CSS variable colors
    if (el.tagName === "H1" || el.tagName === "H2" || el.tagName === "H3") {
      el.style.color = "#2c3e50";
      el.style.fontWeight = "bold";
    } else if (el.tagName === "A") {
      el.style.color = "#3498db";
    } else if (el.tagName === "CODE") {
      el.style.backgroundColor = "#f4f4f4";
      el.style.color = "#e74c3c";
      el.style.padding = "2px 4px";
    } else if (el.tagName === "PRE") {
      el.style.backgroundColor = "#f4f4f4";
      el.style.color = "#333333";
      el.style.padding = "10px";
    } else if (el.tagName === "BLOCKQUOTE") {
      el.style.borderLeftColor = "#3498db";
      el.style.backgroundColor = "#f9f9f9";
      el.style.color = "#666666";
    } else if (el.tagName === "TH" || el.tagName === "TD") {
      el.style.borderColor = "#ddd";
      el.style.color = "#333333";
    }
  });

  // Fix Mermaid diagram scaling for PDF
  const mermaidWrappers = element.querySelectorAll(".mermaid-wrapper");
  mermaidWrappers.forEach((wrapper) => {
    wrapper.style.background = "#ffffff";
    wrapper.style.padding = "10px";
    wrapper.style.margin = "10px 0";
    wrapper.style.textAlign = "center";
    wrapper.style.overflow = "visible";

    const svg = wrapper.querySelector("svg");
    if (svg) {
      // Get original dimensions
      const viewBox = svg.getAttribute("viewBox");
      const originalWidth = svg.getAttribute("width");
      const originalHeight = svg.getAttribute("height");

      // Set max width to fit page and maintain aspect ratio
      svg.style.maxWidth = "100%";
      svg.style.height = "auto";
      svg.style.display = "block";
      svg.style.margin = "0 auto";

      // Remove any fixed dimensions that might cause overflow
      if (originalWidth && parseFloat(originalWidth) > 600) {
        svg.setAttribute("width", "100%");
        svg.removeAttribute("height");
      }
    }
  });

  // Add to DOM temporarily
  wrapper.appendChild(element);
  document.body.appendChild(wrapper);

  try {
    // Give browser time to compute styles and layout
    await new Promise((resolve) => setTimeout(resolve, 200));

    console.log("[PDF] Element dimensions:", {
      width: element.offsetWidth,
      height: element.offsetHeight,
      scrollWidth: element.scrollWidth,
      scrollHeight: element.scrollHeight,
    });

    const warnings = await processImages(element);

    const options = {
      margin: [10, 10, 10, 10],
      filename: filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
        backgroundColor: "#ffffff",
        logging: true,
        letterRendering: true,
        allowTaint: false,
        removeContainer: false,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    console.log("[PDF] Generating PDF with options:", options);
    if (warnings.length > 0) {
      console.log("[PDF] Warnings:", warnings);
    }

    await html2pdf().set(options).from(element).save();
    console.log("[PDF] PDF generated successfully:", filename);
    return { success: true, filename: filename, warnings: warnings };
  } catch (error) {
    console.error("[PDF] PDF generation failed:", error);
    throw error;
  } finally {
    // Always remove the temporary wrapper from DOM
    if (wrapper.parentNode) {
      document.body.removeChild(wrapper);
    }
  }
}

exportBtn.addEventListener("click", async () => {
  const currentContent = editor.innerHTML;

  let cssContent = "";
  let jsContent = "";

  try {
    const [cssRes, jsRes] = await Promise.all([
      fetch("/app.css"),
      fetch("/app.js"),
    ]);
    cssContent = await cssRes.text();
    jsContent = await jsRes.text();
  } catch (err) {
    console.warn("[Export] Could not fetch external files:", err);
  }

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown Editor</title>
    <style>
${cssContent}
    </style>
</head>
<body>
    <div class="container">
        <div class="toolbar">
            <h1>Markdown Editor</h1>
            <div class="buttons">
                <button id="pasteBtn" title="Paste from clipboard">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                    </svg>
                    Paste
                </button>
                <button id="uploadBtn" title="Upload markdown file (Ctrl+O)" style="margin-right: 1rem;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    Upload MD
                </button>
                <button id="exportBtn" title="Export as HTML file">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="12" y1="18" x2="12" y2="12"></line>
                        <line x1="9" y1="15" x2="15" y2="15"></line>
                    </svg>
                    Export HTML
                </button>
                <button id="pdfBtn" title="Export as PDF file" aria-label="Export document as PDF">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <span class="btn-text">PDF</span>
                    <span class="loading-indicator" style="display:none">⏳</span>
                </button>
                <button id="downloadBtn" title="Download as markdown (Ctrl+S)">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Download MD
                </button>
                <button id="copyBtn" title="Copy markdown to clipboard" style="margin-right: 1rem;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy
                </button>
                <button id="clearBtn" title="Clear document">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                    Clear
                </button>
                <a href="https://github.com/Tommertom/marky" target="_blank" rel="noopener noreferrer" id="githubBtn" title="View on GitHub">
                    <svg height="32" viewBox="0 0 24 24" version="1.1" width="32" fill="white">
                        <path d="M12 1C5.923 1 1 5.923 1 12c0 4.867 3.149 8.979 7.521 10.436.55.096.756-.233.756-.522 0-.262-.013-1.128-.013-2.049-2.764.509-3.479-.674-3.699-1.292-.124-.317-.66-1.293-1.127-1.554-.385-.207-.936-.715-.014-.729.866-.014 1.485.797 1.691 1.128.99 1.663 2.571 1.196 3.204.907.096-.715.385-1.196.701-1.471-2.448-.275-5.005-1.224-5.005-5.432 0-1.196.426-2.186 1.128-2.956-.111-.275-.496-1.402.11-2.915 0 0 .921-.288 3.024 1.128a10.193 10.193 0 0 1 2.75-.371c.936 0 1.871.123 2.75.371 2.104-1.43 3.025-1.128 3.025-1.128.605 1.513.221 2.64.111 2.915.701.77 1.127 1.747 1.127 2.956 0 4.222-2.571 5.157-5.019 5.432.399.344.743 1.004.743 2.035 0 1.471-.014 2.654-.014 3.025 0 .289.206.632.756.522C19.851 20.979 23 16.854 23 12c0-6.077-4.922-11-11-11Z"></path>
                    </svg>
                </a>
            </div>
        </div>
        
        <div id="formatBar" class="format-bar">
            <button class="format-btn" data-format="p" title="Paragraph">P</button>
            <button class="format-btn" data-format="h1" title="Heading 1">H1</button>
            <button class="format-btn" data-format="h2" title="Heading 2">H2</button>
            <button class="format-btn" data-format="h3" title="Heading 3">H3</button>
            <div class="separator"></div>
            <button class="format-btn" data-format="bold" title="Bold">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
                    <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
                </svg>
            </button>
            <button class="format-btn" data-format="italic" title="Italic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="19" y1="4" x2="10" y2="4"></line>
                    <line x1="14" y1="20" x2="5" y2="20"></line>
                    <line x1="15" y1="4" x2="9" y2="20"></line>
                </svg>
            </button>
            <div class="separator"></div>
            <button class="format-btn" data-format="ul" title="Bullet List">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <circle cx="3" cy="6" r="1" fill="currentColor"></circle>
                    <circle cx="3" cy="12" r="1" fill="currentColor"></circle>
                    <circle cx="3" cy="18" r="1" fill="currentColor"></circle>
                </svg>
            </button>
            <button class="format-btn" data-format="ol" title="Numbered List">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="10" y1="6" x2="21" y2="6"></line>
                    <line x1="10" y1="12" x2="21" y2="12"></line>
                    <line x1="10" y1="18" x2="21" y2="18"></line>
                    <text x="3" y="8" font-size="8" fill="currentColor">1.</text>
                    <text x="3" y="14" font-size="8" fill="currentColor">2.</text>
                    <text x="3" y="20" font-size="8" fill="currentColor">3.</text>
                </svg>
            </button>
            <button class="format-btn" data-format="code" title="Code Block">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="16 18 22 12 16 6"></polyline>
                    <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
            </button>
        </div>
        
        <div id="editor" contenteditable="true" spellcheck="true">
            ${currentContent}
        </div>
    </div>
    
    <input type="file" id="fileInput" accept=".md,.markdown,.txt" style="display: none;">
    
    <script src="https://cdn.jsdelivr.net/npm/markdown-it@13.0.1/dist/markdown-it.min.js"><\/script>
    <script src="https://cdn.jsdelivr.net/npm/turndown@7.1.2/dist/turndown.min.js"><\/script>
    <script id="app-script">
${jsContent}
    <\/script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${Date.now()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

downloadBtn.addEventListener("click", () => {
  const html = editor.innerHTML;
  const markdown = htmlToMarkdown(html);

  const blob = new Blob([markdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "document.md";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

uploadBtn.addEventListener("click", () => {
  fileInput.click();
});

copyBtn.addEventListener("click", async () => {
  const html = editor.innerHTML;
  const markdown = htmlToMarkdown(html);

  try {
    await navigator.clipboard.writeText(markdown);
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        Copied!`;
    setTimeout(() => {
      copyBtn.innerHTML = originalText;
    }, 2000);
  } catch (err) {
    alert("Unable to copy to clipboard. Please grant clipboard permissions.");
  }
});

clearBtn.addEventListener("click", () => {
  if (
    confirm(
      "Are you sure you want to clear the document? This will remove all content and auto-saved data.",
    )
  ) {
    editor.innerHTML = "<p><br></p>";
    localStorage.removeItem("markdownContent");

    // Debug logging
    console.log("=== MARKY CLEAR DEBUG ===");
    console.log(
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          action: "Clear button clicked",
          editorContent: editor.innerHTML,
          localStorageRemoved: true,
          remainingKeys: Object.keys(localStorage),
        },
        null,
        2,
      ),
    );

    editor.focus();
    const range = document.createRange();
    const sel = window.getSelection();
    range.setStart(editor.firstChild, 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }
});

pdfBtn.addEventListener("click", async () => {
  const loadingIndicator = pdfBtn.querySelector(".loading-indicator");
  const btnText = pdfBtn.querySelector(".btn-text");

  try {
    pdfBtn.disabled = true;
    btnText.style.display = "none";
    loadingIndicator.style.display = "inline-block";

    const result = await generatePDF();

    btnText.style.display = "inline";
    loadingIndicator.style.display = "none";

    const originalText = btnText.textContent;
    btnText.textContent = "✓ Saved!";
    setTimeout(() => {
      btnText.textContent = originalText;
      pdfBtn.disabled = false;
    }, 2000);
  } catch (error) {
    btnText.style.display = "inline";
    loadingIndicator.style.display = "none";

    const originalText = btnText.textContent;
    btnText.textContent = "✗ Failed";
    setTimeout(() => {
      btnText.textContent = originalText;
      pdfBtn.disabled = false;
    }, 2000);

    alert(`Failed to generate PDF: ${error.message}`);
  }
});

pasteBtn.addEventListener("click", async () => {
  try {
    const clipboardText = await navigator.clipboard.readText();
    if (clipboardText && clipboardText.trim()) {
      const html = markdownToHtml(clipboardText);
      editor.innerHTML = html;
      await renderMermaidDiagrams(editor);
      localStorage.setItem("markdownContent", editor.innerHTML);
    }
  } catch (err) {
    alert("Unable to access clipboard. Please grant clipboard permissions.");
  }
});

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    const markdown = event.target.result;
    const html = markdownToHtml(markdown);
    editor.innerHTML = html;
    await renderMermaidDiagrams(editor);
    localStorage.setItem("markdownContent", editor.innerHTML);
  };
  reader.readAsText(file);
  fileInput.value = "";
});

editor.addEventListener("paste", (e) => {
  e.preventDefault();

  const html = e.clipboardData.getData("text/html");
  const text = e.clipboardData.getData("text/plain");

  if (html && html.trim()) {
    document.execCommand("insertHTML", false, html);
  } else if (text && text.trim()) {
    document.execCommand("insertText", false, text);
  }
});

let saveTimer;
editor.addEventListener("input", () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    localStorage.setItem("markdownContent", editor.innerHTML);
  }, 1000);
});

window.addEventListener("load", () => {
  const saved = localStorage.getItem("markdownContent");
  const theme = localStorage.getItem("marky-theme");

  // Check if saved content is essentially empty
  const savedTrimmed = saved ? saved.trim() : "";
  const isEmptyContent =
    !saved ||
    savedTrimmed === "" ||
    savedTrimmed === "<p><br></p>" ||
    savedTrimmed === "<p></p>";

  // Check if current editor content is the default welcome message
  // This helps distinguish between main app (should load default) vs exported HTML (keep embedded content)
  const currentContent = editor.innerHTML.trim();
  const isCurrentContentDefault =
    currentContent.includes("👋 Welcome to Marky") &&
    currentContent.includes("Quick Start");
  const isCurrentContentEmpty =
    !currentContent ||
    currentContent === "<p><br></p>" ||
    currentContent === "<p></p>";

  // Debug logging in JSON format
  const debugInfo = {
    timestamp: new Date().toISOString(),
    localStorage: {
      markdownContent: {
        exists: saved !== null,
        isUndefined: saved === undefined,
        value: saved,
        length: saved ? saved.length : 0,
        trimmed: savedTrimmed,
        trimmedLength: savedTrimmed.length,
        isEmptyContent: isEmptyContent,
      },
      theme: theme,
      allKeys: Object.keys(localStorage),
      storageSize: JSON.stringify(localStorage).length,
    },
    decision: {
      hasSavedContent: !!saved && !isEmptyContent,
      isCurrentContentDefault: isCurrentContentDefault,
      isCurrentContentEmpty: isCurrentContentEmpty,
      action: "determining...",
    },
    editorState: {
      currentHTML: editor.innerHTML.substring(0, 100) + "...",
      currentLength: editor.innerHTML.length,
    },
  };

  console.log("=== MARKY LOAD DEBUG ===");
  console.log(JSON.stringify(debugInfo, null, 2));

  if (saved && !isEmptyContent) {
    // Load from localStorage if we have valid saved content
    editor.innerHTML = saved;
    console.log("✓ Loaded saved content from localStorage");
  } else if (isCurrentContentDefault || isCurrentContentEmpty) {
    // Only load default content if current content is the default or empty
    // This preserves embedded content in exported HTML files
    editor.innerHTML = defaultContent;
    console.log("✓ Loaded default welcome content");
    // Clean up the empty content from localStorage
    if (saved) {
      localStorage.removeItem("markdownContent");
      console.log("✓ Removed empty content from localStorage");
    }
  } else {
    // Keep the current editor content (for exported HTML files with embedded content)
    console.log("✓ Keeping existing editor content (exported HTML mode)");
  }
});

window.addEventListener("beforeunload", () => {
  const currentContent = editor.innerHTML.trim();
  // Check if content is empty or just the empty paragraph placeholder
  const willSave =
    currentContent &&
    currentContent !== "<p><br></p>" &&
    currentContent !== "<p></p>" &&
    currentContent !== "";

  // Debug logging
  console.log("=== MARKY BEFOREUNLOAD DEBUG ===");
  console.log(
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        editorContent: {
          raw: currentContent.substring(0, 100) + "...",
          length: currentContent.length,
          trimmedLength: currentContent.trim().length,
          isEmpty: currentContent === "<p><br></p>",
          isEmptyOrWhitespace: !currentContent || currentContent.trim() === "",
        },
        decision: {
          willSave: willSave,
          reason: willSave
            ? "Content is not empty"
            : "Content is empty - not saving",
        },
      },
      null,
      2,
    ),
  );

  // Only save if content is not essentially empty
  if (willSave) {
    localStorage.setItem("markdownContent", editor.innerHTML);
    console.log("✓ Saved content to localStorage on beforeunload");
  } else {
    console.log("✗ Skipped saving empty content on beforeunload");
  }
});

function showFormatBar() {
  const selection = window.getSelection();
  if (!selection.rangeCount || selection.isCollapsed) {
    formatBar.classList.remove("visible");
    return;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  if (rect.width === 0) {
    formatBar.classList.remove("visible");
    return;
  }

  const editorRect = editor.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  formatBar.style.left = `${
    rect.left + rect.width / 2 - formatBar.offsetWidth / 2
  }px`;
  formatBar.style.top = `${
    rect.top + scrollTop - formatBar.offsetHeight - 10
  }px`;
  formatBar.classList.add("visible");

  updateActiveButtons();
}

function updateActiveButtons() {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  let node = selection.anchorNode;
  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  document.querySelectorAll(".format-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  while (node && node !== editor) {
    const tagName = node.tagName?.toLowerCase();
    const btn = document.querySelector(`.format-btn[data-format="${tagName}"]`);
    if (btn) {
      btn.classList.add("active");
    }

    if (tagName === "strong" || tagName === "b") {
      const boldBtn = document.querySelector('.format-btn[data-format="bold"]');
      if (boldBtn) {
        boldBtn.classList.add("active");
      }
    }

    if (tagName === "em" || tagName === "i") {
      const italicBtn = document.querySelector(
        '.format-btn[data-format="italic"]',
      );
      if (italicBtn) {
        italicBtn.classList.add("active");
      }
    }

    node = node.parentElement;
  }
}

function applyFormat(format) {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  let container = range.commonAncestorContainer;

  if (container.nodeType === Node.TEXT_NODE) {
    container = container.parentElement;
  }

  if (format === "bold") {
    document.execCommand("bold", false, null);
    setTimeout(() => {
      localStorage.setItem("markdownContent", editor.innerHTML);
    }, 100);
    return;
  }

  if (format === "italic") {
    document.execCommand("italic", false, null);
    setTimeout(() => {
      localStorage.setItem("markdownContent", editor.innerHTML);
    }, 100);
    return;
  }

  let targetElement = container;
  while (
    targetElement &&
    targetElement !== editor &&
    !["P", "H1", "H2", "H3", "LI", "PRE"].includes(targetElement.tagName)
  ) {
    targetElement = targetElement.parentElement;
  }

  if (!targetElement || targetElement === editor) {
    targetElement = container;
  }

  if (format === "ul" || format === "ol") {
    const listParent = targetElement.closest("ul, ol");

    if (listParent) {
      const li = targetElement.closest("li");
      if (li) {
        const p = document.createElement("p");
        p.innerHTML = li.innerHTML;
        listParent.parentNode.insertBefore(p, listParent);
        li.remove();
        if (listParent.children.length === 0) {
          listParent.remove();
        }
      }
    } else {
      const content = targetElement.innerHTML;
      const list = document.createElement(format);
      const li = document.createElement("li");
      li.innerHTML = content;
      list.appendChild(li);
      targetElement.parentNode.replaceChild(list, targetElement);
    }
  } else if (format === "code") {
    const pre = targetElement.closest("pre");

    if (pre) {
      const p = document.createElement("p");
      p.textContent = pre.textContent;
      pre.parentNode.replaceChild(p, pre);
    } else {
      const content = targetElement.textContent;
      const preElement = document.createElement("pre");
      const codeElement = document.createElement("code");
      codeElement.textContent = content;
      preElement.appendChild(codeElement);
      targetElement.parentNode.replaceChild(preElement, targetElement);
    }
  } else {
    const newElement = document.createElement(format);
    newElement.innerHTML = targetElement.innerHTML;
    targetElement.parentNode.replaceChild(newElement, targetElement);
  }

  formatBar.classList.remove("visible");
  setTimeout(() => {
    localStorage.setItem("markdownContent", editor.innerHTML);
  }, 100);
}

document.addEventListener("selectionchange", () => {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
      showFormatBar();
    } else {
      formatBar.classList.remove("visible");
    }
  }
});

document.addEventListener("click", (e) => {
  if (
    !formatBar.contains(e.target) &&
    e.target !== editor &&
    !editor.contains(e.target)
  ) {
    formatBar.classList.remove("visible");
  }
});

document.querySelectorAll(".format-btn").forEach((btn) => {
  btn.addEventListener("mousedown", (e) => {
    e.preventDefault();
    const format = btn.dataset.format;
    applyFormat(format);
  });
});

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    downloadBtn.click();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "o") {
    e.preventDefault();
    uploadBtn.click();
  }
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "P") {
    e.preventDefault();
    pdfBtn.click();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
    e.preventDefault();
    document.execCommand("undo");
  }
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z") {
    e.preventDefault();
    document.execCommand("redo");
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "y") {
    e.preventDefault();
    document.execCommand("redo");
  }
});
