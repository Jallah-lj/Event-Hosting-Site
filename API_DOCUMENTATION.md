# Event Hosting Site API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## 📚 Authentication Routes (`/api/auth`)

### POST /auth/signup
Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "message": "Account created successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "ATTENDEE",
    "status": "Active",
    "profilePicture": null,
    "joined": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /auth/signin
Authenticate user and get token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Signed in successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "ATTENDEE",
    "status": "Active",
    "profilePicture": null,
    "verified": true,
    "joined": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /auth/demo-login
Quick login for development (role-based).

**Request Body:**
```json
{
  "role": "ORGANIZER" // ADMIN, ORGANIZER, or ATTENDEE
}
```

### GET /auth/me
Get current authenticated user's profile.

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "ATTENDEE",
    "status": "Active",
    "profilePicture": null,
    "verified": true,
    "joined": "2024-01-01T00:00:00.000Z",
    "lastActive": "2024-01-01T00:00:00.000Z"
  },
  "preferences": {
    "textSize": "Standard",
    "currency": "USD",
    "language": "English (Liberia)",
    "autoCalendar": true,
    "dataSaver": false,
    "notifications": {
      "email": true,
      "sms": false,
      "promotional": true
    }
  }
}
```

### PUT /auth/password
Change password.

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### POST /auth/forgot-password
Request password reset email.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

### POST /auth/reset-password
Reset password with token.

**Request Body:**
```json
{
  "token": "reset_token_here",
  "newPassword": "newpassword123"
}
```

### POST /auth/request-verification
Send email verification link.

### POST /auth/verify-email
Verify email with token.

**Request Body:**
```json
{
  "token": "verification_token_here"
}
```

---

## 👥 User Routes (`/api/users`)

### GET /users
Get all users (Admin only).

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "ATTENDEE",
    "status": "Active",
    "profilePicture": null,
    "verified": true,
    "joined": "2024-01-01T00:00:00.000Z",
    "lastActive": "2024-01-01T00:00:00.000Z"
  }
]
```

### GET /users/:id
Get user by ID.

### PUT /users/:id
Update user profile.

**Request Body:**
```json
{
  "name": "John Updated",
  "email": "john@example.com",
  "profilePicture": "https://..."
}
```

### DELETE /users/:id
Delete user (Admin only).

### POST /users/:id/notes
Add note to user (Admin only).

**Request Body:**
```json
{
  "text": "User note here"
}
```

### PUT /users/:id/preferences
Update user preferences.

**Request Body:**
```json
{
  "textSize": "Large",
  "currency": "USD",
  "language": "English (Liberia)",
  "autoCalendar": true,
  "dataSaver": false,
  "notifications": {
    "email": true,
    "sms": false,
    "promotional": true
  }
}
```

### POST /users
Create user (Admin only).

**Request Body:**
```json
{
  "name": "New User",
  "email": "new@example.com",
  "password": "password123",
  "role": "ORGANIZER"
}
```

---

## 📅 Event Routes (`/api/events`)

### GET /events
Get all events (public sees approved, organizers see their own).

**Query Parameters:**
- No auth: Returns only APPROVED events
- ATTENDEE: Returns only APPROVED events
- ORGANIZER: Returns APPROVED events + own events
- ADMIN: Returns all events

**Response (200):**
```json
[
  {
    "id": "uuid",
    "title": "Monrovia Cultural Festival",
    "description": "A vibrant celebration...",
    "date": "2024-08-15T10:00:00.000Z",
    "endDate": "2024-08-15T22:00:00.000Z",
    "location": "Centennial Pavilion, Monrovia",
    "category": "Culture",
    "price": 15,
    "capacity": 500,
    "status": "APPROVED",
    "organizerId": "org1",
    "attendeeCount": 120,
    "imageUrl": "https://...",
    "ticketTiers": [
      {
        "id": "uuid",
        "name": "General Admission",
        "price": 15,
        "description": null,
        "allocation": 400
      }
    ]
  }
]
```

### GET /events/organizer/:id
Get events by specific organizer.

### GET /events/:id
Get event by ID.

### POST /events
Create new event (Organizer/Admin only).

**Request Body:**
```json
{
  "title": "New Event",
  "description": "Event description",
  "date": "2024-08-15T10:00",
  "endDate": "2024-08-15T22:00",
  "location": "Event Location",
  "category": "Culture",
  "price": 25,
  "capacity": 200,
  "status": "PENDING",
  "imageUrl": "https://...",
  "ticketTiers": [
    {
      "name": "VIP",
      "price": 50,
      "description": "VIP Access",
      "allocation": 50
    }
  ]
}
```

### PUT /events/:id
Update event.

### DELETE /events/:id
Delete event.

