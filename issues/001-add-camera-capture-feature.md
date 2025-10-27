# Add Camera Capture Feature

**Status**: Open
**Priority**: High
**Created**: 2025-10-27

## Description

Add native camera functionality to allow users to capture receipt photos directly within the app, instead of only being able to upload existing images from their device's gallery.

## Current Behavior

Users can only:
- Drag and drop image files
- Click to browse and select images from their device storage

## Desired Behavior

Users should be able to:
- Click a "Take Photo" button to open the device camera
- Capture a photo directly from the camera
- Preview the captured photo before analyzing
- Still have the option to upload from gallery

## Benefits

- Faster workflow - capture and analyze in one app
- Better mobile experience
- Reduced friction for users who want to scan receipts on-the-go
- More aligned with typical receipt scanning app UX

## Technical Implementation Suggestions

### Option 1: HTML5 Media Capture (Simple)
- Add `capture="environment"` attribute to file input
- Works on mobile browsers
- Minimal code changes
- Limited control over camera

```tsx
<input 
  type="file" 
  accept="image/*" 
  capture="environment"
/>
```

### Option 2: MediaDevices API (Advanced)
- Use `navigator.mediaDevices.getUserMedia()`
- More control over camera settings
- Preview stream before capture
- Better UX with custom camera interface

### Option 3: Capacitor Camera Plugin (Future Mobile App)
- When converting to native mobile app with Capacitor
- Access to full native camera capabilities
- `@capacitor/camera` plugin already documented in codebase

## Files to Modify

- `components/ImageUploader.tsx` - Add camera button and camera capture logic
- `src/components/ImageUploader.tsx` - Mirror changes
- Potentially create new `components/CameraCapture.tsx` component

## Acceptance Criteria

- [ ] Camera button visible on mobile devices
- [ ] Clicking camera button opens device camera
- [ ] User can capture photo from camera
- [ ] Captured photo appears in preview like uploaded images
- [ ] Works on both Android and iOS mobile browsers
- [ ] Falls back gracefully if camera is not available
- [ ] Maintains existing drag-drop and file upload functionality

## Additional Context

This feature is particularly important for mobile users and aligns with the PWA nature of the application. Many competing receipt scanning apps have this as a core feature.

## Related

- See CLAUDE.md section on future Capacitor mobile app implementation
- Consider this as preparation for native mobile app development
