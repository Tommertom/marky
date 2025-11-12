# Data Model: PDF Export Feature

**Feature ID**: 1-pdf-export  
**Created**: 2025-11-12  
**Status**: Design Complete

## Overview

The PDF export feature operates entirely client-side with ephemeral data structures. No persistent data storage is required beyond what already exists in the editor (localStorage for markdown content).

## Entities

Since this is a client-side only feature with no backend or persistent storage, there are no traditional database entities. Instead, we have **transient runtime objects** used during PDF generation.

### 1. PDFExportConfig

**Purpose**: Configuration object passed to html2pdf.js library

**Structure**:
```javascript
{
  margin: 10,                          // number (in mm)
  filename: string,                    // e.g., "marky-1699876543210.pdf"
  image: {
    type: 'jpeg',                      // 'jpeg' | 'png' | 'webp'
    quality: 0.95                      // number (0-1)
  },
  html2canvas: {
    scale: 2,                          // number (resolution multiplier)
    useCORS: true,                     // boolean
    logging: false,                    // boolean
    letterRendering: true              // boolean
  },
  jsPDF: {
    unit: 'mm',                        // 'mm' | 'cm' | 'in' | 'pt'
    format: 'a4',                      // 'a4' | 'letter' | [width, height]
    orientation: 'portrait'            // 'portrait' | 'landscape'
  },
  pagebreak: {
    mode: ['avoid-all', 'css'],        // string[]
    avoid: ['img', 'table', 'tr', 'code', 'pre']  // string[] (CSS selectors)
  }
}
```

**Lifecycle**: Created on-demand when user clicks PDF export button, discarded after generation completes

**Validation Rules**:
- `margin`: Must be >= 0
- `filename`: Must be non-empty string, should end in `.pdf`
- `image.quality`: Must be between 0 and 1
- `html2canvas.scale`: Should be 1-4 (higher values = better quality but slower/larger files)
- `jsPDF.format`: Must be valid paper size

**Default Values**: See structure above (these are the recommended defaults)

---

### 2. ImageProcessingResult

**Purpose**: Result object from image compression operation

**Structure**:
```javascript
{
  success: boolean,                   // true if compression succeeded
  originalSize: number,               // bytes (original image size)
  compressedSize: number,             // bytes (after compression)
  dataUrl: string,                    // base64-encoded image data URL
  quality: number,                    // final quality level used (0-1)
  error: string | undefined           // error message if failed
}
```

**Lifecycle**: Created during image processing, used to replace original image elements before PDF generation

**Validation Rules**:
- `originalSize`: Must be > 0
- `compressedSize`: Should be <= 1048576 (1MB target)
- `dataUrl`: Must be valid data URL format (`data:image/jpeg;base64,....`)
- `quality`: Must be between 0 and 1

**State Transitions**:
```
Initial → Processing → Success (dataUrl populated)
                    → Failure (error populated)
```

---

### 3. PDFGenerationResult

**Purpose**: Result object returned from PDF generation process

**Structure**:
```javascript
{
  success: boolean,                   // true if PDF generated successfully
  blob: Blob | undefined,             // PDF file blob (if successful)
  filename: string,                   // generated filename
  fileSize: number,                   // bytes (blob size)
  pageCount: number | undefined,      // number of pages (if available)
  error: string | undefined,          // error message if failed
  warnings: string[] | undefined      // non-fatal issues (e.g., images compressed)
}
```

**Lifecycle**: Created at end of PDF generation, used to trigger download or display errors

**Validation Rules**:
- If `success === true`: `blob` must be defined and `fileSize` > 0
- If `success === false`: `error` must be defined
- `filename`: Must be non-empty string ending in `.pdf`
- `fileSize`: Must be > 0 if successful

**State Transitions**:
```
Generating → Success (blob populated) → Downloaded → Discarded
          → Failure (error populated) → Displayed to User → Discarded
```

---

### 4. ButtonState

**Purpose**: UI state object for PDF export button

**Structure**:
```javascript
{
  disabled: boolean,                  // true when PDF is being generated
  loading: boolean,                   // true to show loading indicator
  text: string,                       // button text ("PDF" or "Generating...")
  iconVisible: boolean,               // show/hide PDF icon
  loadingIconVisible: boolean         // show/hide loading spinner
}
```

**Lifecycle**: Managed by UI event handler, updated during PDF generation lifecycle

**State Transitions**:
```
Idle → Loading → Success → Idle
             → Failure → Idle

States:
- Idle: { disabled: false, loading: false, text: "PDF", iconVisible: true, loadingIconVisible: false }
- Loading: { disabled: true, loading: true, text: "PDF", iconVisible: false, loadingIconVisible: true }
```

**DOM Mapping**:
- `disabled` → button.disabled attribute
- `loading` → button.classList ('loading' class)
- `text` → .btn-text innerText
- `iconVisible` → .pdf-icon style.display
- `loadingIconVisible` → .loading-indicator style.display

---

## Data Flow

```
User Click
    ↓
Generate PDFExportConfig (from defaults + timestamp)
    ↓
Set ButtonState to Loading
    ↓
Extract editor HTML content
    ↓
Process Images (parallel)
    ├─ For each <img> element:
    │   ├─ Create Canvas
    │   ├─ Draw image
    │   ├─ Compress to JPEG with quality iteration
    │   └─ Return ImageProcessingResult
    │
    └─ Replace original images with compressed dataUrls
    ↓
Call html2pdf library with PDFExportConfig
    ↓
html2pdf.js generates PDF (async)
    ├─ html2canvas renders HTML to canvas
    ├─ jsPDF creates PDF from canvas
    └─ Returns Blob
    ↓
Create PDFGenerationResult
    ├─ success: true, blob populated
    └─ or success: false, error populated
    ↓
If successful:
    ├─ Trigger browser download (URL.createObjectURL)
    ├─ Show success feedback (visual checkmark)
    └─ Set ButtonState to Idle
    ↓
If failed:
    ├─ Display error alert to user
    └─ Set ButtonState to Idle
    ↓
Cleanup (automatic garbage collection)
```

