# Quickstart Guide: PDF Export Implementation

**Feature ID**: 1-pdf-export  
**For**: Developers implementing the PDF export feature  
**Estimated Time**: 2-4 hours

## Prerequisites

- Familiarity with HTML, CSS, JavaScript (ES6+)
- Understanding of async/await pattern
- Basic knowledge of Canvas API
- Access to the Marky codebase

## Implementation Steps

### Step 1: Add PDF Library (5 minutes)

Add the html2pdf.js CDN script to `index.html` before the closing `</body>` tag:

```html
<!-- After markdown-it and turndown scripts -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" 
        integrity="sha512-GsLlZN/3F2ErC5ifS5QtgpiJtWd43JWSuIgh7mbzZ8zBps+dvLusV+eNQATqgA/HdeKFVgA5v3S/cIrLF7QnIg==" 
        crossorigin="anonymous" 
        referrerpolicy="no-referrer"></script>
```

**Verify**: Open browser console and type `html2pdf` - should see function definition.

---

### Step 2: Add PDF Button HTML (10 minutes)

Add the PDF button to the toolbar, after the "Export HTML" button:

```html
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
```

**Verify**: Button appears in toolbar with PDF icon.

---

### Step 3: Add PDF Service Module (30 minutes)

Add this code inside the `<script id="app-script">` block, after the existing functions:

```javascript
// ========== PDF Export Service ==========

/**
 * Generate PDF filename with timestamp
 */
function generatePDFFilename(editorElement) {
  const timestamp = Date.now();
  
  // Try to extract title from first H1
  const firstH1 = editorElement.querySelector('h1');
  if (firstH1 && firstH1.textContent.trim()) {
    const title = firstH1.textContent
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')  // Remove special chars
      .replace(/\s+/g, '-')           // Spaces to hyphens
      .substring(0, 50);              // Max 50 chars
    
    return title ? `${title}-${timestamp}.pdf` : `marky-${timestamp}.pdf`;
  }
  
  return `marky-${timestamp}.pdf`;
}

/**
 * Generate and download PDF from editor content
 */
async function generatePDF(editorElement, options = {}) {
  // Validate library loaded
  if (typeof html2pdf === 'undefined') {
    throw new Error('PDF library not loaded');
  }
  
  // Generate filename
  const filename = options.filename || generatePDFFilename(editorElement);
  
  // Configure PDF options
  const pdfOptions = {
    margin: options.margin || 10,
    filename: filename,
    image: {
      type: options.image?.type || 'jpeg',
      quality: options.image?.quality || 0.95
    },
    html2canvas: {
      scale: options.html2canvas?.scale || 2,
      useCORS: true,
      logging: false,
      letterRendering: true
    },
    jsPDF: {
      unit: 'mm',
      format: options.jsPDF?.format || 'a4',
      orientation: options.jsPDF?.orientation || 'portrait'
    },
    pagebreak: {
      mode: ['avoid-all', 'css'],
      avoid: ['img', 'table', 'tr', 'code', 'pre']
    }
  };
  
  try {
    // Generate PDF
    await html2pdf().set(pdfOptions).from(editorElement).save();
    
    return {
      success: true,
      filename: filename,
      fileSize: 0, // html2pdf doesn't provide blob access
      warnings: []
    };
  } catch (error) {
    console.error('PDF generation error:', error);
    
    // Determine error type
    let errorMessage = 'PDF generation failed. Please try again.';
    if (error.message.includes('canvas')) {
      errorMessage = 'Document too large. Try exporting smaller sections.';
    } else if (error.message.includes('Failed to load')) {
      errorMessage = 'Some images failed to load. PDF may be incomplete.';
    }
    
    return {
      success: false,
      filename: filename,
      fileSize: 0,
      error: errorMessage,
      warnings: []
    };
  }
}
```

**Verify**: Functions are defined (check browser console).

---

### Step 4: Add Button Event Handler (15 minutes)

Add the PDF button click handler after the existing button handlers:

