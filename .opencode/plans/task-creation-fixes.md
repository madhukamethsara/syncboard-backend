# Task Creation Bug Fixes — Complete Plan

## Bug 1: `columnId` is `"todo"` string, not a valid ObjectId

**File:** `D:\SyncBoard\src\components\TaskModal.jsx`
**Location:** Lines 256-259

**Current code:**
```js
const defaultColumnId =
  defaultStatus ||
  columns[0]?._id ||
  "";
```

**Problem:** When opening from Topbar "+ Add Task", `defaultStatus` is `"todo"` (a string, not an ObjectId). It passes the truthiness check but fails backend Zod validation (`/^[0-9a-fA-F]{24}$/`).

**Fix:** Add ObjectId validation before using `defaultStatus`:
```js
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

const defaultColumnId =
  (defaultStatus && isValidObjectId(defaultStatus))
    ? defaultStatus
    : columns[0]?._id || "";
```

---

## Bug 2: `boardId` is `null`

**File:** `D:\SyncBoard\src\components\TaskModal.jsx`
**Location:** Lines 304-322 (inside `handleSave`)

**Problem:** When user is not on a Kanban view, `currentBoardId` is `null`. The API call sends `boardId: null` which fails Zod validation.

**Fix:** Add a check for `currentBoardId` at the start of `handleSave`:
```js
async function handleSave() {
  const title = form.title.trim();

  if (!title) {
    toast("Task title is required");
    return;
  }

  if (!currentBoardId) {
    toast("Please select a board first");
    return;
  }

  if (!form.columnId) {
    toast("Please select a column");
    return;
  }
  // ... rest of function
```

---

## Bug 3: `dueDate` format mismatch

**File:** `D:\SyncBoard\src\components\TaskModal.jsx`
**Location:** Lines 390-392 (inside `handleSave`, building `taskData`)

**Current code:**
```js
dueDate:
  form.dueDate ||
  null,
```

**Problem:** HTML date input sends `"2024-01-15"` (YYYY-MM-DD). Backend Zod schema requires ISO 8601 datetime with time: `"2024-01-15T00:00:00.000Z"`.

**Fix:** Convert date string to ISO datetime:
```js
dueDate: form.dueDate
  ? new Date(form.dueDate + "T00:00:00").toISOString()
  : null,
```

---

## Bug 4: Silent error handling

**File:** `D:\SyncBoard\src\components\TaskModal.jsx`
**Location:** Lines 406-410

**Current code:**
```js
} catch (error) {
  console.error(
    "FAILED TO SAVE TASK:",
    error
  );
}
```

**Problem:** No toast shown to user. Modal stays open with no feedback.

**Fix:** Add toast notification:
```js
} catch (error) {
  console.error("FAILED TO SAVE TASK:", error);
  toast(error.message || "Failed to save task");
}
```

---

## Summary of all changes in TaskModal.jsx

1. **Line 256-259:** Add `isValidObjectId` check for `defaultStatus`
2. **Line 316 area:** Add `currentBoardId` validation check
3. **Line 390-392:** Convert `dueDate` to ISO datetime format
4. **Line 406-410:** Add toast in catch block

## Verification
After changes, run `npx vite build` in `D:\SyncBoard` to verify no build errors.
