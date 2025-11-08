const md = window.markdownit();
const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
});

const editor = document.getElementById('editor');
const downloadBtn = document.getElementById('downloadBtn');
const uploadBtn = document.getElementById('uploadBtn');
const pasteBtn = document.getElementById('pasteBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const fileInput = document.getElementById('fileInput');
const formatBar = document.getElementById('formatBar');

const defaultContent = `<h1>👋 Welcome to Marky - Your Markdown Editor</h1>
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
