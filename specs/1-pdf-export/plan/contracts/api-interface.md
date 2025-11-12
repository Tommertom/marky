# API Contracts: PDF Export Feature

**Feature ID**: 1-pdf-export  
**Created**: 2025-11-12  
**Status**: Design Complete

## Overview

Since the PDF export feature is entirely client-side with no backend API, this document defines the **internal JavaScript module interface** rather than REST/GraphQL APIs. The contracts define the public functions that will be implemented for PDF generation.

## Module: PDF Export Service

### Module Interface

```javascript
/**
 * PDF Export Service Module
 * Client-side PDF generation for Marky Markdown Editor
 * 
 * Dependencies:
 * - html2pdf.js (loaded from CDN)
 * - Browser APIs: Canvas, Blob, URL
 */

const PDFExportService = {
  generatePDF,
  processImages,
  compressImage,
  generateFilename,
  downloadPDF,
  validateConfig
};
```

---

## Function Contracts

### 1. generatePDF

**Purpose**: Main entry point for PDF generation

**Signature**:
```javascript
/**
 * Generate and download PDF from editor content
 * 
 * @param {HTMLElement} editorElement - The contenteditable div containing markdown
 * @param {Object} [options={}] - Optional configuration overrides
 * @param {number} [options.margin] - PDF margin in mm (default: 10)
 * @param {string} [options.filename] - Custom filename (default: auto-generated)
 * @param {Object} [options.image] - Image options
 * @param {string} [options.image.type] - Image type: 'jpeg'|'png' (default: 'jpeg')
 * @param {number} [options.image.quality] - Quality 0-1 (default: 0.95)
 * @returns {Promise<PDFGenerationResult>} Result object with success status and blob
 * 
 * @throws {Error} If editorElement is null or not an HTMLElement
 * @throws {Error} If html2pdf library is not loaded
 * 
 * @example
 * const editor = document.getElementById('editor');
 * try {
 *   const result = await generatePDF(editor);
 *   if (result.success) {
 *     console.log('PDF generated:', result.filename, result.fileSize);
 *   }
 * } catch (error) {
 *   console.error('PDF generation failed:', error);
 * }
 */
async function generatePDF(editorElement, options = {})
```

**Input Validation**:
- `editorElement`: Must be non-null HTMLElement
- `options.margin`: If provided, must be >= 0
- `options.image.quality`: If provided, must be 0-1

**Return Value**:
```javascript
{
  success: boolean,
  blob?: Blob,                    // PDF blob (if success=true)
  filename: string,               // "marky-1699876543210.pdf"
  fileSize: number,               // bytes
  pageCount?: number,             // if available
  error?: string,                 // error message (if success=false)
  warnings?: string[]             // non-fatal issues
}
```

**Error Conditions**:
- `TypeError`: Invalid editorElement
- `ReferenceError`: html2pdf not loaded
- `Error`: Canvas size exceeded
- `Error`: Out of memory
- `Error`: Image loading failed (with warnings)

**Side Effects**:
- Triggers browser download dialog
- Temporarily disables PDF button
- Shows loading indicator
- Logs to console (if errors)

---

### 2. processImages

**Purpose**: Find and compress all images in HTML content

**Signature**:
```javascript
/**
 * Process and compress all images in HTML element
 * 
 * @param {HTMLElement} element - Container element with images
 * @param {number} [maxSizeBytes=1048576] - Max size per image (default: 1MB)
 * @returns {Promise<ImageProcessingResult[]>} Array of processing results
 * 
 * @example
 * const results = await processImages(editorElement);
 * const compressedCount = results.filter(r => r.success).length;
 * console.log(`Compressed ${compressedCount}/${results.length} images`);
 */
async function processImages(element, maxSizeBytes = 1048576)
```

**Input Validation**:
- `element`: Must be non-null HTMLElement
- `maxSizeBytes`: Must be > 0

**Return Value**:
```javascript
[
  {
    success: boolean,
    originalSize: number,         // bytes
    compressedSize: number,       // bytes
    dataUrl: string,              // "data:image/jpeg;base64,..."
    quality: number,              // 0-1
    error?: string
  },
  // ... one per image
]
```

**Processing Logic**:
1. Find all `<img>` elements in container
2. For each image:
   - If already data URL and < maxSize: skip
   - Else: compress via `compressImage()`
3. Replace image src with compressed dataUrl
4. Return array of results

**Error Handling**:
- Failed images are skipped (not thrown)
- Errors captured in individual result objects
- Overall operation succeeds even if some images fail

---

### 3. compressImage

**Purpose**: Compress single image to target size

**Signature**:
```javascript
/**
 * Compress image to target size using Canvas API
 * 
 * @param {string} imageDataUrl - Original image data URL or src
 * @param {number} [maxSizeBytes=1048576] - Target max size (default: 1MB)
 * @returns {Promise<ImageProcessingResult>} Compression result
 * 
 * @example
 * const img = document.querySelector('img');
 * const result = await compressImage(img.src, 500000); // 500KB max
 * if (result.success) {
 *   img.src = result.dataUrl;
 * }
 */
async function compressImage(imageDataUrl, maxSizeBytes = 1048576)
```

