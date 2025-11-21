# Testing Checklist

## ✅ Pre-Testing Verification

- [x] Build succeeds without errors
- [x] All TypeScript types are correct
- [x] All imports use `@/` alias correctly
- [x] Dev server starts successfully

## 🧪 Manual Testing Steps

### 1. Basic Navigation
- [ ] Open http://localhost:5173 (or your network IP for mobile)
- [ ] Verify Home page loads with voice recording button
- [ ] Click bottom navigation items:
  - [ ] Journal (Home) - should show recording interface
  - [ ] History (Calendar) - should show calendar view
  - [ ] Themes (Tags) - should show tag cloud
  - [ ] Profile - should show profile placeholder

### 2. Voice Recording Flow
- [ ] Click the large circular button on Home page
- [ ] Grant microphone permission if prompted
- [ ] Verify recording starts (button changes, timer appears)
- [ ] Record for a few seconds
- [ ] Click button again to stop
- [ ] Verify "Turning your words into a page..." message appears
- [ ] Wait for transcription to complete
- [ ] Verify navigation to Entry Detail page
- [ ] Verify entry data is displayed correctly

### 3. Entry Detail Page
- [ ] Verify entry title is displayed
- [ ] Verify entry date is formatted correctly
- [ ] Verify transcript text is displayed
- [ ] Verify tags are shown (if any)
- [ ] Click "Get an insight" button
- [ ] Verify insight loads and displays
- [ ] Click back arrow - should return to Home

### 4. Calendar View
- [ ] Navigate to Calendar (History tab)
- [ ] Verify current month is displayed
- [ ] Verify days with entries have indicator dots
- [ ] Click on a day with entries
- [ ] Verify entries for that day are listed
- [ ] Click on an entry - should navigate to Entry Detail
- [ ] Click "Week Reflection", "Month Reflection", or "Year Reflection"
- [ ] Verify insight overlay appears
- [ ] Use navigation arrows to change months
- [ ] Verify calendar updates correctly

### 5. Tag Cloud
- [ ] Navigate to Tags (Themes tab)
- [ ] Verify tags are displayed in cloud format
- [ ] Verify tags have different sizes based on weight
- [ ] Click on a tag (currently navigates to calendar - TODO: filter by tag)

### 6. Notes List View
- [ ] Navigate to Calendar
- [ ] Click List icon (top right)
- [ ] Verify Notes List View loads
- [ ] Verify entries are grouped by time period (Today, Yesterday, etc.)
- [ ] Test search functionality
- [ ] Click on an entry - should navigate to Entry Detail
- [ ] Click "Week", "Month", or "Year" insight buttons
- [ ] Verify insight panel appears

### 7. API Integration Verification
Open browser DevTools → Network tab and verify:

- [ ] `/healthz` is called before transcription
- [ ] `/transcribe` is called with FormData (audio file)
- [ ] `/entries` POST is called with transcript JSON
- [ ] `/entries/{id}` GET is called when viewing entry detail
- [ ] `/entries/calendar?month=YYYY-MM` is called in Calendar view
- [ ] `/tags-cloud` is called in Tag Cloud view
- [ ] `/entries?limit=50` is called in Notes List view
- [ ] `/insights/entry/{id}` is called when clicking "Get an insight"
- [ ] `/insights/period?timeframe=...` is called for period insights

**All API calls should use `config.apiBaseUrl` (check Network tab URLs)**

### 8. Error Handling
- [ ] Stop backend server
- [ ] Try to record - should show connection error
- [ ] Start backend server
- [ ] Try to record again - should work

### 9. Mobile Testing
- [ ] Access from mobile device on same network
- [ ] Use your computer's IP address (e.g., http://192.168.x.x:5173)
- [ ] Verify all functionality works on mobile
- [ ] Test touch interactions
- [ ] Verify bottom navigation is accessible

## 🐛 Known Issues / TODOs

1. **Profile Page** - Placeholder only (user management not implemented)
2. **NotesSplitView** - Placeholder only (split view not implemented)
3. **Tag Filtering** - Clicking tags doesn't filter entries yet
4. **Authentication** - Pages assume user is authenticated (JWT may be needed)

## 📝 Notes

- Voice recording logic is integrated from `VoiceRecordTest.tsx`
- All API calls use `config.apiBaseUrl` (no hardcoded URLs)
- Old components (`VoiceRecordTest.tsx`, etc.) are preserved for now
- Build succeeds with no TypeScript errors

## ✅ After Testing

Once everything is verified working:
- [ ] Remove old unused components (if desired)
- [ ] Update any TODOs based on testing results
- [ ] Document any issues found

