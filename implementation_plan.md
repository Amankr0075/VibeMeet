# Real-Time Matching & Video Call Implementation Plan

**Goal**: Complete Phase 3 & 4 – real‑time user matching, WebRTC video call UI, chat, and safety moderation integration.

## User Review Required
- **Design aesthetics**: Confirm preferred style for the video call screen (e.g., dark theme with glassmorphism, button layout, overlay controls). We'll use the premium design language already applied to other pages.
- **Media permissions handling**: Do you want an explicit permission request modal before joining a call, or should we auto‑prompt on page load?
- **Optional features**: Screen sharing button, mute‑all participants, or call recording?

## Open Questions
- Should the call initiator have a "Start Call" button, or should calls start automatically once a match is found?
- Do you want a separate “Call Ended” screen with a summary, or simply navigate back to the match queue?
- Preferred fallback when WebRTC fails (e.g., display a message, retry, or redirect to support).

## Proposed Changes
---
### Frontend
- **[NEW] src/pages/CallPage.tsx** – Full‑screen video call component.
  - Uses `simple-peer` for peer connections.
  - Handles socket events: `call-offer`, `call-answer`, `ice-candidate`, `match-found`, `initiate-call`, `chat-message`, `safety-warning`, `call-ended`.
  - UI includes local/remote video elements, mute/unmute, video on/off, chat sidebar, and end‑call button.
  - Incorporates the premium UI style (gradient backgrounds, subtle micro‑animations).
- **[MODIFY] src/pages/MatchPage.tsx** – Update to navigate to `/call/:roomId` when `match-found` is received.
- **[MODIFY] src/App.tsx** – Add route `<Route path="/call/:roomId" element={<CallPage />} />`.
- **[NEW] src/context/CallContext.tsx** – React context to share call state across components (peer instance, streams, room ID).
- **[NEW] src/ai/moderationService.ts** – Wrapper around Groq moderation endpoint (using the provided API key) for real‑time text safety checks (already referenced in backend, but frontend may also need to display warnings).
- **[NEW] src/styles/call.css** – Styling for the call UI, matching the app’s dark‑mode/glassmorphism theme.

### Backend
- **[MODIFY] src/sockets/socketHandler.ts** – Ensure `call-offer`, `call-answer`, `ice-candidate` events forward the SDP and ICE data correctly. Add logging for debugging.
- **[NEW] src/ai/moderationService.ts** – Server‑side helper that calls Groq with the API key from the environment variables to classify message risk levels.
- **[MODIFY] src/routes/authRoutes.ts** – Add rate‑limiting middleware for socket events to mitigate abuse (optional, can be toggled).

### Testing & Verification
- **Automated**: Write unit tests for `CallPage` event handling using Jest + React Testing Library.
- **Manual**: Spin up the dev server, open two browsers, verify match queue, video streams, chat, and safety warnings.
- **Performance**: Measure latency of signaling via Socket.IO and ensure ICE negotiation succeeds under typical NAT conditions.

## Verification Plan
### Automated Tests
- `npm run test -- src/pages/CallPage.test.tsx` – validates peer connection lifecycle.
- Backend: run existing test suite (`npm test`) to ensure no regressions.

### Manual Verification
1. Start backend (`npm run dev` in `backend`).
2. Start frontend (`npm run dev` in `frontend`).
3. Log in with two Google accounts, complete profiles.
4. Click "Join" from the Match page; ensure both users receive `match-found` and are redirected to `/call/:roomId`.
5. Verify video streams appear, mute/unmute works, chat messages are delivered, and safety warnings appear for flagged text.
6. End call and confirm both users return to the match queue.

---
**Next Steps**: Await your confirmation on UI preferences and open questions before creating the new files and updating existing ones.
