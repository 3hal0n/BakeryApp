# Phase 3 - Orders Core System API Documentation

## Overview
Complete implementation of the Orders Core System backend with full CRUD operations, date filtering, status management, and automatic total calculation.

---

## Endpoints

### 1. POST /api/orders
**Create a new order**

**Authentication:** Required (JWT Bearer token)

**Request Body:**
```json
{
  "customer": {
    "name": "John Doe",
    "phone": "+1234567890"
  },
  "pickupAt": "2025-11-20T14:00:00Z",
  "items": [
    {
      "itemName": "Chocolate Cake",
      "qty": 2,
      "unitPrice": 25.50
    },
    {
      "itemName": "Croissant Box",
      "qty": 1,
      "unitPrice": 15.00
    }
  ],
  "payment": {
    "status": "ADVANCE",
    "advanceAmount": 30.00
  },
  "notes": "Please add birthday candles"
}
```

**Response:** `201 Created`
```json
{
  "orderId": "uuid",
  "orderNo": "CL-2025-000001",
  "status": "PENDING",
  "totalAmount": "66.00"
}
```

**Features:**
- ✅ Auto-generates order number (format: `CL-YYYY-NNNNNN`)
- ✅ Calculates total amount from items
- ✅ Creates order items with subtotals
- ✅ Records initial status history
- ✅ Validates all input with Zod schemas
- ✅ Transaction-safe (all-or-nothing)

---

### 2. GET /api/orders
**Retrieve orders with filtering**

**Authentication:** Required

**Query Parameters:**
- `date` (string, ISO date): Filter by specific date (e.g., `2025-11-20`)
- `from` (string, ISO datetime): Start of date range
- `to` (string, ISO datetime): End of date range
- `status` (string or array): Filter by order status (`PENDING`, `READY`, `COMPLETED`, `CANCELLED`)
- `payment` (string or array): Filter by payment status (`PAID`, `ADVANCE`, `UNPAID`)
- `cashier_id` (string): Filter by creator user ID
- `q` (string): Search by customer name or phone (case-insensitive)

**Examples:**
```bash
# Today's orders
GET /api/orders?date=2025-11-19

# Tomorrow's orders
GET /api/orders?date=2025-11-20

# Date range
GET /api/orders?from=2025-11-19T00:00:00Z&to=2025-11-21T23:59:59Z

# Pending orders only
GET /api/orders?status=PENDING

# Multiple statuses
GET /api/orders?status=PENDING&status=READY

# Search customer
GET /api/orders?q=John

# Combined filters
GET /api/orders?date=2025-11-20&status=PENDING&payment=UNPAID
```

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "orderNo": "CL-2025-000001",
    "customerName": "John Doe",
    "customerPhone": "+1234567890",
    "pickupAt": "2025-11-20T14:00:00Z",
    "status": "PENDING",
    "paymentStatus": "ADVANCE",
    "advanceAmount": "30.00",
    "totalAmount": "66.00",
    "notes": "Please add birthday candles",
    "createdBy": "uuid",
    "createdAt": "2025-11-19T10:00:00Z",
    "updatedAt": "2025-11-19T10:00:00Z",
    "items": [
      {
        "id": "uuid",
        "orderId": "uuid",
        "itemName": "Chocolate Cake",
        "qty": 2,
        "unitPrice": "25.50",
        "subtotal": "51.00"
      },
      {
        "id": "uuid",
        "orderId": "uuid",
        "itemName": "Croissant Box",
        "qty": 1,
        "unitPrice": "15.00",
        "subtotal": "15.00"
      }
    ],
    "creator": {
      "name": "Admin User"
    }
  }
]
```

---

### 3. GET /api/orders/this-week
**Retrieve all orders for the current week**

**Authentication:** Required

**Response:** `200 OK`
- Returns all orders with `pickupAt` between Monday and Sunday of current week
- Same response format as `GET /api/orders`
- Sorted by `pickupAt` ascending

---

### 4. GET /api/orders/:id
**Retrieve a single order with full details**

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "orderNo": "CL-2025-000001",
  "customerName": "John Doe",
  "customerPhone": "+1234567890",
  "pickupAt": "2025-11-20T14:00:00Z",
  "status": "PENDING",
  "paymentStatus": "ADVANCE",
  "advanceAmount": "30.00",
  "totalAmount": "66.00",
  "notes": "Please add birthday candles",
  "createdBy": "uuid",
  "createdAt": "2025-11-19T10:00:00Z",
  "updatedAt": "2025-11-19T10:00:00Z",
  "items": [
    {
      "id": "uuid",
      "orderId": "uuid",
      "itemName": "Chocolate Cake",
      "qty": 2,
      "unitPrice": "25.50",
      "subtotal": "51.00"
    }
  ],
  "creator": {
    "name": "Admin User",
    "email": "admin@bakery.com"
  },
  "statusHistory": [
    {
      "id": "uuid",
      "orderId": "uuid",
      "fromStatus": "PENDING",
      "toStatus": "PENDING",
      "changedBy": "uuid",
      "changedAt": "2025-11-19T10:00:00Z",
      "user": {
        "name": "Admin User"
      }
    }
  ],
  "payments": []
}
```

