# PDF Export Feature - Manual Test Plan

**Feature**: PDF Export for Marky Markdown Editor  
**Branch**: `1-pdf-export`  
**Test Date**: _To be filled by tester_  
**Tester**: _To be filled by tester_  

## Test Environment Setup

### Prerequisites
- Latest versions of browsers installed:
  - Chrome (Desktop)
  - Firefox (Desktop)
  - Safari (Desktop - macOS only)
  - Edge (Desktop)
  - Chrome Mobile (Android/iOS)
  - Safari Mobile (iOS)
- PDF viewers available:
  - Adobe Acrobat Reader
  - Browser built-in PDF viewers

### Test Data Preparation

Create the following test documents before testing:

1. **Empty Document**: Blank editor
2. **Standard Document**: Mix of H1, H2, paragraphs, bold, italic, lists
3. **Long Document**: 50+ pages of content (copy/paste multiple times)
4. **Unicode Document**: Document with emojis (👋, 🚀, ✨) and special characters (é, ñ, 中文)
5. **Table Document**: Document with complex markdown tables
6. **Image Document**: Document with 3-5 images of varying sizes

---

## Test Cases

### T030: Chrome (Latest) - Desktop

**Task**: Test PDF generation on Chrome (latest)

**Steps**:
1. Open `index.html` in Chrome
2. Load standard test document
3. Click PDF button
4. Verify loading indicator appears
5. Verify PDF downloads successfully
6. Open PDF in browser viewer

**Expected Results**:
- ✅ Loading indicator (⏳) appears during generation
- ✅ Success indicator (✓ Saved!) shows for 2 seconds
- ✅ PDF downloads to default folder
- ✅ PDF opens without errors
- ✅ All formatting preserved (headings, bold, italic, lists)
- ✅ Console shows success message (no errors)

**Actual Results**:  
_To be filled by tester_

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: 
_To be filled by tester_

---

### T031: Firefox (Latest) - Desktop

**Task**: Test PDF generation on Firefox (latest)

**Steps**:
1. Open `index.html` in Firefox
2. Load standard test document
3. Click PDF button
4. Verify loading indicator appears
5. Verify PDF downloads successfully
6. Open PDF in browser viewer

**Expected Results**:
- ✅ Loading indicator (⏳) appears during generation
- ✅ Success indicator (✓ Saved!) shows for 2 seconds
- ✅ PDF downloads to default folder
- ✅ PDF opens without errors
- ✅ All formatting preserved
- ✅ Console shows success message (no errors)

**Actual Results**:  
_To be filled by tester_

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: 
_To be filled by tester_

---

### T032: Safari (Latest) - Desktop (macOS)

**Task**: Test PDF generation on Safari (latest)

**Steps**:
1. Open `index.html` in Safari
2. Load standard test document
3. Click PDF button
4. Verify loading indicator appears
5. Verify PDF downloads successfully
6. Open PDF in browser viewer

**Expected Results**:
- ✅ Loading indicator appears during generation
- ✅ Success indicator shows for 2 seconds
- ✅ PDF downloads to default folder
- ✅ PDF opens without errors
- ✅ All formatting preserved
- ✅ Console shows success message (no errors)

**Actual Results**:  
_To be filled by tester_

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: 
_To be filled by tester_

---

### T033: Edge (Latest) - Desktop

**Task**: Test PDF generation on Edge (latest)

**Steps**:
1. Open `index.html` in Edge
2. Load standard test document
3. Click PDF button
4. Verify loading indicator appears
5. Verify PDF downloads successfully
6. Open PDF in browser viewer

**Expected Results**:
- ✅ Loading indicator appears during generation
- ✅ Success indicator shows for 2 seconds
- ✅ PDF downloads to default folder
- ✅ PDF opens without errors
- ✅ All formatting preserved
- ✅ Console shows success message (no errors)

**Actual Results**:  
_To be filled by tester_

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: 
_To be filled by tester_

---

### T034: Chrome Mobile (Android/iOS)

**Task**: Test PDF generation on mobile Chrome

**Steps**:
1. Open deployed app in Chrome Mobile
2. Load standard test document
3. Tap PDF button
4. Verify loading indicator appears
5. Verify PDF downloads/opens successfully

**Expected Results**:
- ✅ PDF button visible and tappable
- ✅ Loading indicator appears
- ✅ Success indicator shows for 2 seconds
- ✅ PDF downloads or opens in viewer
- ✅ All formatting preserved
- ✅ No console errors

