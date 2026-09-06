# Full Cleanup Plan — SyncBoard Backend + Frontend

## COMPLETED (Deletions)
- [x] Deleted `src/app.js` (empty unused file)
- [x] Deleted `src/routes/userRouts.js` (duplicate with typo)

## BACKEND CHANGES

### 1. Remove console.logs from authMiddleware.js
**File:** `src/middleware/authMiddleware.js`
- Remove line 6: `console.log("Cookies received:", req.cookies);`
- Remove line 10: `console.log("Token exists:", !!token);`
- Remove line 11: `console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);`
- Remove line 25: `console.log("Decoded token:", decoded);`
- Remove lines 41-42: `console.log("AUTH ERROR NAME:", error.name);` and `console.log("AUTH ERROR MESSAGE:", error.message);`

### 2. Remove debug console.logs from userController.js
**File:** `src/controllers/userController.js`
- Remove line 26: `console.log("PROFILE UPDATE CALLED");`
- Remove line 27: `console.log("BODY:", req.body);`
- Remove line 31: `console.log("VALIDATION:", result);`

### 3. Fix authmiddleware → authMiddleware casing in route files
These files all have `require("../middleware/authmiddleware")` (lowercase m) but the file is `authMiddleware.js` (capital M):
- `src/routes/authRoutes.js` line 3
- `src/routes/userRoutes.js` line 9
- `src/routes/teamRoutes.js` line 18
- `src/routes/columnRoutes.js` line 10

Change all to: `require("../middleware/authMiddleware")`

### 4. Fix hardcoded localhost in emailservice.js
**File:** `src/services/emailservice.js`
- Change line 4-5 from:
  ```js
  const verificationUrl =
    `http://localhost:5000/api/auth/verify-email/${token}`;
  ```
- To:
  ```js
  const baseUrl = process.env.BASE_URL || "http://localhost:5000";
  const verificationUrl =
    `${baseUrl}/api/auth/verify-email/${token}`;
  ```

### 5. Consolidate getBoardPermission in columnController.js
**File:** `src/controllers/columnController.js`
- Remove the local `getBoardPermission` function (lines 10-50)
- Add import at top: `const { getBoardPermission } = require("../utils/boardAccess");`

### 6. Consolidate getBoardPermission in taskController.js
**File:** `src/controllers/taskController.js`
- Remove the local `getBoardPermission` function (lines 10-46)
- Add import at top: `const { getBoardPermission } = require("../utils/boardAccess");`

## FRONTEND CHANGES

### 7. Fix emailLinkToken bug + remove dead /invitations/ match in App.jsx
**File:** `D:\SyncBoard\src\App.jsx`

**a) Remove dead /invitations/ match (lines 37-40):**
Delete:
```jsx
const inviteMatch = path.match(/^\/invitations\/([^/]+)\/accept\/?$/);
if (inviteMatch) {
  return { view: 'join', joinCode: '' };
}
```

**b) Add emailLinkToken state variable (after line 56):**
The verify-email view needs a token. Add:
```jsx
const [emailLinkToken] = useState(initialLink ? initialLink.token : null);
```

### 8. Fix priorityColor case mismatch in utils.js
**File:** `D:\SyncBoard\src\utils.js`
- Change line 2 from:
  ```js
  return p === 'High' ? 'var(--rose)' : p === 'Medium' ? 'var(--gold)' : 'var(--green)';
  ```
- To:
  ```js
  return p === 'high' ? 'var(--rose)' : p === 'medium' ? 'var(--gold)' : 'var(--green)';
  ```

### 9. Remove dead updateCurrentUser from AppContext.jsx
**File:** `D:\SyncBoard\src\AppContext.jsx`
- Remove lines 825-845 (the `updateCurrentUser` export)
- Profile.jsx already imports this from `../api/userapi.js`

## VERIFICATION
After all changes, run:
- Backend: `node -e "require('./src/routes/teamRoutes'); require('./src/routes/authRoutes'); require('./src/routes/userRoutes'); require('./src/routes/columnRoutes'); require('./src/routes/boardRoutes'); require('./src/routes/taskRoutes'); console.log('OK')"` in `D:\syncboard-backend`
- Frontend: `npx vite build` in `D:\SyncBoard`