**Algorithm**:
```
1. Create new Image element
2. Load imageDataUrl into Image
3. Create Canvas with same dimensions
4. Draw Image to Canvas
5. Set initial quality = 0.95
6. Loop:
   a. Convert canvas to JPEG dataURL at current quality
   b. Calculate size: (dataUrl.length * 3) / 4
   c. If size <= maxSizeBytes: break
   d. Reduce quality by 0.05
   e. If quality < 0.1: break (minimum threshold)
7. Return result with final dataUrl and metrics
```

**Input Validation**:
- `imageDataUrl`: Must be non-empty string
- `maxSizeBytes`: Must be > 0

**Return Value**:
```javascript
{
  success: boolean,
  originalSize: number,
  compressedSize: number,
  dataUrl: string,
  quality: number,
  error?: string
}
```

**Quality Iteration**:
- Start: 0.95 (high quality)
- Step: -0.05 per iteration
- Minimum: 0.1 (prevent excessive degradation)
- Typical iterations: 3-8 depending on image

**Performance**:
- Small image (< 500KB): ~50-100ms
- Large image (> 2MB): ~200-500ms
- Very large (> 5MB): up to 1000ms

---

### 4. generateFilename

**Purpose**: Create timestamped filename for PDF export

**Signature**:
```javascript
/**
 * Generate PDF filename with timestamp
 * 
 * @param {HTMLElement} [editorElement] - Optional editor to extract title
 * @returns {string} Filename in format "marky-TIMESTAMP.pdf" or "TITLE-TIMESTAMP.pdf"
 * 
 * @example
 * generateFilename() 
 * // Returns: "marky-1699876543210.pdf"
 * 
 * generateFilename(editorWithH1)
 * // Returns: "my-document-1699876543210.pdf"
 */
function generateFilename(editorElement = null)
```

**Logic**:
```javascript
1. Get current timestamp: Date.now()
2. If editorElement provided:
   a. Find first <h1> element
   b. If found: extract text content
   c. Sanitize: lowercase, replace spaces with hyphens, remove special chars
   d. Use as prefix: "{sanitized-title}-{timestamp}.pdf"
3. Else: use default prefix "marky-{timestamp}.pdf"
4. Return filename
```

**Input Validation**:
- `editorElement`: Can be null or HTMLElement

**Return Value**:
- String in format: `{prefix}-{timestamp}.pdf`
- Example: `"marky-1699876543210.pdf"`
- Example with title: `"my-first-document-1699876543210.pdf"`

**Sanitization Rules**:
- Convert to lowercase
- Replace spaces with hyphens
- Remove characters not in [a-z0-9-]
- Limit length to 50 characters (before timestamp)
- If empty after sanitization: use "marky"

---

### 5. downloadPDF

**Purpose**: Trigger browser download of PDF blob

**Signature**:
```javascript
/**
 * Trigger browser download of PDF file
 * 
 * @param {Blob} blob - PDF blob to download
 * @param {string} filename - Desired filename
 * 
 * @throws {Error} If blob is null or not a Blob
 * @throws {Error} If filename is empty
 * 
 * @example
 * const blob = new Blob([pdfData], { type: 'application/pdf' });
 * downloadPDF(blob, 'my-document.pdf');
 */
function downloadPDF(blob, filename)
```

**Implementation**:
```javascript
1. Create object URL from blob: URL.createObjectURL(blob)
2. Create temporary <a> element
3. Set href to object URL
4. Set download attribute to filename
5. Append to document body
6. Programmatically click <a>
7. Remove <a> from document
8. Revoke object URL (cleanup)
```

**Input Validation**:
- `blob`: Must be instanceof Blob
- `filename`: Must be non-empty string

**Side Effects**:
- Triggers browser download dialog
- Creates and destroys temporary DOM element
- Creates and revokes object URL

**Browser Compatibility**:
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 13+)

---

### 6. validateConfig

**Purpose**: Validate PDF configuration object

**Signature**:
```javascript
/**
 * Validate PDF export configuration
 * 
 * @param {Object} config - Configuration object
 * @returns {{valid: boolean, errors: string[]}} Validation result
 * 
 * @example
 * const config = { margin: -1, image: { quality: 1.5 } };
 * const result = validateConfig(config);
 * // Returns: { valid: false, errors: ['margin must be >= 0', 'quality must be 0-1'] }
 */
function validateConfig(config)
```

**Validation Rules**:
- `margin`: Must be number >= 0
- `filename`: If provided, must be non-empty string
- `image.type`: Must be 'jpeg', 'png', or 'webp'
- `image.quality`: Must be number 0-1
- `html2canvas.scale`: Must be number 1-5
- `jsPDF.orientation`: Must be 'portrait' or 'landscape'
- `jsPDF.format`: Must be valid paper size string or [width, height]

**Return Value**:
```javascript
{
  valid: boolean,
  errors: string[]           // Empty if valid
}
```

