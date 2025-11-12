# Implementation Plan: PDF Export

**Feature ID**: 1-pdf-export  
**Created**: 2025-11-12  
**Status**: Planning

## Technical Context

### Current Architecture
- **Type**: Single-page application (SPA)
- **Structure**: Single HTML file with embedded CSS and JavaScript
- **Dependencies**: 
  - markdown-it v13.0.1 (MD to HTML conversion)
  - turndown v7.1.2 (HTML to MD conversion)
  - Firebase Analytics v10.7.1
- **Storage**: localStorage for content persistence
- **Pattern**: Event-driven, client-side only (no backend)
- **Browser APIs**: Blob API, URL.createObjectURL for file downloads

### Technology Stack
- Pure JavaScript (ES6+)
- HTML5/CSS3
- CDN-loaded libraries
- No build process or bundler

### Integration Points
- Toolbar button system (existing export buttons pattern)
- Editor content (contenteditable div with HTML content)
- localStorage for auto-save
- File download mechanism (shared with MD/HTML export)

### Technical Unknowns (NEEDS CLARIFICATION)
1. **PDF Library Selection**: Which client-side PDF library best fits requirements?
   - Options: jsPDF, pdfmake, html2pdf.js
   - Criteria: size, image support, HTML rendering quality, browser compatibility
2. **Image Processing**: How to compress/optimize images to 1MB limit?
   - Canvas API for compression? Third-party library?
3. **Font Embedding**: How to ensure consistent font rendering across PDF viewers?
   - Web fonts vs embedded fonts
4. **Performance Optimization**: How to handle large documents without blocking UI?
   - Web Workers? Progressive generation?
5. **HTML-to-PDF Fidelity**: Which library provides best visual match to editor rendering?

### Constitution Check

**Privacy-First Principle** ✅
- All PDF generation happens client-side
- No data sent to external servers
- Consistent with existing architecture

**Simplicity Principle** ✅
- Single button addition to existing toolbar
- Follows established export pattern
- No complex configuration UI

**No-Backend Principle** ✅
- Entirely browser-based
- CDN-loaded library only
- No server-side processing

**Accessibility** ⚠️
- PDF button should have proper ARIA labels
- Keyboard shortcut consideration (e.g., Ctrl+P conflict with print?)
- Loading state must be announced to screen readers

**Mobile-First** ✅
- PDF generation works on mobile browsers
- Button responsive design (follows existing pattern)
- Touch-friendly interaction

### Post-Design Constitution Check
*To be completed after Phase 1*

## Phase 0: Research & Discovery

### Research Tasks

1. **PDF Library Evaluation**
   - Compare jsPDF, pdfmake, html2pdf.js
   - Test image embedding capabilities
   - Measure bundle sizes
   - Verify browser compatibility
   - Test HTML rendering fidelity

2. **Image Optimization Research**
   - Canvas API compression techniques
   - Quality vs file size tradeoffs
   - Browser support for image processing
   - Performance implications

3. **Performance Patterns**
   - Async PDF generation approaches
   - Web Worker feasibility
   - Progress indication best practices
   - Memory management for large documents

4. **Font Handling**
   - Standard PDF fonts
   - Web font embedding in PDFs
   - Cross-platform font consistency

### Research Output
*See research.md for detailed findings*

## Phase 1: Design & Contracts

### Data Model

**PDF Export Configuration** (internal state, not persisted)
```typescript
interface PDFExportConfig {
  filename: string;              // Generated from timestamp
  pageSize: 'A4' | 'Letter';     // Default: A4
  orientation: 'portrait';       // Fixed for v1
  margins: {                     // In mm or pt
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  metadata: {
    title: string;               // Extracted from first H1 or default
    creator: string;             // "Marky Markdown Editor"
    creationDate: Date;
  };
}

interface ImageProcessingResult {
  success: boolean;
  originalSize: number;          // bytes
  compressedSize: number;        // bytes
  dataUrl: string;               // base64 encoded
  error?: string;
}

interface PDFGenerationResult {
  success: boolean;
  blob?: Blob;
  filename: string;
  fileSize: number;              // bytes
  pageCount?: number;
  error?: string;
  warnings?: string[];           // e.g., "Some images were compressed"
}
```