**Error Response:** `404 Not Found`
```json
{
  "error": "Order not found"
}
```

---

### 5. PATCH /api/orders/:id
**Update an existing order**

**Authentication:** Required

**Request Body:** (all fields optional)
```json
{
  "customer": {
    "name": "Jane Doe",
    "phone": "+9876543210"
  },
  "pickupAt": "2025-11-21T15:00:00Z",
  "items": [
    {
      "itemName": "Vanilla Cake",
      "qty": 1,
      "unitPrice": 30.00
    }
  ],
  "payment": {
    "status": "PAID",
    "advanceAmount": 0
  },
  "notes": "Updated notes"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "orderNo": "CL-2025-000001",
  "customerName": "Jane Doe",
  "customerPhone": "+9876543210",
  "pickupAt": "2025-11-21T15:00:00Z",
  "status": "PENDING",
  "paymentStatus": "PAID",
  "advanceAmount": "0.00",
  "totalAmount": "30.00",
  "notes": "Updated notes",
  "createdBy": "uuid",
  "createdAt": "2025-11-19T10:00:00Z",
  "updatedAt": "2025-11-19T11:00:00Z",
  "items": [
    {
      "id": "uuid-new",
      "orderId": "uuid",
      "itemName": "Vanilla Cake",
      "qty": 1,
      "unitPrice": "30.00",
      "subtotal": "30.00"
    }
  ],
  "creator": {
    "name": "Admin User"
  }
}
```

**Features:**
- ✅ Partial updates supported (only send fields to change)
- ✅ Items are replaced entirely if provided (old items deleted)
- ✅ Total amount recalculated automatically when items change
- ✅ Transaction-safe updates
- ✅ Returns updated order with items

**Error Responses:**
- `400 Bad Request` - Validation error
- `404 Not Found` - Order not found

---

### 6. POST /api/orders/:id/status
**Update order status**

**Authentication:** Required

**Request Body:**
```json
{
  "to": "READY"
}
```