---

## Relationships

Since there are no persistent entities, relationships are temporal:

```
PDFExportConfig
    ↓ passed to
html2pdf.js library
    ↓ produces
PDFGenerationResult
    ├─ contains Blob → triggers download
    └─ updates ButtonState

ImageProcessingResult[] (one per image)
    ↓ modifies
Editor HTML content (in-memory copy)
    ↓ passed to
html2pdf.js library
```

---

## Storage Considerations

**No New Storage Required**:
- PDF generation uses existing editor content (already in DOM)
- Generated PDFs are not stored in localStorage
- Configuration is hardcoded (no user preferences to persist)
- All objects are transient (garbage collected after use)

**Existing Storage** (unchanged):
- `localStorage.markdownContent`: Editor content (HTML)
  - Used as source for PDF generation
  - Not modified by PDF export feature

---

## Memory Management

### Peak Memory Usage

**During PDF Generation**:
1. Original editor HTML content: ~10KB - 500KB (typical)
2. Canvas elements for images: Variable (depends on image count/size)
3. Compressed image dataUrls: ~1MB per image (target max)
4. html2canvas rendering: Temporary canvas (1-10MB for multi-page documents)
5. jsPDF object: ~1-5MB during generation
6. Final PDF blob: ~500KB - 10MB (typical output)

**Total Estimated**: 5-30MB peak memory (acceptable for modern browsers)

### Cleanup

- **Automatic**: JavaScript garbage collection handles cleanup after generation
- **Manual**: None required
- **Blob URLs**: Created by `URL.createObjectURL` must be revoked:
  ```javascript
  const url = URL.createObjectURL(blob);
  // ... trigger download ...
  URL.revokeObjectURL(url);  // Cleanup
  ```

---

## Validation & Constraints

### Input Validation

**Editor Content**:
- Must contain valid HTML (already validated by contenteditable)
- Can be empty (PDF will be nearly blank)
- No size limit enforced (browser canvas limits apply naturally)

**Images**:
- Must be valid image elements (`<img>` tags)
- `src` can be:
  - Data URLs (already embedded)
  - Relative URLs
  - Absolute URLs (subject to CORS)
- Invalid images are skipped with warning

### Output Constraints

**PDF File**:
- Maximum size: Limited by browser memory (typically 100MB+ safe)
- Maximum pages: Limited by canvas height limit (~32,767px in most browsers)
- Filename: Auto-generated, cannot be customized by user in v1.0

**Browser Limits**:
- Canvas max dimensions: ~32,767 x 32,767 px (varies by browser)
- Large documents (100+ pages) may hit this limit
- Handled gracefully with error message

---

## Error States

### Possible Errors

1. **Canvas too large**: Document exceeds browser canvas size limits
   - Error message: "Document too large. Try exporting smaller sections."
   
2. **Image loading failed**: External image URL unreachable or CORS blocked
   - Warning: "Some images failed to load. PDF may be incomplete."
   
3. **Out of memory**: Browser memory exhausted during generation
   - Error message: "PDF generation failed due to memory limits. Try a smaller document."
   
4. **Library not loaded**: html2pdf.js failed to load from CDN
   - Error message: "PDF library not available. Please refresh the page."
   
5. **Unknown error**: Any other exception during generation
   - Error message: "PDF generation failed. Please try again."

### Error Handling

All errors are caught and presented to user via:
- Browser alert dialog (simple, non-intrusive)
- Console error log (for debugging)
- Button returns to idle state (user can retry)

---

## Testing Data

### Test Cases

**Small Document**:
```
Content: 1-2 pages of text, no images
Expected: PDF <1MB, <2 seconds generation
```

**Medium Document**:
```
Content: 5-10 pages with mixed text, lists, code blocks, 2-3 images
Expected: PDF 2-5MB, 3-5 seconds generation
```

**Large Document**:
```
Content: 20-50 pages with tables, images, complex formatting
Expected: PDF 5-15MB, 8-15 seconds generation
```

**Image-Heavy Document**:
```
Content: 10+ images of varying sizes
Expected: Images compressed to ~1MB each, total PDF <20MB
```

**Edge Cases**:
```
Empty document → Nearly blank PDF
Only text → Smallest file size
External images → May fail CORS, skip with warning
100+ pages → May fail canvas limit
```

---

## Future Considerations

**Potential Data Extensions** (not in v1.0):
- **User Preferences**: Store PDF config in localStorage (page size, orientation, etc.)
- **Export History**: Track recently exported PDFs (metadata only, not files)
- **Custom Templates**: User-defined page layouts
- **Batch Export**: Array of PDFGenerationResults

None of these require database schema changes since everything is client-side localStorage.

---

## Summary

The PDF export feature introduces **no persistent data entities**. All data structures are transient runtime objects used during the generation process. The feature relies entirely on:

1. Existing editor content (HTML in contenteditable div)
2. Temporary in-memory objects (config, results, state)
3. Browser APIs (Canvas, Blob, URL)
4. External library (html2pdf.js)

This aligns perfectly with the application's client-side only architecture and privacy-first principle.