### API Contracts

Since this is a client-side only feature, there are no REST/GraphQL APIs. Instead, we define the internal JavaScript module interface:

**PDF Service Interface**
```javascript
// Module: pdfExportService.js

/**
 * Main export function
 * @param {HTMLElement} editorElement - The contenteditable div
 * @param {Object} options - Optional configuration overrides
 * @returns {Promise<PDFGenerationResult>}
 */
async function generatePDF(editorElement, options = {})

/**
 * Extract and optimize images from HTML content
 * @param {HTMLElement} element - Container with images
 * @returns {Promise<ImageProcessingResult[]>}
 */
async function processImages(element)

/**
 * Compress image to target size
 * @param {string} imageDataUrl - Original image data URL
 * @param {number} maxSizeBytes - Max file size (default 1MB)
 * @returns {Promise<ImageProcessingResult>}
 */
async function compressImage(imageDataUrl, maxSizeBytes = 1048576)

/**
 * Generate filename with timestamp
 * @param {HTMLElement} editorElement - To extract title
 * @returns {string} - Formatted filename
 */
function generateFilename(editorElement)

/**
 * Trigger browser download of PDF blob
 * @param {Blob} blob - PDF blob
 * @param {string} filename - Download filename
 */
function downloadPDF(blob, filename)
```

### Component Design

**UI Component: PDF Export Button**
```html
<button id="pdfBtn" 
        title="Export as PDF file" 
        aria-label="Export document as PDF"
        data-testid="pdf-export-btn">
  <svg><!-- PDF icon --></svg>
  <span class="btn-text">PDF</span>
  <span class="loading-indicator" style="display:none">⏳</span>
</button>
```

**Event Flow**
```
User Click → Button Handler → generatePDF() → processImages() 
→ compressImage() (per image) → PDF Library Render 
→ downloadPDF() → Browser Download
```

### File Structure

```
index.html
  ├─ <script> PDF Service Module (inline or CDN)
  ├─ <script> PDF Library (CDN: html2pdf.js or jsPDF)
  ├─ Button event handler
  └─ Integration with existing export pattern
```

## Phase 2: Implementation Checklist

### Prerequisites
- [ ] Research phase complete (research.md)
- [ ] PDF library selected and CDN URL identified
- [ ] Image compression approach validated

### Development Tasks

#### Task 1: PDF Library Integration
- [ ] Add PDF library script tag to HTML head
- [ ] Verify library loads successfully
- [ ] Test basic PDF generation with sample HTML
- [ ] Confirm browser compatibility (Chrome, Firefox, Safari, Edge)

#### Task 2: PDF Service Module
- [ ] Create inline PDF service module in `<script>` tag
- [ ] Implement `generatePDF()` function
- [ ] Implement `generateFilename()` with timestamp logic
- [ ] Implement `downloadPDF()` using Blob API
- [ ] Add error handling and try-catch blocks

#### Task 3: Image Processing
- [ ] Implement `processImages()` to find all img tags
- [ ] Implement `compressImage()` using Canvas API
- [ ] Test compression with various image sizes
- [ ] Handle edge cases (SVG, external URLs, broken images)
- [ ] Add fallback for images that fail to load

#### Task 4: UI Integration
- [ ] Add PDF button HTML to toolbar
- [ ] Create PDF icon SVG (or use existing icon library)
- [ ] Apply existing button styles
- [ ] Position button in toolbar (after Export HTML)
- [ ] Add responsive CSS for mobile

#### Task 5: Event Handling
- [ ] Create click event listener for PDF button
- [ ] Show loading state during generation
- [ ] Disable button during processing
- [ ] Handle success: trigger download + visual feedback
- [ ] Handle errors: show user-friendly alert

#### Task 6: Content Processing
- [ ] Extract HTML from editor element
- [ ] Preserve CSS styles (inline or stylesheet reference)
- [ ] Handle code blocks with proper formatting
- [ ] Test table rendering
- [ ] Test list rendering (ul/ol)
- [ ] Validate special characters and emoji

