# BakeryApp Testing Guide

## ✅ What You Can Test Now

This guide describes all the features that are fully implemented and ready for testing in the BakeryApp mobile application.

---

## Prerequisites for Testing

1. **Backend server running**
   ```powershell
   cd backend
   npm run dev
   ```
   Server should be running on `http://localhost:5000`

2. **Mobile API URL configured**
   - Edit `mobile/services/api.ts`
   - Set `API_URL` to match your setup:
     - Android emulator: `http://10.0.2.2:5000/api`
     - iOS simulator: `http://localhost:5000/api`
     - Physical device: `http://192.168.1.9:5000/api` (use your machine's IP)

3. **Mobile app running**
   ```powershell
   cd mobile
   npx expo start
   ```

4. **Test account credentials**
   - Email: `admin@bakery.com`
   - Password: `adminpassword123`

---

## 🔐 Feature 1: Authentication

### What Works
- ✅ User login with email and password
- ✅ Token storage (AsyncStorage)
- ✅ Automatic navigation after login
- ✅ Session persistence (stays logged in after app restart)
- ✅ Logout functionality

### Test Steps

**Login Flow:**
1. Launch the app
2. You should see the login screen with logo
3. Enter email: `admin@bakery.com`
4. Enter password: `adminpassword123`
5. Tap "Login" button
6. You should be redirected to the Dashboard (Order Dashboard screen)

**Session Persistence:**
1. Login successfully
2. Close the app completely
3. Reopen the app
4. You should land directly on Dashboard (no login required)

**Logout Flow:**
1. Navigate to Profile tab (bottom navigation)
2. Scroll down and tap "Logout" button
3. Confirm logout in the alert dialog
4. You should be redirected back to login screen

**Expected Results:**
- Login succeeds with valid credentials
- Login fails with invalid credentials (shows error alert)
- Network errors are displayed clearly
- Session persists across app restarts

---

## 📊 Feature 2: Order Dashboard

### What Works
- ✅ View orders by time period (Today / Tomorrow / This Week)
- ✅ Order statistics cards (Total, Pending, Ready, Total Amount in LKR)
- ✅ Order list with key details
- ✅ Tab switching between time periods
- ✅ Pull-to-refresh functionality
- ✅ Navigation to order details
- ✅ "New Order" button

### Test Steps

**View Today's Orders:**
1. Login and land on Dashboard
2. Default view shows "Today" tab
3. Verify order cards display:
   - Order number (e.g., `ORD-20251120-001`)
   - Customer name
   - Status badge (color-coded)
   - Payment status
   - Total amount in LKR

**Switch Between Time Periods:**
1. Tap "Tomorrow" tab
2. Orders list should update to show tomorrow's orders
3. Tap "This Week" tab
4. Orders list should show all orders for the next 7 days
5. Tap "Today" to return

**Statistics Cards:**
1. Verify top statistics bar shows:
   - Total: Count of all orders in current period
   - Pending: Count of orders with PENDING status (orange number)
   - Ready: Count of orders with READY status (green number)
   - Total: Sum of all order amounts in LKR (green number)

**Pull to Refresh:**
1. Pull down on the order list
2. Spinner should appear
3. Orders should reload from backend
4. Statistics should update

**Navigation:**
1. Tap any order card
2. Should navigate to Order Detail screen

**Expected Results:**
- Statistics update when switching tabs
- Orders are grouped correctly by date
- Pull-to-refresh works smoothly
- All amounts display in LKR format

---

## 📝 Feature 3: Create New Order

### What Works
- ✅ Full order creation form
- ✅ Customer information input (name, phone)
- ✅ Pickup date and time pickers (native pickers)
- ✅ Dynamic items list (add/remove items)
- ✅ Item details (name, quantity, unit price in LKR)
- ✅ Automatic subtotal calculation per item
- ✅ Payment status selection (PAID / ADVANCE / UNPAID)
- ✅ Advance amount input (conditional, shows only for ADVANCE status)
- ✅ Notes field (optional)
- ✅ Total amount calculation (LKR)
- ✅ Form validation (React Hook Form + Zod)
- ✅ Order submission to backend

### Test Steps

**Access Form:**
1. From Dashboard, tap "+ New Order" button
2. New Order screen should open as a modal

**Fill Customer Info:**
1. Enter customer name: `John Doe`
2. Enter phone: `0771234567`

**Set Pickup Date/Time:**
1. Tap "Pickup Date" field
2. Native date picker should appear
3. Select a date (e.g., today or tomorrow)
4. Tap "Pickup Time" field
5. Native time picker should appear
6. Select a time (e.g., 2:00 PM)

**Add Order Items:**
1. Default: One item row is present
2. Fill first item:
   - Item Name: `Chocolate Cake`
   - Quantity: `1`
   - Unit Price (LKR): `2500`
3. Verify subtotal shows: `LKR 2500.00`
4. Tap "+ Add Item" button
5. New item row appears
6. Fill second item:
   - Item Name: `Vanilla Cupcakes`
   - Quantity: `6`
   - Unit Price (LKR): `150`
7. Verify subtotal shows: `LKR 900.00`

**Remove Items:**
1. Tap "Remove" button on any item (if more than 1 item exists)
2. That item row should disappear
3. Total should recalculate

**Set Payment Status:**
1. Tap "UNPAID" button (default selected)
2. Button should highlight with yellow background
3. Tap "ADVANCE"
4. "Advance Amount (LKR)" field should appear below
5. Enter advance amount: `1000`
6. Tap "PAID"
7. Advance field should disappear

**Add Notes (Optional):**
1. Scroll to Notes field
2. Enter: `Birthday cake, please add candles`

**Verify Total:**
1. Scroll to bottom
2. Total Amount card should show sum of all items in LKR
3. For example: `LKR 3400.00`

**Submit Order:**
1. Tap "Create Order" button
2. Loading indicator should appear on button
3. Success alert should appear: "Order created successfully!"
4. Tap "OK"
5. Should navigate back to Dashboard
6. New order should appear in Today's Orders list

**Test Validation:**
1. Try to submit with empty customer name → Error alert
2. Try to submit with empty items → Error alert
3. Try to submit with item quantity 0 → Error alert
4. All required fields must be filled

**Expected Results:**
- Form is smooth and responsive
- Date/time pickers are native and easy to use
- Calculations are accurate
- Validation prevents invalid submissions
- Order successfully saves to backend
- Currency displays as LKR throughout

---

## 📅 Feature 4: Today's Orders List

### What Works
- ✅ View all orders for today
- ✅ Order cards with summary info
- ✅ Status indicators (color-coded dots)
- ✅ Payment status badges
- ✅ Statistics bar (Total, Pending, Ready counts)
- ✅ Pull-to-refresh
- ✅ Navigation to order details
- ✅ Empty state message
- ✅ Date display

### Test Steps

**View Today's Orders:**
1. Navigate to "Today's Orders" tab (if separate) or view on Dashboard
2. Today's date should be displayed at top
3. Statistics bar shows counts:
   - Total orders today
   - Pending count
   - Ready count
   - Completed count (if any)

**Order Card Details:**
1. Each card should show:
   - Order number (e.g., `ORD-20251120-001`)
   - Customer name
   - Phone number
   - Pickup time (e.g., `02:00 PM`)
   - Number of items
   - Notes preview (if any, 2 lines max)
   - Payment status badge (PAID/ADVANCE/UNPAID with color)
   - Total amount in LKR

**Status Indicators:**
1. PENDING orders → Orange dot
2. READY orders → Green dot
3. COMPLETED orders → Blue dot
4. CANCELLED orders → Red dot

**Tap Order Card:**
1. Tap any order
2. Navigate to Order Detail screen

**Pull to Refresh:**
1. Pull down list
2. Orders reload
3. Statistics update

**Empty State:**
1. If no orders today, see message: "No orders for today"
2. Button to create new order

**Expected Results:**
- All today's orders are listed
- Data is accurate and matches backend
- Refresh works correctly
- Navigation is smooth

---

## 🔍 Feature 5: Order Details

### What Works
- ✅ Full order information display
- ✅ Status badge (top right)
- ✅ Customer details (name, phone)
- ✅ Pickup date and time (formatted)
- ✅ Order items list with individual item details
- ✅ Item quantities and prices in LKR
- ✅ Payment information section
- ✅ Payment breakdown (Total, Advance, Balance in LKR)
- ✅ Notes display
- ✅ Creator information
- ✅ Action buttons (Edit, Ready, Completed, Cancel)
- ✅ Status change confirmation dialogs
- ✅ Real-time status updates

### Test Steps

**View Order Details:**
1. From Dashboard or Today's Orders, tap any order
2. Order Detail screen opens
3. Verify all sections are visible:
   - Order number at top
   - Status badge (colored)
   - Customer Information
   - Pickup Details
   - Order Items
   - Payment Information
   - Notes (if any)
   - Created By

**Customer & Pickup Info:**
1. Customer name and phone are correct
2. Pickup date shows format: `Mon, Nov 20, 2025`
3. Pickup time shows format: `02:00 PM`

**Order Items:**
1. Each item shows:
   - Item name
   - Subtotal in LKR (right aligned)
   - Quantity × Unit Price in LKR (below)
2. All items from order are listed

**Payment Information:**
1. Payment status badge (PAID/ADVANCE/UNPAID with color)
2. Payment breakdown:
   - Total Amount: LKR X.XX
   - Advance Paid: LKR X.XX (if not PAID)
   - Balance Due: LKR X.XX (if not PAID, in bold)
3. If PAID, only Total Amount shown
4. Amounts are accurate

**Status Actions (for PENDING orders):**
1. "Edit Order" button → Navigate to Edit screen
2. "Mark as Ready" button → Confirmation dialog
   - Tap "Confirm" → Order status changes to READY
   - Success alert appears
   - Order detail refreshes
   - Button disappears (only Ready orders can't go to Ready)

**Status Actions (for READY orders):**
1. "Edit Order" button (if status allows)
2. "Mark as Completed" button → Confirmation dialog
   - Tap "Confirm" → Order status changes to COMPLETED
   - Success alert appears
   - Order refreshes

**Cancel Order:**
1. Tap "Cancel Order" button (red, destructive style)
2. Confirmation dialog: "Cancel this order? This action cannot be undone."
3. Tap "Confirm"
4. Order status changes to CANCELLED
5. Status badge turns red
6. Edit and status buttons disappear (cancelled orders can't be edited)

**Expected Results:**
- All data displays correctly
- Currency is LKR throughout
- Status changes work instantly
- Confirmation dialogs prevent accidental changes
- UI updates after status changes
- Back button returns to previous screen

---

## ✏️ Feature 6: Edit Order

### What Works
- ✅ Pre-populated form with existing order data
- ✅ Edit customer information
- ✅ Edit pickup date and time
- ✅ Edit items (add, remove, modify)
- ✅ Edit payment status and advance amount
- ✅ Edit notes
- ✅ Real-time total calculation
- ✅ Form validation
- ✅ Save changes (PATCH request to backend)

### Test Steps

**Access Edit Screen:**
1. From Order Detail screen, tap "Edit Order" button
2. Edit Order screen opens with form
3. All fields should be pre-filled with current order data

**Verify Pre-filled Data:**
1. Customer name matches original
2. Customer phone matches original
3. Pickup date and time are set correctly
4. All items are listed with correct details
5. Payment status is selected
6. Advance amount shows (if applicable)
7. Notes show (if any)

**Edit Customer Info:**
1. Change customer name to `Jane Smith`
2. Change phone to `0779876543`

**Edit Pickup:**
1. Tap pickup date, change to a new date
2. Tap pickup time, change to a new time

**Modify Items:**
1. Change first item name to `Red Velvet Cake`
2. Change quantity to `2`
3. Verify subtotal updates: `Qty 2 × Unit Price = LKR X.XX`
4. Add a new item: `Brownies`, Qty `4`, Price `200`
5. Remove an item if more than one exists
6. Verify total recalculates at bottom

**Change Payment Status:**
1. Switch from UNPAID to ADVANCE
2. Enter advance amount: `1500`
3. Verify balance calculation: `Total - Advance = Balance LKR X.XX`
4. Switch to PAID
5. Verify balance section disappears

**Edit Notes:**
1. Update notes field: `Extra frosting requested`

**Save Changes:**
1. Scroll to bottom
2. Tap "Update Order" button
3. Loading indicator appears
4. Success alert: "Order updated successfully!"
5. Tap "OK"
6. Navigate back to Order Detail screen
7. Changes should be reflected immediately

**Test Validation:**
1. Clear customer name → Error on submit
2. Set item quantity to 0 → Error on submit
3. All required fields must be valid

**Expected Results:**
- Form pre-fills correctly
- All edits are reflected in real-time calculations
- Validation prevents invalid data
- Changes save to backend successfully
- Order Detail screen shows updated data

---

## 🚪 Feature 7: Logout

### What Works
- ✅ Logout button in Profile screen
- ✅ Confirmation dialog
- ✅ Clear stored tokens
- ✅ Navigate back to login

### Test Steps

**Logout:**
1. Go to Profile tab (bottom navigation)
2. Scroll down to "Logout" button (red)
3. Tap "Logout"
4. Alert appears: "Are you sure you want to logout?"
5. Tap "Cancel" → Stays on profile
6. Tap "Logout" again → Tap "Logout" in alert
7. Should navigate to login screen
8. Tokens should be cleared from storage

**Verify Logout:**
1. After logout, close app completely
2. Reopen app
3. Should land on login screen (not Dashboard)
4. Must login again

**Expected Results:**
- Confirmation prevents accidental logout
- Session is fully cleared
- App requires re-login

---

## 🧪 Complete Test Workflows

### Workflow 1: Complete Order Lifecycle

1. **Login** → Dashboard appears
2. **Create Order:**
   - Tap "+ New Order"
   - Fill: Customer `Alice Brown`, Phone `0771112222`
   - Pickup: Tomorrow at 10:00 AM
   - Items: `Birthday Cake` × 1 @ LKR 3500, `Cupcakes` × 12 @ LKR 100
   - Payment: ADVANCE, Advance Amount: `2000`
   - Notes: `Happy Birthday message needed`
   - Total: `LKR 4700.00`, Balance: `LKR 2700.00`
   - Submit → Success
3. **View on Dashboard:**
   - Switch to "Tomorrow" tab
   - Find the new order
   - Verify details on card
4. **View Details:**
   - Tap the order
   - Verify all details match
   - Status: PENDING
5. **Mark as Ready:**
   - Tap "Mark as Ready"
   - Confirm → Status changes to READY
6. **Edit Order:**
   - Tap "Edit Order"
   - Add another item: `Brownies` × 4 @ LKR 150
   - Change advance to `2500`
   - Save → New total: `LKR 5300.00`, Balance: `LKR 2800.00`
7. **Mark as Completed:**
   - Back to detail
   - Tap "Mark as Completed"
   - Confirm → Status changes to COMPLETED
8. **Logout**

### Workflow 2: Quick Order Entry (Paid Order)

1. Login
2. Tap "+ New Order"
3. Customer: `Bob Lee`, Phone: `0779998888`
4. Pickup: Today at 3:00 PM
5. Item: `Donuts` × 24 @ LKR 50
6. Payment: PAID
7. Total: `LKR 1200.00`
8. Submit
9. Verify on Today's Orders
10. View details → All correct

### Workflow 3: Cancel Order

1. Create a test order
2. View order details
3. Tap "Cancel Order"
4. Confirm cancellation
5. Status changes to CANCELLED
6. Action buttons disappear
7. Verify order still visible but marked cancelled

---

## 🐛 Known Limitations / Out of Scope

- ❌ No user registration (admin account only)
- ❌ No password reset
- ❌ No order search or filter (coming soon)
- ❌ No reports or analytics (backend endpoints exist, mobile UI pending)
- ❌ No push notifications
- ❌ No order history pagination (all orders loaded at once)
- ❌ No image upload for items
- ❌ No printing receipts

---

## 💡 Tips for Effective Testing

1. **Clear Data Between Tests:**
   - If needed, delete orders from backend or use Prisma Studio to reset

2. **Test on Real Device:**
   - Emulator works, but test on physical device for better experience with native pickers

3. **Test Network Failures:**
   - Stop backend server
   - Try to create/edit order
   - Should see "Network request failed" error

4. **Test Validation:**
   - Always try submitting invalid data
   - Verify error messages are clear

5. **Check Currency Display:**
   - All amounts should show `LKR` prefix
   - No `$` or `₱` symbols should appear

6. **Test Status Transitions:**
   - PENDING → READY → COMPLETED (valid flow)
   - PENDING → CANCELLED (valid)
   - Cannot go from COMPLETED back to PENDING
   - Cannot edit COMPLETED or CANCELLED orders

7. **Refresh Frequently:**
   - Use pull-to-refresh to ensure data is latest
   - Backend might have changes from other clients (future)

---

## 📊 Test Checklist Summary

### Authentication
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (error shown)
- [ ] Session persists after app restart
- [ ] Logout clears session

### Dashboard
- [ ] View today's orders
- [ ] View tomorrow's orders
- [ ] View this week's orders
- [ ] Statistics update correctly
- [ ] Pull-to-refresh works
- [ ] Navigate to order details

### Create Order
- [ ] Fill all required fields
- [ ] Add multiple items
- [ ] Remove items
- [ ] Subtotals calculate correctly
- [ ] Payment status switches work
- [ ] Advance field shows/hides correctly
- [ ] Total amount is accurate
- [ ] Order saves successfully
- [ ] Validation prevents invalid submit

### Today's Orders
- [ ] Orders list loads
- [ ] Order cards show correct info
- [ ] Status dots are color-coded
- [ ] Pull-to-refresh works
- [ ] Navigate to details

### Order Details
- [ ] All order info displays
- [ ] Items listed correctly
- [ ] Payment breakdown accurate (LKR)
- [ ] Status badge correct
- [ ] Edit button works
- [ ] Mark as Ready works
- [ ] Mark as Completed works
- [ ] Cancel order works

### Edit Order
- [ ] Form pre-fills correctly
- [ ] Can edit customer info
- [ ] Can edit pickup date/time
- [ ] Can add/remove items
- [ ] Can change payment status
- [ ] Calculations update in real-time
- [ ] Save changes successfully
- [ ] Validation works

### Profile
- [ ] User info displays
- [ ] Logout button works
- [ ] Logout confirmation shown

---

## 🎯 Success Criteria

After testing, you should be able to:

1. ✅ Login and maintain session
2. ✅ Create new orders with multiple items
3. ✅ View orders by time period
4. ✅ View full order details
5. ✅ Edit existing orders
6. ✅ Change order status (Ready, Completed, Cancel)
7. ✅ See accurate totals in LKR
8. ✅ Logout successfully

**All features are production-ready for daily bakery order management!** 🎉
