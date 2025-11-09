# Marky Offline Capability Implementation Plan

**Project:** Marky Markdown Editor  
**Goal:** Make the app fully functional offline with external dependency caching and automatic updates  
**Date:** 2025-11-09

---

## 1. Current State Analysis

### External Dependencies (CDN)
- `markdown-it@13.0.1` - Markdown parser (from jsdelivr CDN)
- `turndown@7.1.2` - HTML to Markdown converter (from jsdelivr CDN)
- Firebase Analytics SDK (from gstatic.com)

### Current Offline Capabilities
✅ Local storage for document auto-save  
✅ PWA manifest.json configured  
❌ No Service Worker implementation  
❌ External dependencies not cached  
❌ No update mechanism for new versions  

---

## 2. Implementation Strategy

### Phase 1: Download & Host External Dependencies Locally

#### Actions:
1. **Download dependencies to local `/lib` directory:**
   - `markdown-it.min.js` (v13.0.1)
   - `turndown.min.js` (v7.1.2)

2. **Update `index.html` script references:**
   ```html
   <!-- Replace CDN links -->
   <script src="/lib/markdown-it.min.js"></script>
   <script src="/lib/turndown.min.js"></script>
   ```

3. **Keep Firebase Analytics as optional:**
   - Wrap in try/catch to fail gracefully offline
   - Analytics enhancement, not critical functionality

#### Benefits:
- Eliminates external CDN dependency
- Faster load times (no external requests)
- Guaranteed version consistency
- Full offline functionality

---

### Phase 2: Implement Service Worker

#### Service Worker Strategy: Cache-First with Network Fallback

**File:** `/service-worker.js`

#### Key Features:

1. **Cache Name Versioning:**
   ```javascript
   const CACHE_VERSION = 'v1.0.0';
   const CACHE_NAME = `marky-cache-${CACHE_VERSION}`;
   ```

2. **Assets to Cache (Install Event):**
   - `/index.html`
   - `/favicon.svg`
   - `/favicon-32x32.png`
   - `/favicon-192x192.png`
   - `/favicon-512x512.png`
   - `/manifest.json`
   - `/lib/markdown-it.min.js`
   - `/lib/turndown.min.js`

3. **Cache Strategy (Fetch Event):**
   - **Cache-first** for static assets (HTML, JS, CSS, images)
   - **Network-first** for Firebase Analytics (optional, fail gracefully)
   - Fallback to cache if network unavailable

4. **Update Mechanism (Activate Event):**
   ```javascript
   // Delete old caches when new version activates
   caches.keys().then(names => {
     return Promise.all(
       names.filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))
     );
   });
   ```

5. **Force Update on New Version:**
   - Use `skipWaiting()` to activate new SW immediately
   - Use `clients.claim()` to take control of all pages
   - Implement update notification to user

---

### Phase 3: Service Worker Registration

#### Update `index.html`:

Add before closing `</body>` tag:

```html
<script>
  // Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('SW registered:', registration);
          
          // Check for updates every hour
          setInterval(() => {
            registration.update();
          }, 3600000);
          
          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                showUpdateNotification();
              }
            });
          });
        })
        .catch(err => console.log('SW registration failed:', err));
    });
    
    // Reload page when new SW takes control
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }
  
  function showUpdateNotification() {
    if (confirm('A new version of Marky is available! Click OK to update.')) {
      // Tell SW to skip waiting and activate
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
  }
</script>
```

---

### Phase 4: Service Worker Implementation Details

#### Complete Service Worker Code Structure:

```javascript
// service-worker.js
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `marky-cache-${CACHE_VERSION}`;

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/favicon-32x32.png',
  '/favicon-192x192.png',
  '/favicon-512x512.png',
  '/manifest.json',
  '/lib/markdown-it.min.js',
  '/lib/turndown.min.js'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip Firebase Analytics and external requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) {
          return cached;
        }
        
        return fetch(event.request)
          .then(response => {
            // Cache new responses
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseClone));
            }
            return response;
          });
      })
  );
});

// Listen for skip waiting message
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```

---

## 3. Version Update Mechanism

### Automatic Version Detection:

1. **Update `CACHE_VERSION` in service-worker.js** when deploying new version
2. Service worker detects version mismatch on install
3. Old cache is deleted during activation
4. User is notified of update availability
5. User confirms and page reloads with new version

### Version Naming Convention:
- Format: `v{major}.{minor}.{patch}`
- Example: `v1.0.0`, `v1.0.1`, `v1.1.0`, `v2.0.0`
- Change on each deployment

