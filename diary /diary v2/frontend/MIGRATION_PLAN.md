# Frontend Migration Plan: Replit → Current Frontend

## 1. Analysis Summary

### Current Frontend Structure (`frontend/`)
```
frontend/
├── src/
│   ├── App.tsx                    # Minimal: just renders VoiceRecordTest
│   ├── main.tsx                   # Standard React setup
│   ├── config.ts                  # ✅ API config with VITE_API_BASE_URL
│   ├── styles.css                 # Basic mobile-first styles
│   ├── types/
│   │   └── api.ts                 # ✅ TypeScript API types
│   └── components/
│       ├── VoiceRecordTest.tsx    # ✅ Working voice recording component
│       ├── CalendarView.tsx        # Basic calendar (unused?)
│       ├── EntryDetail.tsx        # Basic entry detail (unused?)
│       ├── EntryList.tsx          # Basic entry list (unused?)
│       ├── RecordButton.tsx       # Basic record button (unused?)
│       └── TagCloud.tsx            # Basic tag cloud (unused?)
├── package.json                   # React 18.3.1, Vite 7.1.12
├── vite.config.ts                 # ✅ Mobile-friendly (host: "0.0.0.0")
└── tsconfig.json                  # Standard TypeScript config
```

**Key Features:**
- ✅ Working voice recording (`VoiceRecordTest.tsx`)
- ✅ API configuration (`config.ts`)
- ✅ TypeScript types (`types/api.ts`)
- ✅ Mobile-first Vite config
- ❌ No routing
- ❌ No UI component library
- ❌ Minimal styling

### Replit Frontend Structure (`replit_frontend_raw/client/`)
```
replit_frontend_raw/
└── client/
    ├── src/
    │   ├── App.tsx                # ✅ Full routing with Wouter
    │   ├── main.tsx               # Standard React setup
    │   ├── index.css              # ✅ Tailwind CSS with custom theme
    │   ├── lib/
    │   │   ├── queryClient.ts     # React Query setup + API helpers
    │   │   └── utils.ts           # cn() utility (clsx + tailwind-merge)
    │   ├── hooks/
    │   │   ├── use-mobile.tsx     # Mobile detection hook
    │   │   └── use-toast.ts       # Toast notifications
    │   ├── components/
    │   │   ├── layout/
    │   │   │   └── MobileLayout.tsx  # ✅ Bottom nav + mobile container
    │   │   └── ui/                # ✅ 50+ shadcn/ui components
    │   └── pages/
    │       ├── Home.tsx           # ✅ Voice recording UI (beautiful!)
    │       ├── EntryDetail.tsx    # ✅ Entry detail page
    │       ├── Calendar.tsx       # ✅ Calendar view with reflections
    │       ├── TagCloud.tsx        # ✅ Tag cloud visualization
    │       ├── NotesListView.tsx   # ✅ Apple Notes-style list view
    │       ├── NotesSplitView.tsx  # ✅ Split view (needs checking)
    │       └── Profile.tsx        # Profile page
    ├── package.json               # React 19.2.0, Tailwind, Wouter, React Query
    └── vite.config.ts             # Tailwind + Replit plugins
```

**Key Features:**
- ✅ Beautiful mobile-first UI with animations (Framer Motion)
- ✅ Full routing (Wouter)
- ✅ React Query for data fetching
- ✅ Tailwind CSS with custom dreamy theme
- ✅ 50+ shadcn/ui components
- ✅ Mobile layout with bottom navigation
- ❌ **Hardcoded API URLs** (needs adaptation)
- ❌ Uses `queryKey.join("/")` for API calls (needs config integration)
- ❌ Mock data in pages (needs real API integration)

## 2. API Call Analysis

### Current Frontend API Pattern
```typescript
// frontend/src/config.ts
import { config } from "../config";
const API_URL = config.apiBaseUrl;
fetch(`${API_URL}/transcribe`, ...)
```

### Replit Frontend API Pattern
```typescript
// replit_frontend_raw/client/src/lib/queryClient.ts
export async function apiRequest(method: string, url: string, data?: unknown) {
  const res = await fetch(url, { ... });  // ❌ Hardcoded URL
}

// Used in React Query:
const res = await fetch(queryKey.join("/") as string, { ... });  // ❌ No base URL
```

**Issues to Fix:**
1. `queryClient.ts` uses raw URLs without base URL
2. `apiRequest()` function needs to prepend `config.apiBaseUrl`
3. All React Query calls need to use configured base URL