```javascript
// PDF Export Button
pdfBtn.addEventListener("click", async () => {
  const loadingIndicator = pdfBtn.querySelector('.loading-indicator');
  const buttonText = pdfBtn.querySelector('.btn-text');
  
  // Show loading state
  pdfBtn.disabled = true;
  buttonText.style.display = 'none';
  loadingIndicator.style.display = 'inline';
  loadingIndicator.textContent = '⏳';
  
  try {
    const result = await generatePDF(editor);
    
    if (result.success) {
      // Show success feedback
      loadingIndicator.textContent = '✓';
      setTimeout(() => {
        buttonText.style.display = 'inline';
        loadingIndicator.style.display = 'none';
        pdfBtn.disabled = false;
      }, 2000);
    } else {
      // Show error
      alert(result.error || 'PDF generation failed. Please try again.');
      buttonText.style.display = 'inline';
      loadingIndicator.style.display = 'none';
      pdfBtn.disabled = false;
    }
  } catch (error) {
    console.error('PDF export error:', error);
    alert('PDF generation failed. Please try again.');
    buttonText.style.display = 'inline';
    loadingIndicator.style.display = 'none';
    pdfBtn.disabled = false;
  }
});
```

**Verify**: Click PDF button - should generate and download PDF.

---

### Step 5: Add Mobile Responsive CSS (10 minutes)

The PDF button should already inherit styles from existing buttons, but verify the mobile responsiveness works by adding to the existing `@media (max-width: 768px)` rule:

```css
/* Should already be handled by existing button styles */
/* Verify PDF button scales properly on mobile */
```

**Verify**: Test on mobile device or use browser dev tools to simulate mobile view.

---

### Step 6: Test Basic Functionality (20 minutes)

Run through these test cases:

#### Test 1: Empty Document
```
1. Clear editor content
2. Click PDF button
3. Verify: Nearly blank PDF downloads
4. Filename format: "marky-{timestamp}.pdf"
```

#### Test 2: Text-Only Document
```
1. Add heading, paragraphs, lists
2. Click PDF button
3. Verify: PDF matches editor rendering
4. File size: <1MB
```

#### Test 3: Document with Images
```
1. Paste or add image to editor
2. Click PDF button
3. Verify: Image appears in PDF
4. Check console for compression logs
```

#### Test 4: Large Document
```
1. Create 10+ pages of content
2. Click PDF button
3. Verify: All pages included in PDF
4. Generation time: <10 seconds
```

#### Test 5: Error Handling
```
1. Temporarily rename html2pdf in console: `window.html2pdf = null`
2. Click PDF button
3. Verify: Error alert displays
4. Button returns to normal state
5. Restore: Refresh page
```

---

### Step 7: Cross-Browser Testing (30 minutes)

Test on:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (if available)
- ✅ Edge (latest)
- ✅ Mobile Safari (iOS)
- ✅ Mobile Chrome (Android)

**Critical checks**:
- PDF downloads successfully
- No console errors
- Button states work (loading, success, error)
- File opens in PDF viewer

---

### Step 8: Performance Validation (15 minutes)

Measure generation times:

```javascript
// Add timing logs to generatePDF function
const startTime = performance.now();
await html2pdf().set(pdfOptions).from(editorElement).save();
const endTime = performance.now();
console.log(`PDF generation took ${endTime - startTime}ms`);
```

**Targets**:
- Small doc (1-3 pages): <2000ms
- Medium doc (5-10 pages): <5000ms
- Large doc (20+ pages): <15000ms

If times exceed targets, consider:
- Reducing `html2canvas.scale` from 2 to 1.5
- Reducing `image.quality` from 0.95 to 0.9

---

### Step 9: Accessibility Check (10 minutes)

Verify:
- ✅ Button has `title` attribute
- ✅ Button has `aria-label` attribute
- ✅ Loading state is visible (screen reader: test with narrator/voiceover)
- ✅ Tab navigation works
- ✅ Enter key triggers button (default behavior)

Test with screen reader if available.

---

### Step 10: Final Code Review (15 minutes)

Checklist:
- [ ] No console errors in production
- [ ] Code follows existing style (indentation, naming)
- [ ] Comments added to complex sections
- [ ] No hardcoded values (use constants)
- [ ] Error messages are user-friendly
- [ ] Loading indicators work properly
- [ ] No memory leaks (test repeated generations)

---

## Common Issues & Solutions

### Issue 1: PDF Library Not Loading

**Symptom**: `html2pdf is not defined` error