### Update Flow:
```
New deployment → SW detects new version → 
SW installs in background → User notified → 
User accepts → SW activates → Old cache deleted → 
Page reloads → New version active
```

---

## 4. Testing Strategy

### Offline Testing:
1. Open app in browser
2. Open DevTools → Application → Service Workers
3. Check "Offline" checkbox
4. Reload page - should work fully offline
5. Verify all features work (edit, save, export, etc.)

### Update Testing:
1. Deploy with `CACHE_VERSION = 'v1.0.0'`
2. Load app and verify caching
3. Update version to `'v1.0.1'`
4. Deploy new version
5. Reload page - should show update notification
6. Accept update - should reload with new version
7. Verify old cache is deleted

### Cache Inspection:
- DevTools → Application → Cache Storage
- Verify correct assets cached
- Check cache name matches version

---

## 5. Implementation Checklist

### Step 1: Local Dependencies
- [ ] Create `/lib` directory
- [ ] Download `markdown-it.min.js` (13.0.1)
- [ ] Download `turndown.min.js` (7.1.2)
- [ ] Update `index.html` script tags
- [ ] Test app still works

### Step 2: Service Worker File
- [ ] Create `/service-worker.js`
- [ ] Implement install, activate, fetch events
- [ ] Add version constant
- [ ] Add assets array
- [ ] Add message listener for skip waiting

### Step 3: Registration
- [ ] Add SW registration script to `index.html`
- [ ] Add update notification logic
- [ ] Add controller change listener
- [ ] Test registration works

### Step 4: Testing
- [ ] Test offline functionality
- [ ] Test update mechanism
- [ ] Test cache versioning
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)

### Step 5: Deployment
- [ ] Update `CACHE_VERSION` to `v1.0.0`
- [ ] Commit all changes
- [ ] Deploy to Firebase
- [ ] Verify on production
- [ ] Test offline on production URL

---

## 6. Maintenance & Updates

### When Deploying New Versions:

1. **Update version number:**
   ```javascript
   const CACHE_VERSION = 'v1.0.1'; // Increment
   ```

2. **Update assets list if needed:**
   - Add new files to `ASSETS_TO_CACHE`
   - Remove deleted files

3. **Deploy to Firebase**

4. **Users automatically notified** on next visit

### Monitoring:
- Check Firebase Analytics for SW installation rate
- Monitor console errors related to caching
- Track update acceptance rate

---

## 7. Browser Compatibility

### Supported Browsers:
- ✅ Chrome 40+ (Service Worker support)
- ✅ Firefox 44+
- ✅ Safari 11.1+
- ✅ Edge 17+
- ✅ Opera 27+

### Graceful Degradation:
- Service Worker detection: `if ('serviceWorker' in navigator)`
- App works without SW (online only)
- Progressive enhancement approach

---

## 8. Performance Benefits

### Before (Current):
- 2 external CDN requests
- Network-dependent functionality
- No offline capability
- Slower cold start

### After (With Offline):
- 0 external dependencies for core functionality
- Full offline capability
- Instant load from cache
- Faster repeat visits
- Automatic background updates

---

## 9. Security Considerations

1. **HTTPS Required:**
   - Service Workers only work on HTTPS (Firebase provides this)
   - localhost also works for development

2. **Cache Poisoning Prevention:**
   - Cache versioning prevents stale code
   - Automatic cleanup of old caches

3. **Origin Restrictions:**
   - Service Worker scoped to same origin
   - External requests skipped in fetch handler

---

## 10. Future Enhancements

### Potential Improvements:
- Background sync for exports
- Push notifications for updates
- Offline analytics queue
- Dynamic caching of user-uploaded images
- Cache size management (quota API)
- Precache warming strategies

---

## Estimated Implementation Time

- **Phase 1 (Local Dependencies):** 30 minutes
- **Phase 2 (Service Worker):** 1-2 hours
- **Phase 3 (Registration):** 30 minutes
- **Phase 4 (Testing):** 1 hour
- **Total:** ~3-4 hours

---

## Success Criteria

✅ App loads and functions fully offline  
✅ No external CDN dependencies for core features  
✅ Automatic update detection and notification  
✅ Smooth version transitions  
✅ Cache cleanup on updates  
✅ Works on all major browsers  
✅ No performance degradation  
✅ Lighthouse PWA score: 90+  

---

## Resources & Documentation

- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)
- [Workbox (Optional Framework)](https://developers.google.com/web/tools/workbox)

---

**End of Plan**
