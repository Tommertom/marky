const md = window.markdownit();
const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
});

const editor = document.getElementById('editor');
const downloadBtn = document.getElementById('downloadBtn');
const exportBtn = document.getElementById('exportBtn');
const uploadBtn = document.getElementById('uploadBtn');
const pasteBtn = document.getElementById('pasteBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const fileInput = document.getElementById('fileInput');
const formatBar = document.getElementById('formatBar');

const defaultContent = `<h1>👋 Welcome to Marky - Your Simple Markdown Editor</h1>
<p>Start editing this document right away. Your changes are automatically saved and rendered in real-time!</p>
<h2>✨ Features</h2>
<ul>
<li><strong>WYSIWYG editing</strong> - What you see is what you get</li>
<li><strong>Auto-save</strong> - Never lose your work</li>
<li><strong>Format toolbar</strong> - Select text to see formatting options</li>
<li><strong>Import/Export</strong> - Upload and download markdown files</li>
<li><strong>Copy to clipboard</strong> - Instantly copy your markdown</li>
</ul>
<h2>⌨️ Keyboard Shortcuts</h2>
<ul>
<li><strong>Ctrl+S</strong> (Cmd+S on Mac) - Download your markdown</li>
<li><strong>Ctrl+O</strong> (Cmd+O on Mac) - Upload a markdown file</li>
</ul>
<h2>🚀 Quick Tips</h2>
<p>Select any text to reveal the <strong>formatting toolbar</strong> above. Use it to change headings, add <em>emphasis</em>, create lists, or insert code blocks.</p>
<p>Click <strong>Copy</strong> to copy your markdown to the clipboard, or <strong>Clear</strong> to start fresh.</p>
<p>Happy writing! 📝</p>`;

let initialContent = editor.innerHTML;
let currentSelection = null;

function htmlToMarkdown(html) {
    return turndownService.turndown(html);
}

function markdownToHtml(markdown) {
    return md.render(markdown);
}

exportBtn.addEventListener('click', async () => {
    const currentContent = editor.innerHTML;
    
    const cssResponse = await fetch('styles.css');
    const cssContent = await cssResponse.text();
    
    const jsResponse = await fetch('app.js');
    const jsContent = await jsResponse.text();
    
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
                    Upload
                </button>
                <button id="exportBtn" title="Export as HTML file">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="12" y1="18" x2="12" y2="12"></line>
                        <line x1="9" y1="15" x2="15" y2="15"></line>
                    </svg>
                    Export
                </button>
                <button id="downloadBtn" title="Download as markdown (Ctrl+S)">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Download
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
    <script>
${jsContent}
    <\/script>
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

downloadBtn.addEventListener('click', () => {
    const html = editor.innerHTML;
    const markdown = htmlToMarkdown(html);
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

uploadBtn.addEventListener('click', () => {
    fileInput.click();
});

copyBtn.addEventListener('click', async () => {
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
        alert('Unable to copy to clipboard. Please grant clipboard permissions.');
    }
});

clearBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the document? This will remove all content and auto-saved data.')) {
        localStorage.removeItem('markdownContent');
        editor.innerHTML = '<p><br></p>';
        editor.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.setStart(editor.firstChild, 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
    }
});

pasteBtn.addEventListener('click', async () => {
    try {
        const clipboardText = await navigator.clipboard.readText();
        if (clipboardText && clipboardText.trim()) {
            const html = markdownToHtml(clipboardText);
            editor.innerHTML = html;
        }
    } catch (err) {
        alert('Unable to access clipboard. Please grant clipboard permissions.');
    }
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const markdown = event.target.result;
        const html = markdownToHtml(markdown);
        editor.innerHTML = html;
    };
    reader.readAsText(file);
    fileInput.value = '';
});

editor.addEventListener('paste', (e) => {
    e.preventDefault();
    
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');
    
    if (html && html.trim()) {
        document.execCommand('insertHTML', false, html);
    } else if (text && text.trim()) {
        document.execCommand('insertText', false, text);
    }
});

let saveTimer;
editor.addEventListener('input', () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        localStorage.setItem('markdownContent', editor.innerHTML);
    }, 1000);
});