### POST /events/:id/approve
Approve event (Admin only).

### POST /events/:id/reject
Reject event (Admin only).

### PUT /events/:id/status
Update event status (Admin only).

**Request Body:**
```json
{
  "status": "APPROVED" // PENDING, APPROVED, REJECTED, DRAFT
}
```

### POST /events/recurring
Create recurring event series.

**Request Body:**
```json
{
  "title": "Weekly Meetup",
  "description": "Regular weekly event",
  "date": "2024-08-01T10:00",
  "endDate": "2024-08-01T14:00",
  "location": " venue",
  "category": "Social",
  "price": 0,
  "capacity": 50,
  "recurringType": "weekly", // daily, weekly, biweekly, monthly
  "recurringEndDate": "2024-12-31"
}
```

### GET /events/:id/series
Get all occurrences of a recurring event.

---

## 🎫 Ticket Routes (`/api/tickets`)

### GET /tickets/my
Get current user's tickets.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "eventId": "event_uuid",
    "userId": "user_uuid",
    "attendeeName": "John Doe",
    "attendeeEmail": "john@example.com",
    "tierName": "General Admission",
    "pricePaid": 15,
    "purchaseDate": "2024-01-01T00:00:00.000Z",
    "used": false,
    "checkInTime": null,
    "event": {
      "title": "Monrovia Cultural Festival",
      "date": "2024-08-15T10:00:00.000Z",
      "location": "Centennial Pavilion, Monrovia",
      "imageUrl": "https://..."
    }
  }
]
```

### GET /tickets/event/:eventId
Get all tickets for an event (Organizer/Admin).

### GET /tickets
Get all tickets (Organizer sees own events' tickets, Admin sees all).

### GET /tickets/:id
Get ticket by ID.

### POST /tickets/purchase
Purchase ticket(s).

**Request Body:**
```json
{
  "eventId": "event_uuid",
  "tierId": "tier_uuid", // optional
  "quantity": 1
}
```

**Response (201):**
```json
{
  "message": "1 ticket(s) purchased successfully",
  "tickets": [
    {
      "id": "uuid",
      "tierName": "General Admission",
      "pricePaid": 15
    }
  ]
}
```

### POST /tickets/validate
Validate ticket (for scanner app).

**Request Body:**
```json
{
  "ticketId": "ticket_uuid",
  "eventId": "event_uuid" // optional, can be "ALL"
}
```

**Response (200):**
```json
{
  "valid": true,
  "message": "Ticket is valid",
  "ticket": {
    "id": "uuid",
    "attendeeName": "John Doe",
    "tierName": "General Admission",
    "used": false
  }
}
```

### POST /tickets/:id/verify
Check-in ticket (mark as used).

### POST /tickets/:id/undo-checkin
Undo check-in.

### PUT /tickets/:id
Update ticket attendee details.

**Request Body:**
```json
{
  "attendeeName": "New Name",
  "attendeeEmail": "newemail@example.com"
}
```

---

## 💰 Transaction Routes (`/api/transactions`)

### GET /transactions
Get transactions (Organizer sees own, Admin sees all).

**Response (200):**
```json
[
  {
    "id": "uuid",
    "type": "SALE",
    "description": "Ticket Sale - Event Name (2x General)",
    "amount": 30,
    "date": "2024-01-01T00:00:00.000Z",
    "status": "COMPLETED",
    "user": "John Doe",
    "event": "Event Name",
    "organizerId": "org_uuid"
  }
]
```

### GET /transactions/stats
Get transaction statistics.

**Response (200):**
```json
{
  "totalSales": 15000,
  "totalFees": 1500,
  "totalPayouts": 10000,
  "netRevenue": 3500
}
```

---

## 📊 Analytics Routes (`/api/analytics`)

### GET /analytics/organizer/live
Get live analytics data (Organizer/Admin/Analyst).

**Response (200):**
```json
{
  "stats": {
    "revenue": 15000,
    "ticketsSold": 500,
    "checkInRate": 75
  },
  "chartData": [
    {
      "time": "10:00",
      "sales": 3,
      "checkIns": 5,
      "activeUsers": 15
    }
  ],
  "recentActivity": [
    {
      "id": "uuid",
      "type": "CHECKIN",
      "timestamp": "2024-01-01T12:00:00.000Z",
      "eventTitle": "Event Name",
      "attendee": "John Doe"
    }
  ]
}
```

---

## 📢 Broadcast Routes (`/api/broadcasts`)

### GET /broadcasts
Get all broadcasts (Organizer/Admin).

### POST /broadcasts
Create and send broadcast (Organizer/Admin).

**Request Body:**
```json
{
  "subject": "Event Update",
  "body": "Message to attendees",
  "eventId": "event_uuid" // optional
}
```

**Response (201):**
```json
{
  "message": "Broadcast sent",
  "broadcast": {
    "id": "uuid",
    "subject": "Event Update",
    "body": "Message to attendees",
    "event": "Event Name",
    "eventId": "event_uuid",
    "date": "2024-01-01T12:00:00.000Z",
    "recipientCount": 150
  }
}
```

### DELETE /broadcasts/:id
Delete broadcast.

---

## 👨‍💼 Team Routes (`/api/team`)

### GET /team
Get team members (Organizer/Admin).

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Sarah Johnson",
    "email": "sarah@example.com",
    "role": "Scanner",
    "status": "ACTIVE",
    "scans": 142
  }
]
```