**Actual Results**:  
_To be filled by tester_

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: 
_To be filled by tester_

---

### T035: Safari Mobile (iOS)

**Task**: Test PDF generation on mobile Safari

**Steps**:
1. Open deployed app in Safari Mobile
2. Load standard test document
3. Tap PDF button
4. Verify loading indicator appears
5. Verify PDF downloads/opens successfully

**Expected Results**:
- ✅ PDF button visible and tappable
- ✅ Loading indicator appears
- ✅ Success indicator shows for 2 seconds
- ✅ PDF downloads or opens in viewer
- ✅ All formatting preserved
- ✅ No console errors

**Actual Results**:  
_To be filled by tester_

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: 
_To be filled by tester_

---

### T036: Adobe Acrobat Reader Compatibility

**Task**: Verify PDF opens correctly in Adobe Acrobat Reader

**Steps**:
1. Generate PDF from standard test document
2. Open PDF in Adobe Acrobat Reader (Desktop)
3. Verify all content renders correctly
4. Check for any rendering warnings or errors

**Expected Results**:
- ✅ PDF opens without errors
- ✅ All text visible and readable
- ✅ Formatting preserved (headings, bold, italic)
- ✅ Lists render correctly
- ✅ No font substitution warnings
- ✅ Document structure intact

**Actual Results**:  
_To be filled by tester_

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: 
_To be filled by tester_

---

### T037: Browser Built-in PDF Viewers

**Task**: Verify PDF opens correctly in browser built-in PDF viewers

**Steps**:
1. Generate PDF from standard test document
2. Open PDF in Chrome's built-in viewer
3. Open PDF in Firefox's built-in viewer
4. Open PDF in Edge's built-in viewer
5. Verify all content renders correctly in each

**Expected Results**:
- ✅ PDF opens in all browser viewers
- ✅ All text visible and readable
- ✅ Formatting preserved in all viewers
- ✅ Lists render correctly
- ✅ No rendering issues

**Actual Results**:  
_To be filled by tester_

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: 
_To be filled by tester_

---

### T038: Empty Document Edge Case

**Task**: Test with empty document (edge case)

**Steps**:
1. Clear all content from editor (Click "Clear" button)
2. Click PDF button
3. Verify PDF generates

**Expected Results**:
- ✅ Loading indicator appears
- ✅ PDF downloads successfully
- ✅ PDF contains minimal content (empty or placeholder)
- ✅ No errors in console
- ✅ Success indicator shows

**Actual Results**:  
_To be filled by tester_

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: 
_To be filled by tester_

---

### T039: Very Long Document (100+ pages)

**Task**: Test with very long document (100+ pages)

**Steps**:
1. Create document with 100+ pages of content
   - Copy/paste standard content 50+ times
2. Click PDF button
3. Monitor generation time
4. Verify PDF generates successfully

**Expected Results**:
- ✅ Loading indicator appears
- ✅ PDF generates successfully (may take longer)
- ✅ Success indicator shows
- ✅ PDF contains all pages
- ✅ No console errors
- ✅ Browser doesn't freeze or crash

**Actual Results**:  
_To be filled by tester_

**Generation Time**: ___ seconds

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: 
_To be filled by tester_

---

### T040: Unicode Characters & Emoji

**Task**: Test with document containing special unicode characters/emoji

**Steps**:
1. Load unicode test document (emojis 👋🚀✨, special chars é, ñ, 中文)
2. Click PDF button
3. Open generated PDF
4. Verify all characters render correctly

**Expected Results**:
- ✅ PDF generates successfully
- ✅ All emojis visible in PDF
- ✅ Special characters (é, ñ) render correctly
- ✅ Unicode characters (中文) render correctly
- ✅ No character substitution or missing glyphs

**Actual Results**:  
_To be filled by tester_

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: 
_To be filled by tester_

---

### T041: Complex Tables

**Task**: Test with document containing complex tables

**Steps**:
1. Create document with markdown table:
   ```markdown
   | Header 1 | Header 2 | Header 3 |
   |----------|----------|----------|
   | Cell 1   | Cell 2   | Cell 3   |
   | Cell 4   | Cell 5   | Cell 6   |
   ```
2. Click PDF button
3. Open generated PDF
4. Verify table renders correctly

**Expected Results**:
- ✅ PDF generates successfully
- ✅ Table structure preserved
- ✅ Headers visible and styled
- ✅ Cell borders visible
- ✅ Text alignment correct
- ✅ Table fits on page properly

**Actual Results**:  
_To be filled by tester_

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: 
_To be filled by tester_

