# 🚀 Quick Start Guide - Phase 4 Order Screens

## Prerequisites
- Backend server running on `http://localhost:5000` (or update API_URL in `services/api.ts`)
- Node.js and npm installed
- Expo CLI installed (`npm install -g expo-cli`)
- Expo Go app on your mobile device (or Android/iOS simulator)

---

## 🏃‍♂️ Start the App

### 1. Start Backend (Terminal 1)
```powershell
cd F:\BakeryApp\backend
npm run dev
```

Backend should start on port 5000.

### 2. Start Mobile App (Terminal 2)
```powershell
cd F:\BakeryApp\mobile
npm start
```

### 3. Update API URL
Open `mobile/services/api.ts` and update the API_URL:

```typescript
// For physical device on same network
const API_URL = 'http://YOUR_COMPUTER_IP:5000/api';

// For Android emulator
const API_URL = 'http://10.0.2.2:5000/api';

// For iOS simulator
const API_URL = 'http://localhost:5000/api';
```

To find your computer's IP:
```powershell
ipconfig
# Look for IPv4 Address under your active network adapter
```

### 4. Open on Device
- Scan QR code with Expo Go app (iOS) or Camera app (Android)
- Or press `a` for Android emulator, `i` for iOS simulator

---

## 🧪 Testing the Order Screens

### Test Scenario 1: Create New Order

1. **Login** with admin credentials:
   - Email: `admin@bakery.com`
   - Password: `adminpassword123`

2. **Navigate to Today's Orders**
   - You should see the orders tab/screen

3. **Create Order**:
   - Tap "+ New" button
   - Fill in customer details:
     - Name: "Sarah Johnson"
     - Phone: "+1-555-0123"
   - Select pickup date: Tomorrow
   - Select pickup time: 2:00 PM
   - Add items:
     - Item 1: "Chocolate Birthday Cake", Qty: 1, Price: 45.00
     - Item 2: "Cupcakes Box", Qty: 2, Price: 18.00
     - Tap "+ Add Item"
     - Item 3: "Croissants", Qty: 1, Price: 12.00
   - Select payment: ADVANCE
   - Advance amount: 40.00
   - Add note: "Please write Happy Birthday"
   - Verify total: $93.00, Balance: $53.00
   - Tap "Create Order"

4. **Verify Success**:
   - Should see success alert with order number (e.g., CL-2025-000001)
   - Tap OK to return to orders list
   - If pickup date is today, order should appear in the list

### Test Scenario 2: View Today's Orders

1. **Navigate to Today's Orders screen**
2. **Check Statistics Bar**:
   - Total count
   - Pending count (orange)
   - Ready count (green)
   - Done count (blue)
3. **View Order Cards**:
   - Order number displayed
   - Customer name and phone
   - Pickup time
   - Items count
   - Total amount
   - Payment status badge
   - Status badge (color-coded)
4. **Pull to Refresh**:
   - Pull down on the list
   - Should reload orders
5. **Tap Order Card**:
   - Should navigate to order detail

### Test Scenario 3: Manage Order Status

1. **Open an order** from today's list (PENDING status)
2. **View Details**:
   - Verify all information is displayed
   - Customer info, pickup details
   - Items list with prices
   - Payment breakdown
3. **Mark as Ready**:
   - Tap "✅ Mark as Ready" button
   - Tap "Confirm" in dialog
   - Should see success message
   - Status badge changes to READY (green)
4. **Mark as Completed**:
   - Tap "🎉 Mark as Completed" button
   - Tap "Confirm"
   - Status changes to COMPLETED (blue)
   - Action buttons should disappear

### Test Scenario 4: Edit Order

1. **Open a PENDING order**
2. **Tap "✏️ Edit Order"**
3. **Modify Details**:
   - Change customer name
   - Update pickup time
   - Modify item quantities
   - Add another item
   - Change payment status to PAID
4. **Verify Real-time Updates**:
   - Total should recalculate
   - Balance should update
5. **Save Changes**:
   - Tap "Save Changes"
   - Should see success message
   - Return to detail view
   - Verify changes persisted

### Test Scenario 5: Cancel Order

1. **Open a PENDING order**
2. **Tap "❌ Cancel Order"**
3. **Confirm Cancellation**:
   - Should see warning dialog
   - Tap "Confirm"
4. **Verify**:
   - Status changes to CANCELLED (red)
   - All action buttons disappear
   - Order remains viewable but not editable

---

## 🐛 Troubleshooting

### Issue: Can't connect to backend
**Solution**: 
- Verify backend is running on port 5000
- Check API_URL matches your computer's IP
- Ensure mobile device is on same WiFi network
- Try pinging the backend from your device

