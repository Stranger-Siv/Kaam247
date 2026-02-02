# Poster Task Management Features

## ✅ IMPLEMENTED FEATURES

### 1. **Edit Task** ✅
- **Backend**: `PUT /api/tasks/:id/edit`
- **Frontend**: EditTaskModal component
- **Features**:
  - Edit title, description, category, budget, location, scheduled date/time, expected duration
  - Only editable when task status is `OPEN` or `SEARCHING`
  - Only poster can edit their own tasks
  - Location picker with map
  - Form validation

### 2. **Delete Task** ✅
- **Backend**: `DELETE /api/tasks/:id`
- **Frontend**: Delete button in TaskDetail
- **Features**:
  - Only deletable when task status is `OPEN` or `SEARCHING`
  - Confirmation dialog before deletion
  - Only poster can delete their own tasks
  - Navigates to dashboard after deletion

### 3. **Re-alert Workers (3-Hour Cooldown)** ✅
- **Backend**: Automatic check in `editTask` endpoint
- **Frontend**: Checkbox in EditTaskModal
- **Features**:
  - Workers are re-alerted when task is edited (if checkbox is checked)
  - **3-hour cooldown**: Only re-alerts if 3+ hours have passed since last alert
  - Prevents spam notifications
  - Updates `lastAlertedAt` timestamp in database

### 4. **UI Integration** ✅
- Edit/Delete buttons appear in TaskDetail page for posters
- Only visible when task status is `OPEN` or `SEARCHING`
- Modal-based editing experience
- Success/error messages

---

## 🚀 SUGGESTED ADDITIONAL FEATURES

### **Priority 1: Quick Actions**

#### 1. **Increase Budget (Quick Action)** 🔥
- **Why**: Posters often want to attract more workers by increasing budget
- **Implementation**:
  - Quick action button: "Increase Budget"
  - Modal with budget slider/input
  - Option to re-alert workers immediately (bypass 3-hour cooldown for budget increases)
  - Shows current budget vs new budget
- **UI**: Button next to Edit/Delete, or in task card

#### 2. **Duplicate Task** 🔥
- **Why**: Posters often post similar tasks repeatedly
- **Implementation**:
  - Button: "Duplicate Task"
  - Creates new task with same details (title, description, category, location)
  - Allows editing before posting
  - Opens PostTask page with pre-filled form
- **UI**: Button in TaskDetail or Activity page

#### 3. **Extend Deadline** 🔥
- **Why**: Tasks might need more time
- **Implementation**:
  - Quick action: "Extend Deadline"
  - Date/time picker
  - Only available for OPEN/SEARCHING/ACCEPTED tasks
  - Option to notify worker if task is already accepted

### **Priority 2: Task Management**

#### 4. **Mark as Urgent/Priority**
- **Why**: Highlight important tasks
- **Implementation**:
  - Toggle button: "Mark as Urgent"
  - Adds badge/indicator to task
  - Workers see priority indicator
  - Can increase visibility in task list

#### 5. **Hide/Show Task Temporarily**
- **Why**: Temporarily pause task without deleting
- **Implementation**:
  - Toggle: "Hide from workers"
  - Sets `isHidden: true` (already exists in model)
  - Can unhide later
  - Useful for pausing while editing

#### 6. **Task Templates**
- **Why**: Save common task configurations
- **Implementation**:
  - "Save as Template" button
  - Store templates in user profile
  - "Use Template" option when posting new task
  - Quick task creation

### **Priority 3: Worker Management**

#### 7. **View Worker Profile Before Accepting**
- **Why**: Posters want to see worker ratings/reviews
- **Implementation**:
  - Click on worker name → view profile modal
  - Show ratings, completed tasks count, reviews
  - Available when task is ACCEPTED

#### 8. **Message Worker** (Future)
- **Why**: Direct communication
- **Implementation**:
  - In-app messaging system
  - Or link to WhatsApp/Phone
  - Available when task is ACCEPTED/IN_PROGRESS

#### 9. **Add Tip/Bonus After Completion**
- **Why**: Reward excellent workers
- **Implementation**:
  - "Add Tip" button after completion
  - Amount input
  - Updates worker earnings
  - Shows in task history

### **Priority 4: Analytics & Insights**

#### 10. **Task Performance Metrics**
- **Why**: Understand task visibility
- **Implementation**:
  - Views count
  - Workers who viewed task
  - Time to acceptance
  - Best time to post (analytics)

#### 11. **Repost Task**
- **Why**: Task expired without acceptance
- **Implementation**:
  - "Repost" button for expired/cancelled tasks
  - Creates new task with same details
  - Updates status to OPEN
  - Resets timestamps

#### 12. **Archive Completed Tasks**
- **Why**: Clean up dashboard
- **Implementation**:
  - "Archive" button for completed tasks
  - Moves to archived section
  - Can view archived tasks separately
  - Reduces clutter in active tasks

### **Priority 5: Bulk Actions**

#### 13. **Bulk Edit Tasks**
- **Why**: Update multiple tasks at once
- **Implementation**:
  - Select multiple tasks (checkboxes)
  - Bulk edit: change category, increase budget, etc.
  - Useful for businesses posting many tasks

#### 14. **Bulk Delete**
- **Why**: Clean up old tasks
- **Implementation**:
  - Select multiple OPEN/SEARCHING tasks
  - Bulk delete with confirmation
  - Useful for cleanup

---

## 📋 IMPLEMENTATION CHECKLIST

### ✅ Completed
- [x] Edit Task endpoint (backend)
- [x] Delete Task endpoint (backend)
- [x] 3-hour cooldown for re-alerting
- [x] EditTaskModal component
- [x] Edit/Delete buttons in TaskDetail
- [x] Task model updated (lastAlertedAt field)

### 🔄 Next Steps (Priority Order)
1. **Increase Budget Quick Action** (Easy, High Value)
2. **Duplicate Task** (Easy, High Value)
3. **Extend Deadline** (Medium, High Value)
4. **Mark as Urgent** (Easy, Medium Value)
5. **Task Templates** (Medium, Medium Value)

---

## 🎯 RECOMMENDED NEXT FEATURE

**Start with "Increase Budget" quick action** because:
- ✅ Easy to implement (reuses edit endpoint)
- ✅ High user value (common use case)
- ✅ Can bypass 3-hour cooldown for budget increases
- ✅ Quick win for user satisfaction

**Implementation Plan:**
1. Add "Increase Budget" button in TaskDetail (for OPEN/SEARCHING tasks)
2. Create small modal with budget input
3. Call edit endpoint with `shouldReAlert: true` (bypass cooldown)
4. Show success message

---

## 📝 NOTES

- All edit/delete actions require task status to be `OPEN` or `SEARCHING`
- Re-alerting respects 3-hour cooldown (except for budget increases - can be bypassed)
- Socket.IO events fire for all updates (task_updated, task_status_changed)
- Frontend validates permissions (only poster can edit/delete their tasks)
- Error handling included for all operations

