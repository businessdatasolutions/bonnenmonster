# Save Button Allows Duplicate Saves After Success

**Status**: Open
**Priority**: High
**Created**: 2025-10-27

## Description

After successfully saving receipt data to Baserow, the save button temporarily turns green to indicate success, but then reverts back to blue and becomes clickable again. This allows users to accidentally save the same receipt multiple times, creating duplicate entries in the database.

## Steps to Reproduce

1. Upload or capture a receipt photo
2. Analyze the receipt (extract data with Gemini AI)
3. Click the "Opslaan in Baserow" (Save to Baserow) button
4. Button turns green indicating success
5. Wait a few seconds
6. Observe that button turns back to blue
7. Button is clickable again
8. Clicking again saves a duplicate entry to Baserow

## Expected Behavior

After successfully saving a receipt:
- User should not be able to save the same receipt again
- Button should remain disabled or provide clear indication that data is already saved
- Prevent accidental duplicate database entries
- Clear workflow to move on to next receipt

## Actual Behavior

- Save button temporarily shows success (green)
- Button then reverts to blue active state
- User can click save button again
- Same data gets saved multiple times to database
- No indication that this receipt was already saved

## Impact

- **Data Quality**: Duplicate entries in Baserow database
- **User Confusion**: Unclear if save was successful
- **Accidental Clicks**: Easy to click save multiple times
- **Database Pollution**: Requires manual cleanup of duplicates
- **Business Logic**: Breaks data integrity and reporting

## Current Implementation

Looking at the ReceiptDataDisplay component, the save button likely:
1. Shows loading state during save
2. Shows success state (green) temporarily
3. Resets to default state (blue)
4. Remains enabled

## Possible Solutions

### Option 1: Disable After Save (Recommended)
**Keep button disabled after successful save with clear message**

Pros:
- Simplest implementation
- Clear indication of completed action
- Prevents all duplicate saves
- Best for one-shot operations

UI Changes:
- Button stays green with checkmark after save
- Text changes to "Opgeslagen" (Saved)
- Button disabled permanently for this receipt
- User must reset/upload new receipt to save again

### Option 2: Clear Form After Save
**Reset the entire form after successful save**

Pros:
- Natural workflow continuation
- Ready for next receipt immediately
- Common pattern in data entry apps

Cons:
- User loses preview of what was saved
- May want to verify saved data

Implementation:
- Automatically call `handleReset()` after successful save
- Show success toast notification
- Clear extracted data and image
- Return to upload screen

### Option 3: Add Confirmation Dialog
**Require confirmation for subsequent saves**

Pros:
- Allows intentional re-saves if needed
- Warns user about duplicate

Cons:
- Extra click for legitimate re-saves
- More complex UX

Implementation:
- Track if receipt already saved (state variable)
- Show warning dialog: "Deze bon is al opgeslagen. Opnieuw opslaan?"
- Require explicit confirmation

### Option 4: Save State Tracking
**Track saved receipts to prevent duplicates**

Pros:
- Most intelligent solution
- Can check for duplicates
- Provides save history

Cons:
- More complex implementation
- Requires state management

Implementation:
- Store hash/ID of saved receipts in localStorage
- Check before allowing save
- Show "Already saved" indicator
- Option to view saved receipts

### Option 5: Add "Save & New" Button
**Two-button approach**

Buttons:
- "Opslaan" - Saves and disables button
- "Opslaan & Nieuwe Bon" - Saves and resets form

Pros:
- Clear user intent
- Fast workflow for multiple receipts
- Prevents accidental duplicates

## Recommended Approach

**Combination of Option 1 + Option 2:**

1. **After successful save:**
   - Button turns green with checkmark
   - Text: "✓ Opgeslagen"
   - Button disabled
   - Show success message: "Bon succesvol opgeslagen in Baserow"

2. **Add "Nieuwe Bon" button:**
   - Secondary button appears after save
   - Calls `handleReset()` to clear form
   - Returns to upload screen for next receipt

3. **Workflow:**
   ```
   Upload → Analyze → Save → [Opgeslagen ✓] [Nieuwe Bon]
   ```

This provides:
- Clear save confirmation
- Prevents duplicates
- Easy path to next receipt
- Professional UX

## Files to Modify

- `components/ReceiptDataDisplay.tsx` - Add save state tracking and button logic
- `src/components/ReceiptDataDisplay.tsx` - Mirror changes
- `App.tsx` - May need to track save state in parent component
- `src/App.tsx` - Mirror changes

## Acceptance Criteria

- [ ] Save button cannot be clicked twice for same receipt
- [ ] Clear visual indication when receipt is saved
- [ ] User can easily proceed to next receipt after save
- [ ] No duplicate entries possible in Baserow
- [ ] Success message clearly indicates save completed
- [ ] Button state persists (doesn't revert to blue)
- [ ] Optional: "Nieuwe Bon" button for quick workflow

## Technical Notes

Current button implementation likely uses temporary state:
```tsx
const [isSaving, setIsSaving] = useState(false);
const [saveSuccess, setSaveSuccess] = useState(false);

// After save:
setSaveSuccess(true);
setTimeout(() => setSaveSuccess(false), 2000); // Problem: resets
```

Should change to:
```tsx
const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

// After save:
setSaveState('saved'); // No timeout, permanent state
```

## Related Issues

- Consider adding undo/edit functionality for saved receipts
- May need save history/log feature in future
- Related to overall data management workflow

## Additional Context

This is a high-priority issue as it directly affects data integrity. Duplicate entries require manual cleanup and can cause reporting issues. The fix should be straightforward and improve overall UX significantly.