window.addEventListener('load', () => {
    const saved = localStorage.getItem('markdownContent');
    if (saved) {
        editor.innerHTML = saved;
    } else {
        editor.innerHTML = defaultContent;
    }
});

window.addEventListener('beforeunload', () => {
    localStorage.setItem('markdownContent', editor.innerHTML);
});

function showFormatBar() {
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) {
        formatBar.classList.remove('visible');
        return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    if (rect.width === 0) {
        formatBar.classList.remove('visible');
        return;
    }

    const editorRect = editor.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    formatBar.style.left = `${rect.left + (rect.width / 2) - (formatBar.offsetWidth / 2)}px`;
    formatBar.style.top = `${rect.top + scrollTop - formatBar.offsetHeight - 10}px`;
    formatBar.classList.add('visible');
    
    updateActiveButtons();
}

function updateActiveButtons() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    let node = selection.anchorNode;
    if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentElement;
    }
    
    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    while (node && node !== editor) {
        const tagName = node.tagName?.toLowerCase();
        const btn = document.querySelector(`.format-btn[data-format="${tagName}"]`);
        if (btn) {
            btn.classList.add('active');
        }
        
        if (tagName === 'strong' || tagName === 'b') {
            const boldBtn = document.querySelector('.format-btn[data-format="bold"]');
            if (boldBtn) {
                boldBtn.classList.add('active');
            }
        }
        
        if (tagName === 'em' || tagName === 'i') {
            const italicBtn = document.querySelector('.format-btn[data-format="italic"]');
            if (italicBtn) {
                italicBtn.classList.add('active');
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
    
    if (format === 'bold') {
        document.execCommand('bold', false, null);
        setTimeout(() => {
            localStorage.setItem('markdownContent', editor.innerHTML);
        }, 100);
        return;
    }
    
    if (format === 'italic') {
        document.execCommand('italic', false, null);
        setTimeout(() => {
            localStorage.setItem('markdownContent', editor.innerHTML);
        }, 100);
        return;
    }
    
    let targetElement = container;
    while (targetElement && targetElement !== editor && 
           !['P', 'H1', 'H2', 'H3', 'LI', 'PRE'].includes(targetElement.tagName)) {
        targetElement = targetElement.parentElement;
    }
    
    if (!targetElement || targetElement === editor) {
        targetElement = container;
    }
    
    if (format === 'ul' || format === 'ol') {
        const listParent = targetElement.closest('ul, ol');
        
        if (listParent) {
            const li = targetElement.closest('li');
            if (li) {
                const p = document.createElement('p');
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
            const li = document.createElement('li');
            li.innerHTML = content;
            list.appendChild(li);
            targetElement.parentNode.replaceChild(list, targetElement);
        }
    } else if (format === 'code') {
        const pre = targetElement.closest('pre');
        
        if (pre) {
            const p = document.createElement('p');
            p.textContent = pre.textContent;
            pre.parentNode.replaceChild(p, pre);
        } else {
            const content = targetElement.textContent;
            const preElement = document.createElement('pre');
            const codeElement = document.createElement('code');
            codeElement.textContent = content;
            preElement.appendChild(codeElement);
            targetElement.parentNode.replaceChild(preElement, targetElement);
        }
    } else {
        const newElement = document.createElement(format);
        newElement.innerHTML = targetElement.innerHTML;
        targetElement.parentNode.replaceChild(newElement, targetElement);
    }
    
    formatBar.classList.remove('visible');
    setTimeout(() => {
        localStorage.setItem('markdownContent', editor.innerHTML);
    }, 100);
}

document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (editor.contains(range.commonAncestorContainer)) {
            showFormatBar();
        } else {
            formatBar.classList.remove('visible');
        }
    }
});

document.addEventListener('click', (e) => {
    if (!formatBar.contains(e.target) && e.target !== editor && !editor.contains(e.target)) {
        formatBar.classList.remove('visible');
    }
});

document.querySelectorAll('.format-btn').forEach(btn => {
    btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const format = btn.dataset.format;
        applyFormat(format);
    });
});

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        downloadBtn.click();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        uploadBtn.click();
    }
});
