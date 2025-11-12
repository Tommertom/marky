# Implementation Tasks: PDF Export Feature

**Feature ID**: 1-pdf-export  
**Created**: 2025-11-12  
**Status**: Ready for Implementation  
**Estimated Time**: 2-4 hours

## Overview

This document provides a complete, step-by-step task breakdown for implementing the PDF export feature in Marky Markdown Editor. Tasks are organized by implementation phase and user story to enable independent development and testing.

### Implementation Strategy

- **MVP First**: User Story 1 (basic PDF export) provides immediate value
- **Incremental Delivery**: Each story is independently testable and deployable
- **Parallel Opportunities**: Tasks marked with [P] can be executed in parallel with other [P] tasks
- **Single File Architecture**: All code changes happen in `index.html` (matches Marky's design)

### User Stories (from spec.md)

- **US1 (P1)**: Basic PDF Export - User clicks button, PDF downloads with proper formatting
- **US2 (P2)**: Image Optimization - Images automatically compressed to 1MB max per image
- **US3 (P3)**: Enhanced UX - Loading indicators, success feedback, error handling

---

## Phase 1: Setup & Prerequisites

**Goal**: Prepare development environment and add external dependencies

### Setup Tasks

- [ ] T001 Verify html2pdf.js library documentation and CDN availability at https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/
- [ ] T002 Create feature branch `1-pdf-export` from main (if not already on it)
- [ ] T003 Add html2pdf.js CDN script tag in index.html before closing `</body>` tag

**Acceptance Criteria**:
- html2pdf.js library loads successfully
- Browser console shows `html2pdf` function is defined
- No console errors on page load

---

## Phase 2: Foundational Tasks

**Goal**: Set up core infrastructure needed by all user stories

### Infrastructure Tasks

- [ ] T004 [P] Add PDF button HTML to toolbar in index.html after "Export HTML" button
- [ ] T005 [P] Add PDF icon SVG markup to button element in index.html
- [ ] T006 [P] Add loading indicator span element to PDF button in index.html
- [ ] T007 Add CSS styles for PDF button hover/active/disabled states in index.html `<style>` block
- [ ] T008 Add CSS styles for loading indicator animation in index.html `<style>` block

**Acceptance Criteria**:
- PDF button visible in toolbar
- Button follows same visual style as other toolbar buttons
- Button is responsive on mobile devices
- Loading indicator hidden by default

---

## Phase 3: User Story 1 - Basic PDF Export (P1)

**Story Goal**: User can click PDF button and download a properly formatted PDF of their markdown content

**Independent Test Criteria**:
- [ ] User clicks PDF button → Browser download dialog appears
- [ ] Downloaded PDF opens in PDF viewer without errors
- [ ] PDF contains all visible text content from editor
- [ ] Basic formatting preserved: headings, bold, italic, lists, code blocks
- [ ] PDF filename format: `marky-TIMESTAMP.pdf` or `TITLE-TIMESTAMP.pdf`

### US1 Implementation Tasks

- [ ] T009 [US1] Implement `generatePDFFilename()` function in index.html script block
- [ ] T010 [US1] Implement `generatePDF()` function with basic html2pdf.js configuration in index.html script block
- [ ] T011 [US1] Add PDF export button click event handler in index.html script block
- [ ] T012 [US1] Configure html2pdf.js options: A4 format, portrait orientation, 10mm margins in index.html script block
- [ ] T013 [US1] Implement error handling for missing html2pdf library in index.html script block
- [ ] T014 [US1] Add basic console logging for PDF generation success/failure in index.html script block

**Acceptance Criteria**:
- Clicking PDF button generates and downloads PDF
- PDF renders markdown content with correct formatting
- Filename includes timestamp
- If first H1 exists, filename uses sanitized H1 text as prefix
- Console logs confirm generation success

**Test Scenarios**:
1. Empty document → minimal PDF generated
2. Document with headings, lists, bold, italic → all formatting preserved
3. Document with first H1 "My Document" → filename: `my-document-TIMESTAMP.pdf`
4. Document without H1 → filename: `marky-TIMESTAMP.pdf`
5. Very long document (50+ pages) → PDF generates without errors

---

## Phase 4: User Story 2 - Image Optimization (P2)

**Story Goal**: Images in markdown content are automatically optimized and embedded in PDF without exceeding 1MB per image

**Independent Test Criteria**:
- [ ] Document with images → PDF contains all images
- [ ] Large image (>1MB) → compressed to ≤1MB in PDF
- [ ] Image quality remains acceptable after compression
- [ ] PDF generation completes within 10 seconds for 5-10 images
- [ ] External images load and embed correctly

### US2 Implementation Tasks

- [ ] T015 [US2] Implement `compressImage()` function using Canvas API in index.html script block
- [ ] T016 [US2] Implement iterative quality reduction algorithm (start 0.95, step -0.05) in index.html script block
- [ ] T017 [US2] Implement `processImages()` function to find and compress all images in index.html script block
- [ ] T018 [US2] Add image processing call before PDF generation in `generatePDF()` function in index.html script block
- [ ] T019 [US2] Configure html2canvas options: useCORS=true for external images in index.html script block
- [ ] T020 [US2] Add warnings array to PDFGenerationResult for compressed images in index.html script block

**Acceptance Criteria**:
- Images >1MB are compressed to ≤1MB
- Compression uses iterative quality reduction
- Original images <1MB are not recompressed
- External images (http/https URLs) load correctly via CORS
- Function returns metadata: originalSize, compressedSize, quality used

**Test Scenarios**:
1. Document with 3MB image → compressed to ≤1MB, quality ≥0.1
2. Document with 5 small images (<200KB each) → no compression applied
3. Document with mix of local data URLs and external URLs → all embed correctly
4. Image compression fails → warning added to result, PDF still generates
5. Canvas API not supported → graceful fallback (skip compression)

---

## Phase 5: User Story 3 - Enhanced UX (P3)

**Story Goal**: User receives clear feedback during PDF generation with loading states and success/error messages

**Independent Test Criteria**:
- [ ] PDF button disabled during generation
- [ ] Loading indicator visible while processing
- [ ] Success checkmark displayed for 2 seconds after completion
- [ ] Error alert shown if generation fails
- [ ] Button returns to normal state after success/failure

### US3 Implementation Tasks

- [ ] T021 [US3] Add button state management (disabled/enabled) in PDF button click handler in index.html script block
- [ ] T022 [US3] Show loading indicator (⏳) and hide button text during generation in index.html script block
- [ ] T023 [US3] Show success indicator (✓) for 2 seconds after successful generation in index.html script block
- [ ] T024 [US3] Implement error message display with user-friendly messages in index.html script block
- [ ] T025 [US3] Add specific error detection: canvas size exceeded, image loading failed in index.html script block
- [ ] T026 [US3] Add setTimeout to reset button state after success feedback in index.html script block

**Acceptance Criteria**:
- Button shows "⏳" during PDF generation
- Button text hidden while loading indicator visible
- Success shows "✓" for exactly 2 seconds
- Error shows alert with user-friendly message
- Button returns to idle state after 2-second success delay
- Button cannot be clicked multiple times during generation

**Test Scenarios**:
1. Normal PDF generation → shows ⏳, then ✓, then returns to normal
2. Error during generation → shows ⏳, then alert, then returns to normal
3. User attempts double-click → second click ignored (button disabled)
4. Canvas size exceeded error → specific message: "Document too large"
5. Image load failure → specific message: "Some images failed to load"

---

## Phase 6: Polish & Cross-Cutting Concerns

**Goal**: Final quality improvements and comprehensive testing

### Polish Tasks

- [ ] T027 [P] Add keyboard shortcut Ctrl+Shift+P (Cmd+Shift+P on Mac) for PDF export in index.html script block
- [ ] T028 [P] Add ARIA labels for accessibility: `aria-label="Export document as PDF"` to button in index.html
- [ ] T029 [P] Add tooltip to PDF button: `title="Export as PDF file"` in index.html
- [ ] T030 Test PDF generation on Chrome (latest)
- [ ] T031 Test PDF generation on Firefox (latest)
- [ ] T032 Test PDF generation on Safari (latest)
- [ ] T033 Test PDF generation on Edge (latest)
- [ ] T034 Test PDF generation on mobile Chrome (Android/iOS)
- [ ] T035 Test PDF generation on mobile Safari (iOS)
- [ ] T036 Verify PDF opens correctly in Adobe Acrobat Reader
- [ ] T037 Verify PDF opens correctly in browser built-in PDF viewers
- [ ] T038 Test with empty document (edge case)
- [ ] T039 Test with very long document (100+ pages)
- [ ] T040 Test with document containing special unicode characters/emoji
- [ ] T041 Test with document containing complex tables
- [ ] T042 Measure and verify PDF generation time <5s for typical documents
- [ ] T043 Verify no console errors or warnings during PDF generation
- [ ] T044 Update README.md with PDF export feature documentation

**Acceptance Criteria**:
- PDF exports work on all tested browsers
- PDFs render correctly in all tested PDF viewers
- All edge cases handled gracefully
- Performance meets <5s target for typical documents
- No console errors/warnings
- README.md updated with feature description

---

## Dependencies & Execution Order

### Story Completion Order

```
Setup (Phase 1)
    ↓
Foundational (Phase 2)
    ↓
┌─────────────────────┐
│ US1 (Basic Export)  │ ← MVP - Ship first
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ US2 (Image Opt)     │ ← Independent
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ US3 (Enhanced UX)   │ ← Independent
└──────────┬──────────┘
           ↓
Polish (Phase 6)
```

### Critical Path

**Must Complete First** (blocking):
- T001-T003 (Setup)
- T004-T008 (Foundational)

**US1 Dependencies**:
- Requires: T001-T008 complete
- Blocks: US2, US3 (they enhance US1 functionality)

**US2 Dependencies**:
- Requires: US1 complete (extends `generatePDF()`)
- Can ship independently after US1

**US3 Dependencies**:
- Requires: US1 complete (enhances UI feedback)
- Can ship independently after US1

### Parallel Execution Opportunities

**Phase 2 - All foundational tasks can run in parallel**:
- T004, T005, T006 (HTML changes, different sections)
- T007, T008 (CSS changes, different rules)

**Phase 3 - US1 tasks must be sequential** (each builds on previous)

**Phase 4 - US2 tasks must be sequential** (image processing pipeline)

**Phase 5 - US3 tasks can be partially parallelized**:
- T021 + T022 (button state logic)
- T023 (success feedback) - independent
- T024 + T025 (error handling) - can work together
- T026 (reset timeout) - requires T023

**Phase 6 - High parallelization**:
- T027, T028, T029 (different enhancements)
- T030-T037 (all browser tests)
- T038-T042 (all edge case tests)

---

## Task Summary

**Total Tasks**: 44
- Setup: 3 tasks
- Foundational: 5 tasks
- US1 (Basic Export): 6 tasks
- US2 (Image Optimization): 6 tasks
- US3 (Enhanced UX): 6 tasks
- Polish: 18 tasks

**Parallelizable Tasks**: 26 tasks marked with [P]

**Estimated Timeline**:
- **MVP (US1)**: 1-2 hours (T001-T014)
- **Image Optimization (US2)**: 1 hour (T015-T020)
- **Enhanced UX (US3)**: 0.5 hours (T021-T026)
- **Polish & Testing**: 1-2 hours (T027-T044)
- **Total**: 2-4 hours

---

## Implementation Notes

### File Locations

All code changes happen in a single file:
- **index.html**: HTML structure, CSS styles, JavaScript code

### Code Organization

Add code in this order within `index.html`:

1. **HTML** (in `<body>` section):
   - PDF button after existing export buttons (line ~100-200 range)
   - html2pdf.js script tag before closing `</body>` (line ~1200)

2. **CSS** (in `<style>` block):
   - PDF button styles after existing button styles (line ~50-150 range)
   - Loading indicator animation after button styles

3. **JavaScript** (in `<script id="app-script">` block):
   - PDF service functions after existing export functions (line ~800-1000 range)
   - PDF button event handler after existing button handlers (line ~1100-1200 range)

### Testing Strategy

**After each user story**:
1. Manual testing: Click PDF button, verify download
2. Visual inspection: Open PDF, check formatting
3. Cross-browser: Test on Chrome, Firefox, Safari
4. Edge cases: Empty doc, long doc, special chars

**Final validation**:
- Complete test matrix (browsers × scenarios)
- Performance benchmarks
- Accessibility audit (keyboard nav, screen readers)

### Rollback Plan

If issues arise:
1. **US3 issues**: Remove T021-T026 changes (revert to US2)
2. **US2 issues**: Remove T015-T020 changes (revert to US1)
3. **US1 issues**: Remove PDF button and all JS (revert to main)

Git commits per user story enable clean rollbacks.

---

## Success Validation

**MVP Success (US1)**:
- [ ] User can export basic PDF with one click
- [ ] PDF contains properly formatted content
- [ ] Downloads with correct filename

**Full Feature Success (US1+US2+US3)**:
- [ ] Images compressed and embedded correctly
- [ ] Loading/success/error feedback works
- [ ] All acceptance criteria met
- [ ] All browsers tested and working
- [ ] Performance <5s for typical documents

**Production Ready**:
- [ ] All 44 tasks completed
- [ ] All test scenarios pass
- [ ] README.md updated
- [ ] No console errors
- [ ] Feature deployed to Firebase hosting