### POST /team
Add team member (Organizer/Admin).

**Request Body:**
```json
{
  "name": "New Member",
  "email": "member@example.com",
  "role": "Scanner",
  "password": "Password123" // optional, defaults to "Password@123"
}
```

### PUT /team/:id
Update team member (Organizer/Admin).

**Request Body:**
```json
{
  "role": "Manager",
  "status": "ACTIVE"
}
```

### DELETE /team/:id
Remove team member.

### POST /team/:id/scan
Increment scan count for team member.

---

## 💳 Promo Routes (`/api/promos`)

### GET /promos
Get all promo codes (Organizer/Admin).

### POST /promos
Create promo code (Organizer/Admin).

**Request Body:**
```json
{
  "code": "SUMMER20",
  "type": "PERCENT", // or "FIXED"
  "value": 20,
  "usageLimit": 100,
  "eventId": "event_uuid" // optional
}
```

### POST /promos/validate
Validate promo code.

**Request Body:**
```json
{
  "code": "SUMMER20",
  "eventId": "event_uuid"
}
```

### DELETE /promos/:id
Delete promo code.

---

## 🔗 Referral Routes (`/api/referrals`)

### GET /referrals
Get all referrals (Organizer/Admin).

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Influencer Campaign",
    "code": "SARAH2024",
    "url": "https://...?ref=SARAH2024",
    "clicks": 1240,
    "sales": 45,
    "revenue": 675,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### POST /referrals
Create referral link (Organizer/Admin).

**Request Body:**
```json
{
  "name": "New Campaign",
  "code": "NEW2024"
}
```

### DELETE /referrals/:id
Delete referral.

---

## 📤 Upload Routes (`/api/upload`)

### POST /upload
Upload file (images, avatars, etc.).

**Content-Type:** multipart/form-data

**Form Data:**
- `file`: File to upload
- `type`: Optional type (avatar, event, etc.)

**Response (201):**
```json
{
  "url": "http://localhost:5000/uploads/avatars/filename.jpg"
}
```

---

## 📆 Calendar Routes (`/api/calendar`)

### GET /calendar
Get calendar events for user.

### POST /calendar/events
Add event to user's calendar.

---

## 🔧 Settings Routes (`/api/settings`)

### GET /settings
Get platform settings (Admin only).

### PUT /settings
Update platform settings (Admin only).

### GET /settings/organizer
Get organizer settings.

### PUT /settings/organizer
Update organizer settings.

---

## 💸 Refund Routes (`/api/refunds`)

### GET /refunds
Get refund requests (Organizer/Admin).

### POST /refunds
Request refund (Attendee).

### PUT /refunds/:id
Process refund (Organizer/Admin).

**Request Body:**
```json
{
  "status": "APPROVED", // APPROVED, REJECTED
  "reason": "Refund processed"
}
```

---

## 🔐 User Roles

| Role | Description |
|------|-------------|
| `GUEST` | Unauthenticated user |
| `ATTENDEE` | Regular user who can browse and purchase tickets |
| `ORGANIZER` | Can create and manage events |
| `ADMIN` | Full system access |
| `SCANNER` | Can scan tickets (team member) |
| `ANALYST` | View-only analytics access |
| `MODERATOR` | Moderate content and users |

---

## 📡 WebSocket Events

The server also provides real-time updates via WebSocket:

### Event Types
- `TICKET_PURCHASED` - New ticket purchased
- `TICKET_CHECKED_IN` - Ticket scanned/checked in
- `SALES_UPDATE` - Sales data updated
- `NEW_BROADCAST` - New broadcast message

---

## 📝 Error Responses

All errors follow this format:

```json
{
  "error": "Error message here"
}
```

**Status Codes:**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (not authorized for this action)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🚀 Rate Limiting

- API endpoints: 100 requests/minute
- Auth endpoints: 10 requests/minute
- Password reset: 5 requests/hour

---

## 🏥 Health Check

### GET /api/health

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

