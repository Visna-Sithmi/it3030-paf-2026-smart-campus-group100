# Analytics Dashboard - Implementation Checklist

## Quick Reference Guide for Applying Fixes

### 🔴 CRITICAL BUGS (Fix Immediately)

- [ ] **Bug #1: Filter Type Mismatch**
  - File: `page.tsx` line 193
  - Issue: `assignedToFilter` string vs `assignedToId` number comparison
  - Fix: Use `Number(assignedToId) === Number(assignedToFilter)`
  - Impact: Assigned staff filtering doesn't work

- [ ] **Bug #2: Date Timezone Issues**
  - File: `page.tsx` lines 194-196
  - Issue: Creating Date objects loses timezone context
  - Fix: Compare ISO date strings instead: `createdAt.split('T')[0] >= fromDate`
  - Impact: Off-by-one day filtering errors

- [ ] **Bug #3: Report Download Filters**
  - File: `page.tsx` lines 359-367
  - Issue: Sends "ALL" values to API instead of omitting them
  - Fix: Only send non-"ALL" filter values
  - Impact: Report always includes all statuses/priorities

- [ ] **Bug #4: Profile Upload No Validation**
  - File: `page.tsx` lines 259-265
  - Issue: Accepts files of any size/type
  - Fix: Add file type and size checks (2MB limit, image/* only)
  - Impact: Browser crashes with large files

- [ ] **Bug #5: Toast Timeout Leak**
  - File: `page.tsx` lines 124-127
  - Issue: setTimeout not cancelled on unmount
  - Fix: Use useRef to track and clear timeout in cleanup
  - Impact: Memory leak, state updates after unmount

- [ ] **Bug #6: Missing Null Checks**
  - File: `page.tsx` lines 513-520
  - Issue: `staff.map()` fails if staff is null
  - Fix: Use `(staff || []).map(...)`
  - Impact: Component crashes

- [ ] **Bug #7: ManagerDashboard Response Validation**
  - File: `ManagerDashboard.tsx` lines 119-121
  - Issue: No validation of API response structure
  - Fix: Filter and type-check topTechnicians before mapping
  - Impact: Crashes if API returns malformed data

- [ ] **Bug #8: Priority Filter Case Sensitivity**
  - File: `page.tsx` line 191
  - Issue: Case-sensitive comparison may fail
  - Fix: Convert both sides to uppercase: `.toUpperCase() === String(priorityFilter).toUpperCase()`
  - Impact: Priority filtering fails silently

---

### ⚠️ PERFORMANCE ISSUES (Fix High Priority)

- [ ] **Performance #1: Full Data Reload on Every Action**
  - File: `page.tsx` lines 337-343, 349-356, 258
  - Impact: Loads 1000+ tickets on every assign/notes/update
  - Fix: Implement optimistic updates (see ANALYTICS_DASHBOARD_FIXES.md for example)
  - Benefit: 10-100x faster user actions

- [ ] **Performance #2: No Pagination**
  - File: `page.tsx` lines 558-575
  - Impact: Renders all filtered tickets at once (500+ cards = slow)
  - Fix: Add pagination with TICKETS_PER_PAGE = 20
  - Benefit: Instant render times even with 5000+ tickets

- [ ] **Performance #3: Excessive useState Hooks**
  - File: `page.tsx` lines 70-110
  - Impact: 24+ separate state variables = hard to maintain
  - Fix: Consolidate into dashboard, profile, filters objects
  - Benefit: Easier to understand and modify

- [ ] **Performance #4: Per-Ticket Loading States Missing**
  - File: `page.tsx` entire file
  - Impact: No visual feedback on long operations
  - Fix: Add actionLoading state: `Record<number, string>`
  - Benefit: Better UX, prevents double-clicking

- [ ] **Performance #5: ManagerDashboard Mounted Flag**
  - File: `ManagerDashboard.tsx` lines 73-88
  - Impact: Race condition risks
  - Fix: Use AbortController instead
  - Benefit: Cleaner, more reliable code

- [ ] **Performance #6: Inefficient Memoization**
  - File: `page.tsx` lines 186-203
  - Impact: Recalculates on every filter change
  - Fix: Consider useDeferredValue for debounced filtering
  - Benefit: Smoother user interactions

---

### 🔧 STATE MANAGEMENT ISSUES

- [ ] **State #1: Consolidate Profile State**
  - Before: 4 separate useState hooks for profile
  - After: Single state object with profile data + modal state
  - Impact: Cleaner code, easier to manage

- [ ] **State #2: Consolidate Report State**
  - Before: reportLoading + reportError (separate)
  - After: reportState = { loading, error }
  - Impact: Prevents state consistency bugs

- [ ] **State #3: Consolidate Dashboard State**
  - Before: tickets, staff, loading, error (separate)
  - After: dashboard = { tickets, staff, loading, error }
  - Impact: Easier to reset and manage

- [ ] **State #4: Add Per-Ticket Action Loading**
  - Add: actionLoading: Record<number, string>
  - Track which action is loading per ticket
  - Use for button disabled states and loading text

---

### 📋 EDGE CASES & VALIDATION

- [ ] **Validation #1: Staff Array Null Checks**
  - Use `(dashboard.staff || [])` everywhere staff is accessed
  - Check line 513, 661, 681

- [ ] **Validation #2: Priority Case Handling**
  - Use `.toUpperCase()` on both filter and data value

- [ ] **Validation #3: File Upload Validation**
  - Check file type: `file.type.startsWith('image/')`
  - Check file size: `file.size <= 2 * 1024 * 1024`
  - Show error message if invalid

- [ ] **Validation #4: Date String Parsing**
  - Always use ISO date format: `YYYY-MM-DD`
  - Parse using `.split('T')[0]` not `new Date()`

- [ ] **Validation #5: ManagerDashboard Data Validation**
  - Validate topTechnicians array structure
  - Handle missing categoryStats, ticketsPerDay
  - Graceful fallbacks for calculations

---

## Testing Checklist

After applying fixes, test:

### Data Accuracy
- [ ] Filter by assigned staff - verify only correct tickets appear
- [ ] Filter by date range - check timezone handling
- [ ] Filter by priority - test case sensitivity
- [ ] Filter by status - verify all statuses work
- [ ] Search by text - verify partial matches work
- [ ] Stats counters - match filtered ticket count

### API Calls
- [ ] Assign staff - verify optimistic update
- [ ] Update status - verify optimistic update
- [ ] Save notes - verify optimistic update
- [ ] Reject ticket - verify optimistic update and error handling
- [ ] Download report - verify correct filters sent to API
- [ ] Close ticket - verify works after completed by staff

### Filters & Sorting
- [ ] Date from/to filters - test edge cases (same day, year boundaries)
- [ ] Assigned staff filter - test with multiple staff
- [ ] Priority filter - test all priorities + ALL
- [ ] Status filter - test all statuses + ALL
- [ ] Search query - test with special characters

### Charts (ManagerDashboard)
- [ ] Category distribution pie chart - verify all categories shown
- [ ] Tickets per day chart - verify trend calculation
- [ ] Top technicians - verify correct sorting and names
- [ ] KPI cards load - verify format hours, percentage display

### Edge Cases
- [ ] Upload large image (>2MB) - should show error
- [ ] Upload non-image file - should show error
- [ ] No assigned staff - filter should show "Any" option only
- [ ] No tickets - show "No tickets found" message
- [ ] API failure - show error message and allow retry
- [ ] Dismiss toast - message should disappear
- [ ] Unmount component - no state update warnings

### Performance
- [ ] Load page with 1000+ tickets - should be instant
- [ ] Scroll through tickets - should be smooth
- [ ] Assign staff - should update immediately (no flicker)
- [ ] Update status - should update immediately
- [ ] Open/close modal - should be instant
- [ ] No console errors or memory leaks

---

## Files Modified

1. **frontend/src/app/manager/issueDashboard/page.tsx**
   - Consolidated state management
   - Fixed filter comparisons
   - Implemented optimistic updates
   - Added file validation
   - Added per-ticket loading states
   - Fixed date filtering
   - Fixed report filters

2. **frontend/src/app/manager/issueDashboard/ManagerDashboard.tsx**
   - Fixed AbortController usage
   - Added data validation
   - Improved error handling
   - Fixed trend calculation

3. **frontend/src/services/ticketService.ts** (Optional)
   - Add response validation (recommended)
   - Add error logging (recommended)

---

## Rollback Plan

If issues occur after implementing fixes:

1. Save original files as backup:
   ```bash
   cp page.tsx page.tsx.backup
   cp ManagerDashboard.tsx ManagerDashboard.tsx.backup
   ```

2. Critical issues to watch for:
   - Tickets not loading - check loadData() error
   - Filters not working - verify type conversions
   - Dates filtering incorrectly - check timezone logic
   - Performance issues - check pagination implementation

3. Quick rollback:
   ```bash
   cp page.tsx.backup page.tsx
   cp ManagerDashboard.tsx.backup ManagerDashboard.tsx
   ```

---

## Estimated Effort

- **Bug Fixes:** 2-3 hours
- **Performance Improvements:** 3-4 hours
- **State Consolidation:** 2 hours
- **Testing:** 2-3 hours
- **Total:** 9-12 hours

---

## Questions?

Refer to:
- [ANALYTICS_DASHBOARD_REVIEW.md](ANALYTICS_DASHBOARD_REVIEW.md) - Detailed issue explanations
- [ANALYTICS_DASHBOARD_FIXES.md](ANALYTICS_DASHBOARD_FIXES.md) - Complete fixed code
- Original files for reference

