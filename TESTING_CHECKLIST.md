# Kaam247 Testing & QA Checklist

## 🔐 Authentication & Authorization
- [ ] User registration
- [ ] User login
- [ ] User logout
- [ ] Protected routes redirect when not logged in
- [ ] Admin routes accessible only to admins
- [ ] Token expiration handling
- [ ] Session persistence on page refresh

## 👤 User Profile & Settings
- [ ] View profile (worker mode)
- [ ] View profile (poster mode)
- [ ] Edit profile (name, phone)
- [ ] Profile stats display correctly
- [ ] Average rating hidden in poster mode
- [ ] Activity button works
- [ ] Edit Profile button works
- [ ] Mode toggle works

## 🏠 Landing Page (Home.jsx)
- [ ] All sections render correctly
- [ ] Buttons are clickable and navigate correctly
- [ ] Responsive on mobile/tablet/desktop
- [ ] Images load correctly
- [ ] Smooth scrolling
- [ ] Call-to-action buttons work

## 📊 Dashboard
- [ ] Stats cards display correct data
- [ ] Available tasks show when worker is online
- [ ] Available tasks hidden when worker is offline
- [ ] Own tasks hidden in worker mode
- [ ] Pending Confirmations section shows correct tasks
- [ ] Task cards are clickable
- [ ] Empty states display correctly
- [ ] OFF DUTY state displays when offline
- [ ] Location display works

## 📋 Tasks Page
- [ ] Filters work correctly (status, category, location)
- [ ] Task list displays correctly
- [ ] Own tasks hidden in worker mode
- [ ] Tasks hidden when worker is offline
- [ ] OFF DUTY message shows when offline
- [ ] Task cards are clickable
- [ ] Empty states display correctly
- [ ] Pagination works (if implemented)
- [ ] New task alerts work (Socket.IO)

## 📝 Post Task Flow
- [ ] Step 1: Basic details (title, description, category)
- [ ] Step 2: Location & time (location picker, date, time, duration)
- [ ] Step 3: Budget selection
- [ ] Form validation works
- [ ] Error messages display correctly
- [ ] "Use my current location" button works
- [ ] Map displays and marker is draggable
- [ ] Task submission works
- [ ] Redirect to task detail after submission
- [ ] Custom budget input works

## 🔍 Task Detail Page
- [ ] All task information displays correctly
- [ ] Timeline shows correct status
- [ ] Accept task button (worker mode)
- [ ] Start task button (worker mode)
- [ ] Complete task button (worker mode)
- [ ] Confirm completion button (poster mode)
- [ ] Edit task button (poster mode)
- [ ] Delete task button (poster mode)
- [ ] Increase budget button (poster mode)
- [ ] Cancel task button (with confirmation)
- [ ] Rate task button (after completion)
- [ ] Map displays correctly
- [ ] Google Maps link works
- [ ] Real-time updates via Socket.IO

## ✏️ Edit Task Modal
- [ ] All fields populate correctly
- [ ] Form validation works
- [ ] Map displays and is interactive
- [ ] "Use my current location" button works
- [ ] Re-alert option works
- [ ] Update confirmation modal works
- [ ] Task updates correctly
- [ ] Re-alert respects 3-hour cooldown

## 💰 Increase Budget Modal
- [ ] Current budget displays correctly
- [ ] New budget input validates correctly
- [ ] Confirmation works
- [ ] Budget updates correctly
- [ ] Re-alert option works

## 🗑️ Delete Task
- [ ] Confirmation modal appears
- [ ] Delete works correctly
- [ ] Redirect after deletion
- [ ] Error handling works

## 📱 Activity Page
- [ ] Tabs display correctly (based on user mode)
- [ ] Posted tasks show in poster mode
- [ ] Accepted tasks show in worker mode
- [ ] Completed tasks show correctly
- [ ] Cancelled tasks show correctly
- [ ] All tasks display (no deduplication issues)
- [ ] Task cards are clickable
- [ ] Empty states display correctly
- [ ] Filtering works correctly

