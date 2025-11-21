# Replit Frontend Integration Guide

## Files to COMPARE (don't overwrite blindly)

These files might have different configurations. **Compare them first** before replacing:

### 1. Configuration Files
- `package.json` - Check for:
  - Different dependencies (we have React 18.3.1, Vite 7.1.12)
  - Different scripts
  - **Action**: Compare and merge dependencies if needed

- `vite.config.ts` - Check for:
  - Different server settings (we have `host: "0.0.0.0"` for mobile access)
  - Different plugins
  - **Action**: Keep our version OR merge useful settings

- `tsconfig.json` - Check for:
  - Different compiler options
  - **Action**: Usually safe to keep ours, but compare

- `index.html` - Check for:
  - Different meta tags
  - Different title
  - **Action**: Compare and merge if needed

## Files to REVIEW (might have new features)

### 2. Source Files - Compare Before Replacing

- `src/App.tsx` - **Our current version is minimal** (just renders VoiceRecordTest)
  - **Action**: Check if Replit version has better structure/routing
  - **Keep ours if**: It's working fine
  - **Use Replit if**: It has proper routing, navigation, or better architecture

- `src/main.tsx` - Usually standard, but compare
  - **Action**: Keep ours (it's standard React setup)

- `src/config.ts` - **We have this with `VITE_API_BASE_URL`**
  - **Action**: Keep ours OR merge if Replit has additional config

- `src/styles.css` - Compare styles
  - **Action**: Merge useful styles, keep our mobile-first approach

- `src/vite-env.d.ts` - Type definitions
  - **Action**: Merge if Replit has additional type definitions

## Files to SAFELY USE (new components/features)

### 3. New Components (if they don't exist)
- Any new components in `src/components/` that we don't have
- **Action**: Copy them over, they won't conflict

### 4. New Types
- Any new files in `src/types/` that we don't have
- **Action**: Copy them over

## Files to IGNORE (don't use)

- `node_modules/` - Always regenerate with `npm install`
- `dist/` - Build output, will be regenerated
- `.env` files - Keep your local environment variables
- Any Replit-specific config files (`.replit`, `replit.nix`, etc.)

## Recommended Integration Steps

1. **Extract Replit zip to a temporary folder** (not directly into frontend/)

2. **Compare configuration files:**
   ```bash
   # Compare package.json
   diff package.json /path/to/replit/package.json
   
   # Compare vite.config.ts
   diff vite.config.ts /path/to/replit/vite.config.ts
   ```

3. **Check for new components:**
   ```bash
   # See what components Replit has that we don't
   ls /path/to/replit/src/components/
   ls src/components/
   ```

4. **Review src/App.tsx:**
   - Check if Replit version has better structure
   - If yes, consider adopting it (but keep our VoiceRecordTest integration)

5. **Copy new components/types:**
   - Only copy files that don't exist in our project
   - Or files that are clearly improvements

6. **Update dependencies if needed:**
   ```bash
   npm install
   ```

7. **Test everything:**
   ```bash
   npm run dev
   ```

## Current Project Structure

Our current frontend has:
- ✅ `VoiceRecordTest.tsx` - Main recording component (KEEP THIS)
- ✅ `config.ts` - API configuration (KEEP THIS)
- ✅ `types/api.ts` - TypeScript types (KEEP THIS)
- ✅ Mobile-first setup with `host: "0.0.0.0"`
- ✅ Vite 7.1.12 configuration

## What We Likely Want from Replit

- New UI components (if any)
- Better routing/navigation (if Replit has it)
- Additional features we don't have yet
- Better styling/components library setup

## What We Should Keep

- Our `VoiceRecordTest.tsx` component (it's working and integrated)
- Our `config.ts` with API base URL setup
- Our mobile-first Vite config
- Our TypeScript types in `types/api.ts`