**Example Errors**:
```javascript
[
  "margin must be >= 0",
  "image.quality must be between 0 and 1",
  "html2canvas.scale must be between 1 and 5",
  "filename cannot be empty"
]
```

---

## Event Contracts

### PDF Button Click Handler

**Event**: `click` on `#pdfBtn`

**Handler Signature**:
```javascript
/**
 * Handle PDF export button click
 * 
 * @param {Event} event - Click event
 * @returns {Promise<void>}
 */
async function handlePDFButtonClick(event)
```

**Flow**:
```
1. Prevent default behavior
2. Get editor element
3. Set button to loading state
4. Call generatePDF(editor)
5. If success:
   - Show success feedback (checkmark)
   - Restore button state after 2 seconds
6. If error:
   - Show error alert
   - Log to console
   - Restore button state immediately
```

**Button State Management**:
```javascript
// Loading state
button.disabled = true;
buttonText.style.display = 'none';
loadingIndicator.style.display = 'inline';

// Success state (temporary)
loadingIndicator.innerHTML = '✓';
setTimeout(() => restore(), 2000);

// Error state
button.disabled = false;
buttonText.style.display = 'inline';
loadingIndicator.style.display = 'none';
```

---

## Error Handling Contract

### Standard Error Format

All functions that can fail should throw/return errors in this format:

```javascript
{
  name: string,           // Error type: 'ValidationError', 'NetworkError', etc.
  message: string,        // User-friendly message
  code: string,           // Machine-readable code: 'PDF_TOO_LARGE', etc.
  details?: any          // Additional context for debugging
}
```

### Error Codes

| Code | Meaning | User Message |
|------|---------|--------------|
| `PDF_LIBRARY_MISSING` | html2pdf.js not loaded | "PDF library not available. Please refresh the page." |
| `PDF_TOO_LARGE` | Document exceeds canvas limits | "Document too large. Try exporting smaller sections." |
| `PDF_OUT_OF_MEMORY` | Browser memory exhausted | "PDF generation failed due to memory limits." |
| `IMAGE_LOAD_FAILED` | External image unreachable | "Some images failed to load. PDF may be incomplete." |
| `INVALID_CONFIG` | Configuration validation failed | "Invalid PDF configuration." |
| `UNKNOWN_ERROR` | Unexpected exception | "PDF generation failed. Please try again." |

---

## Performance Contracts

### Timing Guarantees

| Operation | Target | Maximum Acceptable |
|-----------|--------|-------------------|
| `generatePDF` (small doc, 1-3 pages) | <2s | 5s |
| `generatePDF` (medium doc, 5-10 pages) | <5s | 10s |
| `compressImage` (per image) | <200ms | 1s |
| `processImages` (5 images) | <1s | 3s |
| `generateFilename` | <1ms | 10ms |
| `downloadPDF` | <100ms | 500ms |

### Memory Limits

| Resource | Limit | Notes |
|----------|-------|-------|
| Peak memory during generation | ~30MB | For typical documents |
| Per-image compressed size | 1MB | Configurable target |
| Total PDF size | <20MB | For reasonable user experience |

---

## Integration Contract

### HTML2PDF Library Integration

**Required CDN**:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" 
        integrity="sha512-GsLlZN/3F2ErC5ifS5QtgpiJtWd43JWSuIgh7mbzZ8zBps+dvLusV+eNQATqgA/HdeKFVgA5v3S/cIrLF7QnIg==" 
        crossorigin="anonymous" 
        referrerpolicy="no-referrer"></script>
```

**Global Object**:
- Library exposes `window.html2pdf` function
- Must check for existence before use:
  ```javascript
  if (typeof html2pdf === 'undefined') {
    throw new Error('PDF library not loaded');
  }
  ```

**Usage Pattern**:
```javascript
const worker = html2pdf()
  .set(config)
  .from(element)
  .save();

// Or with promise:
await html2pdf().set(config).from(element).save();
```

---

## Testing Contracts

### Test Interface

Each function should have corresponding test suite:

```javascript
describe('PDFExportService', () => {
  describe('generatePDF', () => {
    it('should generate PDF from valid editor element');
    it('should throw error if editor element is null');
    it('should use default config if options not provided');
    it('should merge custom options with defaults');
    it('should handle empty document gracefully');
  });
  
  describe('compressImage', () => {
    it('should compress image to target size');
    it('should maintain quality above minimum threshold');
    it('should return original if already under target size');
    it('should handle invalid image URLs');
  });
  
  // ... etc
});
```

### Mock Data

Test fixtures should include:
- `mockEditorElement`: HTML element with sample content
- `mockImageDataUrl`: Base64-encoded test image
- `mockPDFBlob`: Fake PDF blob for download tests

---

## Summary

This contract defines:
- **6 public functions** with clear signatures and behavior
- **1 event handler** for button clicks
- **Standard error format** for consistency
- **Performance targets** for user experience
- **Integration requirements** with html2pdf.js library

All contracts are designed to support **testability**, **error handling**, and **user feedback** throughout the PDF generation lifecycle.