## 🔔 Notifications & Alerts
- [ ] New task alert appears (Socket.IO)
- [ ] Alert only shows to online/idle workers
- [ ] Alert doesn't show to workers with active tasks
- [ ] Alert UI is responsive (full-screen mobile, side toast desktop)
- [ ] Alert auto-dismisses after 15 seconds
- [ ] Alert navigates to tasks page after 15 seconds
- [ ] "View & Accept Task" button works
- [ ] Alert progress bar animates

## 🔄 Socket.IO Real-time Features
- [ ] Connection establishes correctly
- [ ] Reconnection works on disconnect
- [ ] New task alerts broadcast correctly
- [ ] Task status updates in real-time
- [ ] Poster sees worker start task
- [ ] Poster sees completion button appear
- [ ] Worker sees task updates
- [ ] No duplicate alerts

## 👥 Worker Mode Features
- [ ] Toggle ON DUTY / OFF DUTY
- [ ] Available tasks show when ON DUTY
- [ ] Tasks hidden when OFF DUTY
- [ ] Can accept tasks
- [ ] Can start tasks
- [ ] Can complete tasks
- [ ] Can cancel accepted tasks (with confirmation)
- [ ] Earnings display correctly
- [ ] Rating display correctly

## 📮 Poster Mode Features
- [ ] Can post tasks
- [ ] Can edit tasks (OPEN/SEARCHING only)
- [ ] Can delete tasks (OPEN/SEARCHING only)
- [ ] Can increase budget (OPEN/SEARCHING only)
- [ ] Can cancel tasks (with confirmation)
- [ ] Can confirm completion
- [ ] Can rate workers
- [ ] Posted tasks count displays correctly

## 🎨 UI/UX Responsive Design
- [ ] Mobile (< 640px): All pages render correctly
- [ ] Tablet (640px - 1024px): All pages render correctly
- [ ] Desktop (> 1024px): All pages render correctly
- [ ] Side gaps consistent across pages
- [ ] Buttons have proper touch targets (min 44px)
- [ ] Text is readable on all screen sizes
- [ ] Images scale correctly
- [ ] Forms are usable on mobile
- [ ] Navigation works on all devices

## 🐛 Error Handling
- [ ] Network errors display user-friendly messages
- [ ] 401/403 errors redirect to login
- [ ] 404 errors handled gracefully
- [ ] Form validation errors display correctly
- [ ] API errors show in UI
- [ ] Socket.IO errors don't crash app
- [ ] Geolocation errors handled gracefully

## 🔧 Edge Cases
- [ ] User with no tasks (empty states)
- [ ] User with no completed tasks
- [ ] User with no ratings
- [ ] Task with no accepted worker
- [ ] Task cancelled by poster
- [ ] Task cancelled by worker
- [ ] Task cancelled by admin
- [ ] Multiple rapid clicks (debouncing)
- [ ] Form submission while loading
- [ ] Mode switch while task is active
- [ ] Location permission denied
- [ ] Slow network connection
- [ ] Offline mode behavior

## 🚀 Performance
- [ ] Page load times acceptable
- [ ] Images load efficiently
- [ ] No memory leaks
- [ ] Smooth scrolling
- [ ] Smooth animations
- [ ] No console errors
- [ ] No console warnings (except expected ones)

## 🔒 Security
- [ ] XSS protection (no script injection)
- [ ] CSRF protection
- [ ] Authentication tokens secure
- [ ] Admin routes protected
- [ ] User can only edit own tasks
- [ ] User can only cancel own tasks

## 📱 Admin Panel
- [ ] Overview stats display correctly
- [ ] Users list displays correctly
- [ ] Tasks list displays correctly
- [ ] Filters work correctly
- [ ] Pagination works correctly
- [ ] User detail page works
- [ ] Task detail page works
- [ ] Reports page works (if implemented)

## 🌐 Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## 📊 Analytics & Monitoring
- [ ] Error tracking works (if implemented)
- [ ] Analytics events fire (if implemented)
- [ ] Performance monitoring (if implemented)

---

## Testing Notes
- Test on real devices when possible
- Test with slow network (throttle in DevTools)
- Test with different user roles (worker, poster, admin)
- Test with different task statuses
- Test mode switching scenarios
- Test Socket.IO reconnection scenarios
