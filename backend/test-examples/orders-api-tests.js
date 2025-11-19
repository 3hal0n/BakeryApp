// Phase 3 Orders API Test Examples
// Use with REST client (Postman, Thunder Client, curl, etc.)

const API_BASE = 'http://localhost:5000/api';
const AUTH_TOKEN = 'your-jwt-token-here'; // Get from POST /api/auth/login

// Headers for authenticated requests
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${AUTH_TOKEN}`
};

// ============================================================================
// 1. CREATE ORDER
// ============================================================================
const createOrder = {
  method: 'POST',
  url: `${API_BASE}/orders`,
  headers,
  body: {
    customer: {
      name: 'Sarah Johnson',
      phone: '+1-555-0123'
    },
    pickupAt: '2025-11-20T14:30:00Z',
    items: [
      {
        itemName: 'Chocolate Birthday Cake (8")',
        qty: 1,
        unitPrice: 45.00
      },
      {
        itemName: 'Vanilla Cupcakes (Box of 12)',
        qty: 2,
        unitPrice: 18.00
      },
      {
        itemName: 'Croissants (Box of 6)',
        qty: 1,
        unitPrice: 12.00
      }
    ],
    payment: {
      status: 'ADVANCE',
      advanceAmount: 40.00
    },
    notes: 'Please write "Happy Birthday Emily" on the cake'
  }
};
// Expected: 201 Created
// Response: { orderId, orderNo: "CL-2025-000001", status: "PENDING", totalAmount: "93.00" }

// ============================================================================
// 2. GET TODAY'S ORDERS
// ============================================================================
const getTodayOrders = {
  method: 'GET',
  url: `${API_BASE}/orders?date=2025-11-19`,
  headers
};
// Expected: 200 OK
// Response: Array of orders with items and creator info

// ============================================================================
// 3. GET TOMORROW'S ORDERS
// ============================================================================
const getTomorrowOrders = {
  method: 'GET',
  url: `${API_BASE}/orders?date=2025-11-20`,
  headers
};

// ============================================================================
// 4. GET PENDING ORDERS ONLY
// ============================================================================
const getPendingOrders = {
  method: 'GET',
  url: `${API_BASE}/orders?status=PENDING`,
  headers
};

// ============================================================================
// 5. SEARCH ORDERS BY CUSTOMER
// ============================================================================
const searchOrders = {
  method: 'GET',
  url: `${API_BASE}/orders?q=Sarah`,
  headers
};

// ============================================================================
// 6. GET THIS WEEK'S ORDERS
// ============================================================================
const getThisWeekOrders = {
  method: 'GET',
  url: `${API_BASE}/orders/this-week`,
  headers
};

// ============================================================================
// 7. GET SINGLE ORDER BY ID
// ============================================================================
const getOrderById = {
  method: 'GET',
  url: `${API_BASE}/orders/uuid-here`,
  headers
};
// Expected: 200 OK with full details including statusHistory and payments

// ============================================================================
// 8. UPDATE ORDER - Change customer and add items
// ============================================================================
const updateOrder = {
  method: 'PATCH',
  url: `${API_BASE}/orders/uuid-here`,
  headers,
  body: {
    customer: {
      name: 'Sarah Johnson-Smith',
      phone: '+1-555-0123'
    },
    items: [
      {
        itemName: 'Chocolate Birthday Cake (8")',
        qty: 1,
        unitPrice: 45.00
      },
      {
        itemName: 'Vanilla Cupcakes (Box of 12)',
        qty: 3, // Changed from 2 to 3
        unitPrice: 18.00
      },
      {
        itemName: 'Croissants (Box of 6)',
        qty: 1,
        unitPrice: 12.00
      },
      {
        itemName: 'Macarons (Box of 20)',
        qty: 1,
        unitPrice: 25.00
      }
    ],
    notes: 'Please write "Happy Birthday Emily" on the cake. Add candles.'
  }
};
// Expected: 200 OK
// New total: 45 + (18*3) + 12 + 25 = 136.00

// ============================================================================
// 9. UPDATE ORDER - Change pickup time only
// ============================================================================
const updatePickupTime = {
  method: 'PATCH',
  url: `${API_BASE}/orders/uuid-here`,
  headers,
  body: {
    pickupAt: '2025-11-20T16:00:00Z'
  }
};

// ============================================================================
// 10. UPDATE ORDER - Mark as fully paid
// ============================================================================
const markAsPaid = {
  method: 'PATCH',
  url: `${API_BASE}/orders/uuid-here`,
  headers,
  body: {
    payment: {
      status: 'PAID',
      advanceAmount: 0
    }
  }
};

// ============================================================================
// 11. CHANGE ORDER STATUS TO READY
// ============================================================================
const markAsReady = {
  method: 'POST',
  url: `${API_BASE}/orders/uuid-here/status`,
  headers,
  body: {
    to: 'READY'
  }
};
// Expected: 200 OK
// Creates status history record: PENDING → READY

// ============================================================================
// 12. COMPLETE ORDER
// ============================================================================
const completeOrder = {
  method: 'POST',
  url: `${API_BASE}/orders/uuid-here/status`,
  headers,
  body: {
    to: 'COMPLETED'
  }
};
// Expected: 200 OK
// Creates status history record: READY → COMPLETED

// ============================================================================
// 13. CANCEL ORDER
// ============================================================================
const cancelOrder = {
  method: 'POST',
  url: `${API_BASE}/orders/uuid-here/status`,
  headers,
  body: {
    to: 'CANCELLED'
  }
};

// ============================================================================
// 14. COMBINED FILTERS - Unpaid pending orders for tomorrow
// ============================================================================
const getUnpaidPendingTomorrow = {
  method: 'GET',
  url: `${API_BASE}/orders?date=2025-11-20&status=PENDING&payment=UNPAID`,
  headers
};

// ============================================================================
// CURL EXAMPLES
// ============================================================================

/*
# Login first to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bakery.com","password":"adminpassword123"}'

# Create order
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "customer": {"name":"John Doe","phone":"+1234567890"},
    "pickupAt": "2025-11-20T14:00:00Z",
    "items": [{"itemName":"Cake","qty":1,"unitPrice":25.50}],
    "payment": {"status":"UNPAID"},
    "notes": "Test order"
  }'

# Get today's orders
curl -X GET "http://localhost:5000/api/orders?date=2025-11-19" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update order
curl -X PATCH http://localhost:5000/api/orders/ORDER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "payment": {"status":"PAID","advanceAmount":0}
  }'

# Change status
curl -X POST http://localhost:5000/api/orders/ORDER_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"to":"READY"}'
*/

// ============================================================================
// VALIDATION ERROR EXAMPLES
// ============================================================================

// Missing required field
const invalidOrder1 = {
  method: 'POST',
  url: `${API_BASE}/orders`,
  headers,
  body: {
    customer: { name: 'John' }, // Missing phone
    pickupAt: '2025-11-20T14:00:00Z',
    items: [],
    payment: { status: 'PAID' }
  }
};
// Expected: 400 Bad Request with Zod validation details

// Invalid quantity
const invalidOrder2 = {
  method: 'POST',
  url: `${API_BASE}/orders`,
  headers,
  body: {
    customer: { name: 'John', phone: '123' },
    pickupAt: '2025-11-20T14:00:00Z',
    items: [
      { itemName: 'Cake', qty: -1, unitPrice: 25 } // Negative quantity
    ],
    payment: { status: 'PAID' }
  }
};
// Expected: 400 Bad Request

// Empty items array
const invalidOrder3 = {
  method: 'POST',
  url: `${API_BASE}/orders`,
  headers,
  body: {
    customer: { name: 'John', phone: '123' },
    pickupAt: '2025-11-20T14:00:00Z',
    items: [], // Empty array not allowed
    payment: { status: 'PAID' }
  }
};
// Expected: 400 Bad Request

// ============================================================================
// RESPONSE STRUCTURE EXAMPLES
// ============================================================================

/*
// POST /orders response
{
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "orderNo": "CL-2025-000001",
  "status": "PENDING",
  "totalAmount": "93.00"
}

// GET /orders response
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "orderNo": "CL-2025-000001",
    "customerName": "Sarah Johnson",
    "customerPhone": "+1-555-0123",
    "pickupAt": "2025-11-20T14:30:00.000Z",
    "status": "PENDING",
    "paymentStatus": "ADVANCE",
    "advanceAmount": "40.00",
    "totalAmount": "93.00",
    "notes": "Please write 'Happy Birthday Emily' on the cake",
    "createdBy": "admin-uuid",
    "createdAt": "2025-11-19T10:00:00.000Z",
    "updatedAt": "2025-11-19T10:00:00.000Z",
    "items": [
      {
        "id": "item-uuid-1",
        "orderId": "550e8400-e29b-41d4-a716-446655440000",
        "itemName": "Chocolate Birthday Cake (8\")",
        "qty": 1,
        "unitPrice": "45.00",
        "subtotal": "45.00"
      },
      {
        "id": "item-uuid-2",
        "orderId": "550e8400-e29b-41d4-a716-446655440000",
        "itemName": "Vanilla Cupcakes (Box of 12)",
        "qty": 2,
        "unitPrice": "18.00",
        "subtotal": "36.00"
      },
      {
        "id": "item-uuid-3",
        "orderId": "550e8400-e29b-41d4-a716-446655440000",
        "itemName": "Croissants (Box of 6)",
        "qty": 1,
        "unitPrice": "12.00",
        "subtotal": "12.00"
      }
    ],
    "creator": {
      "name": "Admin User"
    }
  }
]

// GET /orders/:id response (includes statusHistory and payments)
{
  // ... same as above, plus:
  "statusHistory": [
    {
      "id": "history-uuid-1",
      "orderId": "550e8400-e29b-41d4-a716-446655440000",
      "fromStatus": "PENDING",
      "toStatus": "PENDING",
      "changedBy": "admin-uuid",
      "changedAt": "2025-11-19T10:00:00.000Z",
      "user": {
        "name": "Admin User"
      }
    },
    {
      "id": "history-uuid-2",
      "orderId": "550e8400-e29b-41d4-a716-446655440000",
      "fromStatus": "PENDING",
      "toStatus": "READY",
      "changedBy": "admin-uuid",
      "changedAt": "2025-11-19T13:00:00.000Z",
      "user": {
        "name": "Admin User"
      }
    }
  ],
  "payments": []
}
*/

export { 
  createOrder, 
  getTodayOrders, 
  getTomorrowOrders, 
  getOrderById, 
  updateOrder, 
  markAsReady 
};
