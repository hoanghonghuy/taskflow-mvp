# UI Components

## 📁 Structure

```
ui/
├── index.ts          # ⭐ Barrel export - Import from here
├── avatar.tsx        # Avatar component
├── button.tsx        # Button component
├── dialog.tsx        # Dialog component
└── alert-dialog.tsx  # Alert dialog component
```

## 🎯 Export Pattern

### ✅ Consistent Exports

All components should export both default and named:

```typescript
// avatar.tsx
function Avatar() { ... }

export default Avatar
export { Avatar }
```

### 📖 Usage

```typescript
// ✅ Both work
import Avatar from '@/components/ui/avatar'
import { Avatar } from '@/components/ui/avatar'
import { Avatar } from '@/components/ui'  // From barrel
```

## 🚨 Export Consistency Rules

1. **Always export both default and named**
   - Default: For convenience
   - Named: For barrel exports and tree-shaking

2. **Use barrel exports for multiple imports**
   ```typescript
   // ✅ Good
   import { Avatar, Button, Dialog } from '@/components/ui'
   
   // ⚠️ OK but verbose
   import Avatar from '@/components/ui/avatar'
   import Button from '@/components/ui/button'
   ```

3. **Check exports before committing**
   - Run: `npm run typecheck && npm run build` to catch export errors

## 📋 Component Checklist

- [ ] Component is exported (default + named)
- [ ] Component is added to `index.ts`
- [ ] Props are typed with TypeScript
- [ ] Component is documented
- [ ] Component is tested (future)

