# Redux State Management Setup

## Overview

Replaced event listener pattern with Redux for centralized state management of video processing and updates.

## Store Structure

### `src/store/store.js`

- Configures Redux store with two slices: `processing` and `video`

### `src/store/slices/processingSlice.js`

**State shape:**

```javascript
{
  processing: {
    videos: {
      [videoId]: {
        videoId,
        title,
        progress,      // 0-100
        state,         // "pending" | "processing" | "completed" | "error"
        status,        // "safe" | "flagged" (analysis result)
        confidence,    // 0-1 (confidence score)
        stage,         // Current processing stage
        message,       // Progress message
        duration,      // Video duration
        resolution,    // Video resolution
        reasons        // Array of flagging reasons
      }
    }
  }
}
```

**Actions:**

- `addProcessingVideo(videoId, title)` - Add video to processing queue
- `updateProcessingStart(videoId, title)` - Mark as processing started
- `updateProcessingProgress(videoId, stage, progress, message)` - Update progress
- `updateProcessingComplete(videoId, status, confidence, ...)` - Mark as completed
- `updateProcessingError(videoId, error)` - Mark as failed
- `removeProcessingVideo(videoId)` - Remove from processing

### `src/store/slices/videoSlice.js`

**State shape:**

```javascript
{
  video: {
    shouldRefresh: false,  // Trigger for Library/Dashboard to refetch
    lastUpdatedAt: null
  }
}
```

**Actions:**

- `triggerVideoRefresh()` - Trigger page refetch (called when processing completes)
- `clearRefreshTrigger()` - Clear the trigger flag

## Socket Integration

### `src/hooks/useSocketListener.js`

- Initializes Socket.IO connection
- Listens for real-time processing events
- **Dispatches Redux actions** on each socket event
- Logs all events to console for debugging: `[socket] event-name { data }`

**Events handled:**

- `video:processing:start` → `updateProcessingStart`
- `video:processing:progress` → `updateProcessingProgress`
- `video:processing:complete` → `updateProcessingComplete` + `triggerVideoRefresh`
- `video:processing:error` → `updateProcessingError` + `triggerVideoRefresh`

## Component Integration

### Hook: `useSocket()`

Located in `src/context/SocketContext.jsx` (now Redux-aware).

**Returns:**

```javascript
{
  processingVideos, // Current processing state from Redux
    removeProcessingVideo(id), // Dispatch action to remove
    addProcessingVideo(id, title), // Dispatch action to add
    shouldRefresh; // Trigger flag from Redux
}
```

**Example usage:**

```javascript
import { useSocket } from "../context/SocketContext";

const MyComponent = () => {
  const { processingVideos } = useSocket();

  return processingVideos[videoId]?.progress;
};
```

### Automatic Page Refresh

**Library.jsx** and **Dashboard.jsx** now:

1. Listen to Redux `shouldRefresh` flag via `useSelector`
2. Auto-refetch when flag is true
3. Clear flag via `dispatch(clearRefreshTrigger())`

**No event listeners needed anymore!**

## Flow Summary

```
Backend (Socket.io)
  ↓
Socket Event (e.g., progress)
  ↓
useSocketListener hook
  ↓
dispatch(Redux action)
  ↓
Redux store updates
  ↓
Components re-render via useSelector
  ↓
ProcessingStatus & VideoCard update live
  ↓
On complete: dispatch(triggerVideoRefresh)
  ↓
Library/Dashboard detects shouldRefresh flag
  ↓
Auto-refetch API data
  ↓
Page updates with final state
```

## Debug Logs

All socket events log to console with `[socket]` prefix:

- `[socket] connected { id: ... }`
- `[socket] video:processing:start { videoId, title }`
- `[socket] video:processing:progress { videoId, stage, progress }`
- etc.

Watch for these in DevTools Console when testing.

## Files Changed

- ✅ Created: `src/store/store.js`
- ✅ Created: `src/store/slices/processingSlice.js`
- ✅ Created: `src/store/slices/videoSlice.js`
- ✅ Created: `src/hooks/useSocketListener.js`
- ✅ Updated: `src/main.jsx` (add Redux Provider)
- ✅ Updated: `src/App.jsx` (use useSocketListener hook)
- ✅ Updated: `src/context/SocketContext.jsx` (Redux-aware hook)
- ✅ Updated: `src/pages/Library.jsx` (use Redux refresh trigger)
- ✅ Updated: `src/pages/Dashboard.jsx` (use Redux refresh trigger)
- ✅ Existing: `src/components/VideoCard.jsx` (already Redux-compatible)
- ✅ Existing: `src/components/ProcessingStatus.jsx` (already Redux-compatible)