**Allowed status transitions:**
- `PENDING` → `READY`
- `PENDING` → `CANCELLED`
- `READY` → `COMPLETED`
- `READY` → `CANCELLED`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "orderNo": "CL-2025-000001",
  "customerName": "John Doe",
  "customerPhone": "+1234567890",
  "pickupAt": "2025-11-20T14:00:00Z",
  "status": "READY",
  "paymentStatus": "ADVANCE",
  "advanceAmount": "30.00",
  "totalAmount": "66.00",
  "notes": "Please add birthday candles",
  "createdBy": "uuid",
  "createdAt": "2025-11-19T10:00:00Z",
  "updatedAt": "2025-11-19T12:00:00Z"
}
```

**Features:**
- ✅ Records status change in `order_status_history` table
- ✅ Tracks who made the change and when
- ✅ Transaction-safe status update

---

## Data Models

### Order
```typescript
{
  id: string;              // UUID
  orderNo: string;         // CL-YYYY-NNNNNN (unique)
  customerName: string;
  customerPhone: string;
  pickupAt: DateTime;
  status: OrderStatus;     // PENDING | READY | COMPLETED | CANCELLED
  paymentStatus: PaymentStatus; // PAID | ADVANCE | UNPAID
  advanceAmount: Decimal;  // Default: 0
  totalAmount: Decimal;    // Calculated from items
  notes?: string;
  createdBy: string;       // User ID
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

### OrderItem
```typescript
{
  id: string;              // UUID
  orderId: string;
  itemName: string;
  qty: number;             // Integer, positive
  unitPrice: Decimal;
  subtotal: Decimal;       // qty × unitPrice
}
```

### OrderStatusHistory
```typescript
{
  id: string;
  orderId: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  changedBy: string;       // User ID
  changedAt: DateTime;
}
```

---

## Technical Implementation

### Automatic Total Calculation
```typescript
// In OrderService.createOrder()
const totalAmount = data.items.reduce((sum, item) => {
  return sum + (item.qty * item.unitPrice);
}, 0);
```

### Order Number Generation
```typescript
// Format: CL-YYYY-NNNNNN
static async generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.order.count({
    where: { orderNo: { startsWith: `CL-${year}-` } }
  });
  return `CL-${year}-${String(count + 1).padStart(6, '0')}`;
}
```

### Date Filtering
```typescript
// Single date (Today/Tomorrow)
if (date) {
  const startOfDay = new Date(`${date}T00:00:00`);
  const endOfDay = new Date(`${date}T23:59:59`);
  dateFilter = {
    pickupAt: { gte: startOfDay, lte: endOfDay }
  };
}

// Date range
if (from && to) {
  dateFilter = {
    pickupAt: { gte: new Date(from), lte: new Date(to) }
  };
}
```

### Transaction Safety
All write operations use Prisma transactions:
```typescript
return prisma.$transaction(async (tx) => {
  // Multiple database operations
  // Either all succeed or all rollback
});
```

---

## Database Indexes

Optimized for common query patterns:
- `pickupAt` - Fast date filtering
- `status` - Quick status lookups
- `paymentStatus` - Payment filtering
- `(pickupAt, status)` - Composite index for combined queries
- `orderId` on order_items - Fast item lookups

---

## Validation Rules

### Create Order
- ✅ Customer name required, min 1 char
- ✅ Customer phone required, min 1 char
- ✅ Pickup date must be valid ISO datetime
- ✅ At least 1 item required
- ✅ Item name required, min 1 char
- ✅ Quantity must be positive integer
- ✅ Unit price must be positive number
- ✅ Payment status must be PAID, ADVANCE, or UNPAID
- ✅ Advance amount must be ≥ 0 (defaults to 0)

### Update Order
- ✅ All fields optional
- ✅ Same validation rules as create for provided fields

### Update Status
- ✅ Status must be READY, COMPLETED, or CANCELLED

---

## Testing Checklist

- [x] POST /orders creates order with auto-generated number
- [x] POST /orders calculates total correctly
- [x] POST /orders creates items and status history
- [x] GET /orders?date=YYYY-MM-DD filters by date
- [x] GET /orders supports multiple filters
- [x] GET /orders/:id returns full order details
- [x] GET /orders/:id returns 404 for invalid ID
- [x] PATCH /orders/:id updates customer info
- [x] PATCH /orders/:id updates items and recalculates total
- [x] PATCH /orders/:id supports partial updates
- [x] POST /orders/:id/status updates status and logs history
- [x] TypeScript compilation succeeds
- [x] Zod validation works for all endpoints

---

## Next Steps (Phase 4+)

1. **Payment Recording** - POST /orders/:id/payments
2. **Reports** - Daily/weekly revenue, popular items
3. **Notifications** - WhatsApp reminders for pickups
4. **Mobile App Integration** - Update API client
5. **Real-time Updates** - WebSocket for order status changes

---

## Summary

✅ **Completed Phase 3 Requirements:**
1. ✅ POST /orders - Create order with items and auto-calculation
2. ✅ GET /orders?date=... - Filter by Today/Tomorrow
3. ✅ GET /orders/:id - Retrieve single order with full details
4. ✅ PATCH /orders/:id - Update order with item replacement
5. ✅ POST /orders/:id/status - Change order status
6. ✅ Order items table with subtotals
7. ✅ Automatic total computation
8. ✅ Transaction safety for all operations
9. ✅ Comprehensive validation
10. ✅ Status history tracking

**All endpoints tested and TypeScript compilation successful!** 🎉