#### Task 7: Testing
- [ ] Test with empty document
- [ ] Test with text-only document (no images)
- [ ] Test with single image
- [ ] Test with multiple images (5+)
- [ ] Test with large document (20+ pages)
- [ ] Test on mobile (iOS Safari, Android Chrome)
- [ ] Test special characters (unicode, emoji)
- [ ] Test complex tables
- [ ] Performance test: measure generation time
- [ ] File size test: verify optimization

#### Task 8: Error Handling & Edge Cases
- [ ] Handle out-of-memory errors
- [ ] Handle image loading failures
- [ ] Handle PDF library initialization failures
- [ ] Add user-facing error messages
- [ ] Log errors to console for debugging
- [ ] Graceful degradation if feature unsupported

#### Task 9: Accessibility
- [ ] Add ARIA labels to button
- [ ] Ensure loading state is announced
- [ ] Test keyboard navigation
- [ ] Test with screen reader
- [ ] Add keyboard shortcut (optional)

#### Task 10: Documentation
- [ ] Update README with PDF export feature
- [ ] Add inline code comments
- [ ] Document browser requirements
- [ ] Add troubleshooting section for common issues

### Testing Criteria

**Functional Tests**
- PDF downloads successfully
- Filename includes timestamp
- File opens in PDF readers
- Text content matches editor
- Formatting preserved (headings, bold, italic, lists)
- Images embedded correctly
- Tables render properly
- Links are clickable (if supported by library)

**Performance Tests**
- Generation completes in <5s for 10-page document
- Generation completes in <10s for 50-page document
- Memory usage acceptable (no browser crashes)
- UI remains responsive (loading indicator works)

**Cross-Browser Tests**
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile Safari (iOS 15+)
- Mobile Chrome (Android 10+)

**Edge Case Tests**
- Empty document handling
- Very large documents (100+ pages)
- Documents with 10+ images
- Images >1MB (compression verification)
- Special characters and emoji
- External images (broken URLs)
- Complex nested lists
- Wide tables (pagination handling)

### Deployment Tasks
- [ ] Test on staging/preview (if applicable)
- [ ] Verify Firebase hosting compatibility
- [ ] Update version/changelog
- [ ] Commit to feature branch
- [ ] Create pull request
- [ ] Merge to main after review
- [ ] Deploy to production

## Phase 3: Post-Implementation

### Monitoring
- User adoption rate (if analytics available)
- Error rate tracking
- Performance metrics (if telemetry exists)

### Future Improvements
- Custom PDF styling options
- Page numbers and headers/footers
- Table of contents generation
- Direct print functionality
- PDF/A archival format support

## Risks & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| PDF library too large (>500KB) | Slow page load | Medium | Choose lightweight library, lazy load if possible |
| Image compression quality poor | User dissatisfaction | Low | Test with various quality settings, make configurable |
| Browser memory limits | Feature fails on mobile | Medium | Implement chunked processing, add size warnings |
| HTML-to-PDF fidelity issues | Visual discrepancies | High | Extensive testing, document known limitations |
| External image loading fails | Incomplete PDFs | Medium | Timeout handling, skip failed images with warning |
| Performance on large docs | Poor UX | Medium | Progress indicator, Web Worker consideration |

## Dependencies & Prerequisites

**External Libraries** (to be decided in Phase 0)
- Primary candidate: html2pdf.js (bundle: ~500KB, good HTML support)
- Alternative: jsPDF + html2canvas (more control, larger bundle)
- Alternative: pdfmake (smaller, less HTML support)

**Browser APIs Required**
- Canvas API (for image compression)
- Blob API (for file creation)
- URL.createObjectURL (for download trigger)
- FileReader API (if needed for image processing)

**No Breaking Changes**
- Feature is purely additive
- No changes to existing functionality
- No data migration required
- Backward compatible

## Success Metrics

- [ ] PDF export button visible and functional
- [ ] 95%+ visual fidelity to editor rendering
- [ ] Generation time <5s for typical docs
- [ ] File size <5MB for text-heavy docs
- [ ] Works on 4+ major browsers
- [ ] Mobile functionality verified
- [ ] Zero data sent to external servers
- [ ] No user-reported critical bugs in first week

---

**Next Steps**: Complete Phase 0 research to resolve all technical unknowns before proceeding to implementation.