## 3. Migration Plan

### Phase 1: Setup Dependencies & Configuration

**Files to KEEP (don't change):**
- ✅ `frontend/package.json` - Keep current, but ADD new dependencies
- ✅ `frontend/vite.config.ts` - Keep mobile-friendly config, ADD Tailwind
- ✅ `frontend/tsconfig.json` - Keep current
- ✅ `frontend/src/config.ts` - **KEEP THIS** (our API config)

**Dependencies to ADD:**
```json
{
  "dependencies": {
    // Existing: react, react-dom
    "@tanstack/react-query": "^5.60.5",
    "wouter": "^3.3.5",
    "framer-motion": "^12.23.24",
    "lucide-react": "^0.545.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.3.1",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    // Existing: @vitejs/plugin-react, typescript
    "@tailwindcss/vite": "^4.1.14",
    "tailwindcss": "^4.1.14",
    "autoprefixer": "^10.4.21",
    "postcss": "^8.5.6"
  }
}
```

### Phase 2: Migrate Core Infrastructure

**Files to CREATE/UPDATE:**

1. **`frontend/src/lib/utils.ts`** (NEW)
   - Copy from Replit: `cn()` utility function
   - ✅ Keep as-is

2. **`frontend/src/lib/queryClient.ts`** (NEW - ADAPTED)
   - Copy from Replit BUT:
   - ✅ Import `config` from `../config`
   - ✅ Update `apiRequest()` to prepend `config.apiBaseUrl`
   - ✅ Update `getQueryFn()` to prepend `config.apiBaseUrl`
   - ✅ Keep React Query setup

3. **`frontend/src/index.css`** (REPLACE)
   - Copy from Replit: `client/src/index.css`
   - ✅ Full Tailwind setup with custom theme
   - ✅ Dreamy color palette

4. **`frontend/vite.config.ts`** (UPDATE)
   - ✅ Keep `host: "0.0.0.0"` for mobile
   - ✅ ADD Tailwind plugin
   - ✅ ADD path alias `@` → `src`
   - ❌ Don't copy Replit-specific plugins

5. **`frontend/src/main.tsx`** (UPDATE)
   - ✅ Keep current structure
   - ✅ Change import from `./styles.css` to `./index.css`

### Phase 3: Migrate UI Components

**Files to COPY:**

1. **`frontend/src/components/ui/`** (NEW DIRECTORY)
   - Copy ALL 50+ components from `replit_frontend_raw/client/src/components/ui/`
   - ✅ These are shadcn/ui components - no changes needed

2. **`frontend/src/components/layout/MobileLayout.tsx`** (NEW)
   - Copy from Replit: `client/src/components/layout/MobileLayout.tsx`
   - ✅ Keep as-is (uses Wouter routing)

3. **`frontend/src/hooks/`** (NEW DIRECTORY)
   - Copy `use-mobile.tsx` and `use-toast.ts` from Replit
   - ✅ Keep as-is

### Phase 4: Migrate Pages

**Files to CREATE/ADAPT:**

1. **`frontend/src/pages/Home.tsx`** (NEW - ADAPTED)
   - Copy from Replit: `client/src/pages/Home.tsx`
   - ✅ Keep beautiful UI
   - ❌ **REPLACE** mock navigation with real voice recording
   - ❌ **INTEGRATE** `VoiceRecordTest.tsx` logic OR create new recording component
   - ❌ **ADD** API call to `/transcribe` endpoint
   - ❌ **NAVIGATE** to entry detail after transcription

2. **`frontend/src/pages/EntryDetail.tsx`** (NEW - ADAPTED)
   - Copy from Replit: `client/src/pages/EntryDetail.tsx`
   - ✅ Keep beautiful UI
   - ❌ **REPLACE** mock data with real API call: `GET /entries/{id}`
   - ❌ **ADD** API call to `/insights/entry/{id}` for insights button
   - ❌ **USE** React Query for data fetching

3. **`frontend/src/pages/Calendar.tsx`** (NEW - ADAPTED)
   - Copy from Replit: `client/src/pages/Calendar.tsx`
   - ✅ Keep beautiful UI
   - ❌ **REPLACE** mock calendar data with: `GET /entries/calendar?month=YYYY-MM`
   - ❌ **ADD** API call to `/insights/period` for reflections
   - ❌ **USE** React Query

4. **`frontend/src/pages/TagCloud.tsx`** (NEW - ADAPTED)
   - Copy from Replit: `client/src/pages/TagCloud.tsx`
   - ✅ Keep beautiful UI
   - ❌ **REPLACE** mock tags with: `GET /tags-cloud`
   - ❌ **USE** React Query

5. **`frontend/src/pages/NotesListView.tsx`** (NEW - ADAPTED)
   - Copy from Replit: `client/src/pages/NotesListView.tsx`
   - ✅ Keep beautiful UI
   - ❌ **REPLACE** mock entries with: `GET /entries?limit=50`
   - ❌ **ADD** API call to `/insights/period` for insights
   - ❌ **USE** React Query

6. **`frontend/src/pages/NotesSplitView.tsx`** (NEW - ADAPTED)
   - Copy from Replit (if exists)
   - ❌ **ADAPT** similar to NotesListView

7. **`frontend/src/pages/Profile.tsx`** (NEW)
   - Copy from Replit (if needed)
   - ❌ **ADAPT** for user profile

8. **`frontend/src/pages/not-found.tsx`** (NEW)
   - Copy from Replit
   - ✅ Keep as-is

### Phase 5: Update App.tsx & Routing

**File to REPLACE:**

**`frontend/src/App.tsx`** (REPLACE)
```typescript
// Copy from Replit but ensure it uses our config
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";  // Uses our adapted version
import { Toaster } from "@/components/ui/toaster";
// ... import all pages
```

### Phase 6: API Integration Details

**For each page, replace mock data with:**

1. **Home.tsx** - Voice Recording
   ```typescript
   // After recording stops:
   const formData = new FormData();
   formData.append("file", audioBlob);
   const response = await fetch(`${config.apiBaseUrl}/transcribe`, {
     method: "POST",
     body: formData,
   });
   const { text } = await response.json();
   
   // Then create entry:
   await fetch(`${config.apiBaseUrl}/entries`, {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ transcript: text }),
   });
   ```

2. **EntryDetail.tsx** - Entry Data
   ```typescript
   const { data: entry } = useQuery({
     queryKey: [`${config.apiBaseUrl}/entries`, entryId],
     // ...
   });
   ```

3. **Calendar.tsx** - Calendar Data
   ```typescript
   const { data: calendar } = useQuery({
     queryKey: [`${config.apiBaseUrl}/entries/calendar`, { month: "2025-11" }],
     // ...
   });
   ```

4. **TagCloud.tsx** - Tags
   ```typescript
   const { data: tags } = useQuery({
     queryKey: [`${config.apiBaseUrl}/tags-cloud`],
     // ...
   });
   ```

5. **NotesListView.tsx** - Entries List
   ```typescript
   const { data: entries } = useQuery({
     queryKey: [`${config.apiBaseUrl}/entries`, { limit: 50 }],
     // ...
   });
   ```

## 4. File Mapping Summary

### Files to KEEP (Current Frontend)
- ✅ `frontend/package.json` (update dependencies)
- ✅ `frontend/vite.config.ts` (add Tailwind, keep mobile config)
- ✅ `frontend/tsconfig.json`
- ✅ `frontend/src/config.ts` ⭐ **CRITICAL - KEEP THIS**
- ✅ `frontend/src/types/api.ts`

### Files to CREATE (From Replit)
- `frontend/src/lib/utils.ts`
- `frontend/src/lib/queryClient.ts` ⚠️ **ADAPTED** (use config.apiBaseUrl)
- `frontend/src/index.css` (replace styles.css)
- `frontend/src/components/ui/*` (all 50+ components)
- `frontend/src/components/layout/MobileLayout.tsx`
- `frontend/src/hooks/use-mobile.tsx`
- `frontend/src/hooks/use-toast.ts`
- `frontend/src/pages/Home.tsx` ⚠️ **ADAPTED** (integrate voice recording)
- `frontend/src/pages/EntryDetail.tsx` ⚠️ **ADAPTED** (use real API)
- `frontend/src/pages/Calendar.tsx` ⚠️ **ADAPTED** (use real API)
- `frontend/src/pages/TagCloud.tsx` ⚠️ **ADAPTED** (use real API)
- `frontend/src/pages/NotesListView.tsx` ⚠️ **ADAPTED** (use real API)
- `frontend/src/pages/NotesSplitView.tsx` ⚠️ **ADAPTED** (if exists)
- `frontend/src/pages/Profile.tsx` ⚠️ **ADAPTED** (if needed)
- `frontend/src/pages/not-found.tsx`

### Files to REPLACE
- `frontend/src/App.tsx` (use Replit version with routing)
- `frontend/src/main.tsx` (update CSS import)

### Files to DELETE (After Migration)
- `frontend/src/components/VoiceRecordTest.tsx` ⚠️ **OR** integrate into Home.tsx
- `frontend/src/components/CalendarView.tsx` (replaced by pages/Calendar.tsx)
- `frontend/src/components/EntryDetail.tsx` (replaced by pages/EntryDetail.tsx)
- `frontend/src/components/EntryList.tsx` (replaced by pages/NotesListView.tsx)
- `frontend/src/components/RecordButton.tsx` (replaced by Home.tsx)
- `frontend/src/components/TagCloud.tsx` (replaced by pages/TagCloud.tsx)
- `frontend/src/styles.css` (replaced by index.css)

## 5. Critical Integration Points

### A. Voice Recording Integration
**Option 1:** Integrate `VoiceRecordTest.tsx` logic into `Home.tsx`
- Copy recording logic from `VoiceRecordTest.tsx`
- Replace mock navigation with real API calls
- Keep beautiful UI from Replit `Home.tsx`

**Option 2:** Create new `VoiceRecordButton.tsx` component
- Extract recording logic
- Use in `Home.tsx`

### B. API Configuration
**ALL API calls must use:**
```typescript
import { config } from "../config";  // or correct relative path
const url = `${config.apiBaseUrl}/entries`;
```

**Update `queryClient.ts`:**
```typescript
import { config } from "../config";

export async function apiRequest(method: string, endpoint: string, data?: unknown) {
  const url = `${config.apiBaseUrl}${endpoint}`;  // ✅ Prepend base URL
  // ...
}
```

### C. Routing Setup
- Use Wouter (lightweight, works great)
- Routes:
  - `/` → Home (voice recording)
  - `/entry/:id` → EntryDetail
  - `/calendar` → Calendar
  - `/tags` → TagCloud
  - `/notes-list` → NotesListView
  - `/notes-split` → NotesSplitView
  - `/profile` → Profile

## 6. Step-by-Step Implementation Order

1. ✅ Install dependencies (`npm install`)
2. ✅ Setup Tailwind (update vite.config.ts, create index.css)
3. ✅ Copy lib/utils.ts and adapt queryClient.ts
4. ✅ Copy all UI components
5. ✅ Copy hooks
6. ✅ Copy MobileLayout
7. ✅ Update App.tsx with routing
8. ✅ Copy and adapt Home.tsx (integrate voice recording)
9. ✅ Copy and adapt EntryDetail.tsx (add API calls)
10. ✅ Copy and adapt Calendar.tsx (add API calls)
11. ✅ Copy and adapt TagCloud.tsx (add API calls)
12. ✅ Copy and adapt NotesListView.tsx (add API calls)
13. ✅ Copy other pages
14. ✅ Test all routes
15. ✅ Verify API calls use config.apiBaseUrl
16. ✅ Clean up old components

## 7. Testing Checklist

- [ ] App starts without errors (`npm run dev`)
- [ ] All routes work (/, /entry/:id, /calendar, /tags, etc.)
- [ ] Voice recording works and calls `/transcribe`
- [ ] Entry creation works (`POST /entries`)
- [ ] Entry detail loads real data (`GET /entries/:id`)
- [ ] Calendar loads real data (`GET /entries/calendar`)
- [ ] Tag cloud loads real data (`GET /tags-cloud`)
- [ ] Notes list loads real data (`GET /entries`)
- [ ] Insights work (`GET /insights/entry/:id`, `/insights/period`)
- [ ] All API calls use `config.apiBaseUrl`
- [ ] Mobile layout and navigation work
- [ ] No TypeScript errors
- [ ] No console errors

---

## ⚠️ WAITING FOR CONFIRMATION

This plan preserves:
- ✅ Your working `config.ts` with `VITE_API_BASE_URL`
- ✅ Your mobile-friendly Vite config
- ✅ Your TypeScript types

This plan migrates:
- ✅ Beautiful Replit UI components and pages
- ✅ Routing and navigation
- ✅ React Query for data fetching
- ✅ Tailwind CSS with custom theme

**Ready to proceed?** Confirm and I'll start implementing step by step.