**Solution**:
```javascript
// Add after script tag:
window.addEventListener('load', () => {
  if (typeof html2pdf === 'undefined') {
    console.error('html2pdf.js failed to load from CDN');
    // Optionally hide PDF button:
    // document.getElementById('pdfBtn').style.display = 'none';
  }
});
```

### Issue 2: Images Not Appearing in PDF

**Symptom**: PDF shows broken image placeholders

**Solution**:
- Check `useCORS: true` is set in `html2canvas` options
- Verify images are not blocked by CORS policy
- Use data URLs instead of external URLs for images

### Issue 3: Canvas Too Large Error

**Symptom**: Error message about canvas size

**Solution**:
- Reduce `html2canvas.scale` from 2 to 1
- Split large documents into multiple exports
- Warn users about document size limits

### Issue 4: Slow Generation on Mobile

**Symptom**: PDF takes >15 seconds on mobile

**Solution**:
```javascript
// Detect mobile and reduce quality
const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
const pdfOptions = {
  // ...
  html2canvas: {
    scale: isMobile ? 1 : 2,  // Reduce scale on mobile
  },
  image: {
    quality: isMobile ? 0.85 : 0.95  // Reduce quality on mobile
  }
};
```

---

## Code Snippets Reference

### Complete PDF Button Handler (Copy-Paste Ready)

```javascript
const pdfBtn = document.getElementById("pdfBtn");

pdfBtn.addEventListener("click", async () => {
  const loadingIndicator = pdfBtn.querySelector('.loading-indicator');
  const buttonText = pdfBtn.querySelector('.btn-text');
  
  pdfBtn.disabled = true;
  buttonText.style.display = 'none';
  loadingIndicator.style.display = 'inline';
  loadingIndicator.textContent = '⏳';
  
  try {
    const result = await generatePDF(editor);
    
    if (result.success) {
      loadingIndicator.textContent = '✓';
      setTimeout(() => {
        buttonText.style.display = 'inline';
        loadingIndicator.style.display = 'none';
        pdfBtn.disabled = false;
      }, 2000);
    } else {
      alert(result.error || 'PDF generation failed.');
      buttonText.style.display = 'inline';
      loadingIndicator.style.display = 'none';
      pdfBtn.disabled = false;
    }
  } catch (error) {
    console.error('PDF error:', error);
    alert('PDF generation failed. Please try again.');
    buttonText.style.display = 'inline';
    loadingIndicator.style.display = 'none';
    pdfBtn.disabled = false;
  }
});
```

---

## Next Steps

After implementation:
1. ✅ Commit changes to feature branch `1-pdf-export`
2. ✅ Test on staging environment (if available)
3. ✅ Create pull request with description of changes
4. ✅ Request code review
5. ✅ Deploy to production after approval

---

## Support Resources

- **html2pdf.js docs**: https://ekoopmans.github.io/html2pdf.js/
- **Canvas API docs**: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- **Blob API docs**: https://developer.mozilla.org/en-US/docs/Web/API/Blob
- **Feature spec**: See `specs/1-pdf-export/spec.md`
- **Research**: See `specs/1-pdf-export/plan/research.md`

---

## Estimated Timeline

| Task | Time | Cumulative |
|------|------|------------|
| Add library CDN | 5 min | 5 min |
| Add button HTML | 10 min | 15 min |
| Add PDF service | 30 min | 45 min |
| Add event handler | 15 min | 60 min |
| Add mobile CSS | 10 min | 70 min |
| Basic testing | 20 min | 90 min |
| Cross-browser testing | 30 min | 120 min |
| Performance validation | 15 min | 135 min |
| Accessibility check | 10 min | 145 min |
| Code review | 15 min | 160 min |

**Total**: ~2.5-3 hours for experienced developer

**First-time implementation**: Add 1-2 hours for learning curve

---

## Success Criteria

✅ PDF button appears in toolbar  
✅ Clicking button generates and downloads PDF  
✅ PDF visual quality matches editor rendering  
✅ Generation completes in <5s for typical documents  
✅ Works on Chrome, Firefox, Safari, Edge  
✅ Works on mobile (iOS/Android)  
✅ Error handling graceful (no crashes)  
✅ Loading indicator provides feedback  
✅ No console errors in production  

**Implementation complete when all criteria met!**