---

### T042: Performance - PDF Generation Time

**Task**: Measure and verify PDF generation time <5s for typical documents

**Steps**:
1. Load standard test document (2-3 pages)
2. Open browser console
3. Click PDF button
4. Note time from click to "PDF generated successfully" console message
5. Repeat 3 times and calculate average

**Expected Results**:
- ✅ Generation completes in <5 seconds (typical document)
- ✅ Consistent performance across multiple runs
- ✅ No lag or UI freeze during generation

**Actual Results**:  
Test 1: ___ seconds  
Test 2: ___ seconds  
Test 3: ___ seconds  
**Average**: ___ seconds

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: 
_To be filled by tester_

---

### T043: Console Errors & Warnings

**Task**: Verify no console errors or warnings during PDF generation

**Steps**:
1. Open browser console (F12)
2. Clear console
3. Click PDF button
4. Wait for PDF generation to complete
5. Review console for any errors or warnings

**Expected Results**:
- ✅ Console shows "[PDF] Starting PDF generation"
- ✅ Console shows "[PDF] Generating PDF with options: ..."
- ✅ Console shows "[PDF] PDF generated successfully: [filename]"
- ✅ No JavaScript errors
- ✅ No CORS warnings
- ✅ No resource loading failures
- ✅ No deprecation warnings

**Actual Results**:  
_To be filled by tester_

**Console Output**:
```
[Copy console output here]
```

**Pass/Fail**: ☐ Pass ☐ Fail

**Notes**: 
_To be filled by tester_

---

## Additional Test Cases

### Keyboard Shortcut Test

**Task**: Test Ctrl+Shift+P (Cmd+Shift+P on Mac) keyboard shortcut

**Steps**:
1. Load standard test document
2. Press Ctrl+Shift+P (Windows/Linux) or Cmd+Shift+P (Mac)
3. Verify PDF generation starts

**Expected Results**:
- ✅ PDF generation starts immediately
- ✅ Same behavior as clicking PDF button
- ✅ Loading indicator appears
- ✅ Success indicator shows

**Actual Results**:  
_To be filled by tester_

**Pass/Fail**: ☐ Pass ☐ Fail

---

### Button State Management Test

**Task**: Test button disabled state during generation

**Steps**:
1. Load standard test document
2. Click PDF button
3. While loading indicator is visible, try to click button again
4. Verify button is disabled

**Expected Results**:
- ✅ Button disabled during generation (gray background, not-allowed cursor)
- ✅ Second click has no effect
- ✅ Button re-enabled after 2-second success delay
- ✅ Can generate another PDF after re-enabled

**Actual Results**:  
_To be filled by tester_

**Pass/Fail**: ☐ Pass ☐ Fail

---

### Error Handling Test

**Task**: Test error handling when library fails to load

**Steps**:
1. Open browser DevTools → Network tab
2. Block requests to `cdnjs.cloudflare.com`
3. Reload page
4. Click PDF button
5. Verify error handling

**Expected Results**:
- ✅ Error message displayed: "PDF library not loaded. Please refresh the page."
- ✅ Button shows "✗ Failed" for 2 seconds
- ✅ Console shows error message
- ✅ Button returns to normal state after error

**Actual Results**:  
_To be filled by tester_

**Pass/Fail**: ☐ Pass ☐ Fail

---

### Image Compression Test

**Task**: Test automatic image compression for large images

**Steps**:
1. Insert large image (>1MB) into editor
2. Click PDF button
3. Check console for compression messages
4. Verify PDF size is reasonable

**Expected Results**:
- ✅ Console shows "[PDF] Image compressed: XXX KB → YYY KB (quality: Z.ZZ)"
- ✅ Images compressed to ≤1MB
- ✅ Image quality remains acceptable in PDF
- ✅ PDF file size is reasonable

**Actual Results**:  
_To be filled by tester_

**Pass/Fail**: ☐ Pass ☐ Fail

---

## Test Summary

**Total Test Cases**: 17  
**Passed**: ___  
**Failed**: ___  
**Blocked**: ___  

**Overall Status**: ☐ All tests passed ☐ Some tests failed ☐ Testing incomplete

**Critical Issues Found**:
_List any critical issues that must be fixed before release_

**Minor Issues Found**:
_List any minor issues that can be addressed post-release_

**Recommendations**:
_To be filled by tester_

**Sign-off**:
- Tester Name: _______________
- Date: _______________
- Approved for Release: ☐ Yes ☐ No (see issues above)
