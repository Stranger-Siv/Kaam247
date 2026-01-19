# Quick Testing Guide - Kaam247

## 🚀 Quick Start Testing

### Step 1: Start the Application
```bash
# Terminal 1: Start backend
cd server
npm start

# Terminal 2: Start frontend
cd client
npm run dev
```

### Step 2: Test Critical Flows

#### Flow 1: Worker Flow (Complete Task)
1. **Login** as a worker user
2. **Dashboard**: Check stats display correctly
3. **Toggle ON DUTY**: Should show available tasks
4. **Tasks Page**: Should see available tasks (not own tasks)
5. **Accept Task**: Click accept on a task
6. **Task Detail**: Should show "Start Task" button
7. **Start Task**: Click start, status should update
8. **Complete Task**: Click complete, status should update
9. **Poster Confirms**: Switch to poster mode, confirm completion
10. **Rate Worker**: Rate the worker

#### Flow 2: Poster Flow (Post & Manage Task)
1. **Login** as a poster user (or switch mode)
2. **Post Task**: Fill all steps, submit
3. **Task Detail**: Verify task displays correctly
4. **Edit Task**: Click edit, modify fields, save
5. **Increase Budget**: Click increase budget, update amount
6. **Worker Accepts**: Switch to worker mode, accept task
7. **Worker Completes**: Complete the task
8. **Confirm Completion**: Switch back to poster mode, confirm
9. **Rate Worker**: Rate the worker

#### Flow 3: Real-time Features
1. **Open two browsers** (or incognito windows)
2. **Browser 1**: Login as poster, post a task
3. **Browser 2**: Login as worker (ON DUTY), should see alert
4. **Browser 2**: Accept task
5. **Browser 1**: Should see task status update in real-time
6. **Browser 2**: Start task
7. **Browser 1**: Should see "Confirm Completion" button appear
8. **Browser 2**: Complete task
9. **Browser 1**: Should see completion notification

### Step 3: Test Edge Cases

#### Empty States
- [ ] Dashboard with no tasks
- [ ] Tasks page with no available tasks
- [ ] Activity page with no activity
- [ ] Profile with no completed tasks

#### Error Scenarios
- [ ] Submit form with empty fields
- [ ] Try to accept task when offline
- [ ] Try to edit task that's already accepted
- [ ] Network error (disconnect internet)
- [ ] Location permission denied

#### Mode Switching
- [ ] Switch to worker mode with active poster task
- [ ] Switch to poster mode while ON DUTY
- [ ] Switch modes during active task

### Step 4: Test UI Responsiveness

#### Mobile (< 640px)
- [ ] All pages render correctly
- [ ] Buttons are tappable (min 44px)
- [ ] Forms are usable
- [ ] Navigation works
- [ ] Alerts are full-screen

#### Tablet (640px - 1024px)
- [ ] Layout adapts correctly
- [ ] Cards display properly
- [ ] Tables scroll horizontally if needed

#### Desktop (> 1024px)
- [ ] Full layout displays
- [ ] Side gaps are consistent
- [ ] Hover states work

### Step 5: Check Console

Open browser DevTools and check:
- [ ] No red errors
- [ ] No unexpected warnings
- [ ] Socket.IO connects successfully
- [ ] API calls succeed (check Network tab)

### Step 6: Test Admin Panel

1. **Login** as admin
2. **Overview**: Check stats display
3. **Users**: View user list, filters work
4. **Tasks**: View task list, filters work
5. **User Detail**: Click user, view details
6. **Task Detail**: Click task, view details

## 🐛 Common Issues to Watch For

1. **Socket.IO**: Check if connection establishes
2. **Geolocation**: Test with location permission denied
3. **Form Validation**: Try submitting empty forms
4. **Mode Switching**: Test edge cases
5. **Real-time Updates**: Verify updates appear instantly
6. **Mobile UI**: Test on real device if possible

## 📝 Testing Notes

- Test with different user roles
- Test with different task statuses
- Test mode switching scenarios
- Test Socket.IO reconnection
- Test on different screen sizes
- Test with slow network (throttle in DevTools)