### Issue: Orders not loading
**Solution**:
- Check if you're logged in (valid JWT token)
- Open browser dev tools and check network requests
- Verify date filter is correct (YYYY-MM-DD format)
- Check backend logs for errors

### Issue: Form validation errors
**Solution**:
- All required fields must be filled
- Item quantity must be at least 1
- Unit price must be greater than 0
- At least one item required
- Customer name and phone required

### Issue: Date picker not showing
**Solution**:
- On iOS: Tap the date field, picker appears inline
- On Android: Native dialog should open
- Ensure @react-native-community/datetimepicker is installed

### Issue: TypeScript errors
**Solution**:
```powershell
cd F:\BakeryApp\mobile
npm install
npx tsc --noEmit
```

---

## 📱 Screen Flow Diagram

```
Login
  ↓
Today's Orders (Home)
  ├─→ [+ New] → Add Order → [Create] → Success → Back
  └─→ [Order Card] → Order Detail
                       ├─→ [Edit] → Edit Order → [Save] → Back
                       ├─→ [Mark Ready] → Confirm → Updated
                       ├─→ [Mark Completed] → Confirm → Updated
                       └─→ [Cancel] → Confirm → Updated
```

---

## 🎯 Key Navigation Paths

### Path to Create Order
```
Today's Orders → "+ New" → Add Order Screen
```

### Path to Edit Order
```
Today's Orders → [Order Card] → Order Detail → "Edit Order" → Edit Order Screen
```

### Path to Change Status
```
Today's Orders → [Order Card] → Order Detail → [Status Button] → Confirm
```

---

## 📊 Expected Data Format

### Order Card Display
```
CL-2025-000001          [PENDING]
Sarah Johnson
📞 +1-555-0123
🕐 2:00 PM
📦 3 items
📝 Please write Happy Birthday
[ADVANCE]               $93.00
```

### Order Detail Display
```
← Back                  [PENDING]

CL-2025-000001
Created: Mon, Nov 20, 2025

Customer Information
Name: Sarah Johnson
Phone: +1-555-0123

Pickup Details
Date: Tue, Nov 21, 2025
Time: 2:00 PM

Order Items
Chocolate Birthday Cake
Qty: 1 × $45.00        $45.00

Cupcakes Box
Qty: 2 × $18.00        $36.00

Croissants
Qty: 1 × $12.00        $12.00

Payment Information
Status: [ADVANCE]
Total Amount: $93.00
Advance Paid: $40.00
Balance Due: $53.00

Notes
Please write Happy Birthday

Created By
Admin User

Actions
[✏️ Edit Order]
[✅ Mark as Ready]
[❌ Cancel Order]
```

---

## 💡 Tips for Testing

1. **Create multiple orders** with different dates to test filtering
2. **Test edge cases**: 
   - Single item orders
   - Large quantity orders
   - Different payment statuses
3. **Test status transitions**: PENDING → READY → COMPLETED
4. **Test editing**: Modify all fields to ensure updates work
5. **Test cancellation**: Ensure cancelled orders can't be edited
6. **Test refresh**: Pull down on orders list to reload
7. **Test navigation**: Back button should work from all screens
8. **Test validation**: Try submitting invalid forms

---

## 🎨 Visual Verification

### Colors Should Match
- **PENDING**: Orange badges and text
- **READY**: Green badges and text
- **COMPLETED**: Blue badges and text
- **CANCELLED**: Red badges and text
- **PAID**: Green payment badge
- **ADVANCE**: Orange payment badge
- **UNPAID**: Red payment badge

### Layout Should Be
- Clean card-based design
- Clear section separations
- Easy-to-read text hierarchy
- Comfortable tap targets (minimum 44x44 points)
- Proper spacing between elements

---

## ✅ Success Criteria

You've successfully set up Phase 4 when:

- [x] Can create new orders with multiple items
- [x] Orders appear in today's list immediately
- [x] Can view complete order details
- [x] Can edit existing orders
- [x] Can change order status (Ready, Completed, Cancel)
- [x] Real-time total calculations work
- [x] Form validation prevents invalid submissions
- [x] Pull to refresh reloads data
- [x] Statistics bar shows correct counts
- [x] All navigation flows work smoothly
- [x] No TypeScript errors
- [x] Responsive and smooth user experience

---

## 🎉 You're Ready!

The bakery app is now fully functional for daily operations:
- ✅ Take orders at the counter
- ✅ Track order status
- ✅ Manage pickups
- ✅ Handle payments
- ✅ Edit order details

**Start taking orders!** 🍰📱
