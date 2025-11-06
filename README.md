# SlotSwapper

A peer-to-peer time-slot swapping application that allows users to swap their available time slots with others.

**🌐 Live Demo:** [View on Vercel](https://vercel.com/archie0410s-projects/slot-swapper-mvev)

## Overview

SlotSwapper enables users to:
- Create and manage their time slots (events)
- Mark slots as swappable
- Browse other users' swappable slots
- Request swaps with other users
- Accept or reject incoming swap requests
- Automatically swap slot ownership when requests are accepted

## Tech Stack

### Backend
- **Node.js** + **Express** with **TypeScript**
- **PostgreSQL** database
- **Prisma** ORM with migrations
- **JWT** authentication (Bearer tokens)
- **bcryptjs** for password hashing

### Frontend
- **React** with **TypeScript**
- **Vite** as build tool
- **React Router** for navigation
- **Axios** for API calls

## Project Structure

```
.
├── server/          # Backend API
│   ├── src/
│   │   ├── routes/  # API route handlers
│   │   ├── middleware/  # Auth middleware
│   │   └── scripts/  # Seed script
│   └── prisma/      # Database schema and migrations
├── client/          # Frontend React app
│   └── src/
│       ├── pages/   # Page components
│       ├── components/  # Reusable components
│       ├── contexts/    # React contexts (Auth)
│       └── api/     # API client functions
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### 1. Clone the Repository

```bash
git clone <repository-url>
cd slotswapper
```

### 2. Database Setup

Create a PostgreSQL database:

```bash
createdb slotswapper
# Or using psql:
# psql -U postgres
# CREATE DATABASE slotswapper;
```

### 3. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/slotswapper?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3001
```

Run database migrations:

```bash
npm run migrate
```

Seed the database with sample data:

```bash
npm run seed
```

This creates two sample users:
- **alice@example.com** / password: `password123`
- **bob@example.com** / password: `password123`

Start the backend server:

```bash
npm run dev
```

The server will run on `http://localhost:3001`

### 4. Frontend Setup

Open a new terminal:

```bash
cd client
npm install
npm run dev
```

The frontend will run on `http://localhost:3000`

## API Documentation

All API endpoints require authentication via JWT Bearer token (except signup/login).

### Authentication

#### POST /api/auth/signup
Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** `201 Created`
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Events

#### GET /api/events
Get all events for the current user.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "title": "Team Meeting",
    "startTime": "2024-01-15T10:00:00Z",
    "endTime": "2024-01-15T11:00:00Z",
    "status": "BUSY",
    "ownerId": "uuid",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

#### POST /api/events
Create a new event.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Team Meeting",
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-15T11:00:00Z",
  "status": "BUSY"
}
```

**Response:** `201 Created`

#### PUT /api/events/:id
Update an event (only owner can update).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Updated Title",
  "status": "SWAPPABLE"
}
```

**Response:** `200 OK`

#### DELETE /api/events/:id
Delete an event (only owner can delete).

**Headers:** `Authorization: Bearer <token>`

**Response:** `204 No Content`

### Swaps

#### GET /api/swappable-slots
Get all swappable slots from other users.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "title": "Client Presentation",
    "startTime": "2024-01-15T14:00:00Z",
    "endTime": "2024-01-15T15:30:00Z",
    "status": "SWAPPABLE",
    "ownerId": "uuid",
    "owner": {
      "id": "uuid",
      "name": "Bob Johnson",
      "email": "bob@example.com"
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

#### POST /api/swap-request
Create a swap request.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "mySlotId": "uuid-of-your-slot",
  "theirSlotId": "uuid-of-their-slot"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "mySlotId": "uuid",
  "theirSlotId": "uuid",
  "fromUserId": "uuid",
  "toUserId": "uuid",
  "status": "PENDING",
  "mySlot": { ... },
  "theirSlot": { ... },
  "fromUser": { ... },
  "toUser": { ... },
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

**Note:** This endpoint atomically:
- Creates the swap request with status `PENDING`
- Sets both slots to `SWAP_PENDING` status

#### POST /api/swap-response/:requestId
Accept or reject a swap request (only `toUserId` can respond).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "accept": true
}
```

**Response:** `200 OK`

**Behavior:**
- **If accepted:** Swaps the `ownerId` of both slots and sets both to `BUSY` status
- **If rejected:** Restores both slots to `SWAPPABLE` status

#### GET /api/requests
Get all incoming and outgoing swap requests for the current user.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "incoming": [
    {
      "id": "uuid",
      "status": "PENDING",
      "mySlot": { ... },
      "theirSlot": { ... },
      "fromUser": { ... },
      "toUser": { ... }
    }
  ],
  "outgoing": [
    {
      "id": "uuid",
      "status": "PENDING",
      "mySlot": { ... },
      "theirSlot": { ... },
      "fromUser": { ... },
      "toUser": { ... }
    }
  ]
}
```

## Example cURL Commands

### Create Swap Request

```bash
curl -X POST http://localhost:3001/api/swap-request \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mySlotId": "00000000-0000-0000-0000-000000000002",
    "theirSlotId": "00000000-0000-0000-0000-000000000003"
  }'
```

### Respond to Swap Request

```bash
curl -X POST http://localhost:3001/api/swap-response/<requestId> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"accept": true}'
```

## Database Schema

### Users
- `id` (UUID, primary key)
- `name` (string)
- `email` (string, unique)
- `passwordHash` (string)
- `createdAt`, `updatedAt` (timestamps)

### Events
- `id` (UUID, primary key)
- `title` (string)
- `startTime` (timestamp)
- `endTime` (timestamp)
- `status` (enum: `BUSY`, `SWAPPABLE`, `SWAP_PENDING`)
- `ownerId` (UUID, foreign key to users)
- `createdAt`, `updatedAt` (timestamps)

### Swap Requests
- `id` (UUID, primary key)
- `mySlotId` (UUID, foreign key to events)
- `theirSlotId` (UUID, foreign key to events)
- `fromUserId` (UUID, foreign key to users)
- `toUserId` (UUID, foreign key to users)
- `status` (enum: `PENDING`, `ACCEPTED`, `REJECTED`)
- `createdAt`, `updatedAt` (timestamps)

## Critical Backend Logic

### Swap Transaction Handling

All swap operations use **database transactions** to ensure atomicity:

1. **Creating a swap request:**
   - Verifies both slots exist and are `SWAPPABLE`
   - Prevents users from requesting their own slots
   - Atomically creates the request and updates both slots to `SWAP_PENDING`
   - If any step fails, the entire transaction rolls back

2. **Accepting a swap request:**
   - Verifies only `toUserId` can respond
   - Atomically swaps the `ownerId` of both slots
   - Sets both slots to `BUSY` status
   - Updates request status to `ACCEPTED`

3. **Rejecting a swap request:**
   - Verifies only `toUserId` can respond
   - Atomically restores both slots to `SWAPPABLE` status
   - Updates request status to `REJECTED`

### Edge Cases Handled

- Users cannot request swaps for their own slots
- Slots must be `SWAPPABLE` to create a request
- Slots with `SWAP_PENDING` status cannot be modified
- Only the receiver (`toUserId`) can accept/reject requests
- Prevents duplicate pending requests between the same slots
- All operations are transactional to prevent race conditions

## Frontend Features

### Pages

1. **Login/Signup** - Authentication pages
2. **Dashboard** - View and manage your events
   - Create, edit, delete events
   - Toggle "Make Swappable" status
3. **Marketplace** - Browse other users' swappable slots
   - View available slots
   - Request swaps via modal dialog
4. **Requests** - Manage swap requests
   - View incoming requests (with Accept/Reject buttons)
   - View outgoing requests (with status)

### State Management

- JWT token stored in `localStorage`
- React Context for authentication state
- Optimistic updates and re-fetching for reactive UI
- Protected routes with automatic redirect to login

## Error Codes

- `400` - Bad Request (validation errors, invalid input)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (not authorized for the operation)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (e.g., user already exists, duplicate request)
- `500` - Internal Server Error

## Development Scripts

### Backend (`server/`)

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start            # Start production server
npm run migrate      # Run database migrations
npm run seed         # Seed database with sample data
npm run generate     # Generate Prisma client
```

### Frontend (`client/`)

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Testing the Application

1. Start the backend server: `cd server && npm run dev`
2. Start the frontend: `cd client && npm run dev`
3. Open `http://localhost:3000` in your browser
4. Sign up or login with sample credentials
5. Create some events and mark them as swappable
6. Browse the marketplace and request swaps
7. Accept/reject requests from the Requests page

## Design Choices

1. **Prisma ORM**: Chosen for type safety and excellent migration support
2. **JWT in localStorage**: Simple implementation; in production, consider httpOnly cookies
3. **Transactional swaps**: All swap operations use database transactions to ensure data consistency
4. **Status-based workflow**: Clear state machine (BUSY → SWAPPABLE → SWAP_PENDING → BUSY/SWAPPABLE)
5. **Minimal UI**: Clean, functional interface focused on core features

## Future Enhancements

- Real-time notifications with Socket.IO
- Email notifications for swap requests
- Request expiration/cancellation
- Calendar view for events
- Search and filter for marketplace
- Unit and integration tests
- Docker containerization
- CI/CD pipeline

## Deployment

**Live Demo:** [https://vercel.com/archie0410s-projects/slot-swapper-mvev](https://vercel.com/archie0410s-projects/slot-swapper-mvev)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel (Frontend)

1. Connect your GitHub repo to Vercel
2. Set root directory to `client`
3. Add environment variable: `VITE_API_URL` (your backend URL)
4. Deploy!

### Backend Deployment

Deploy the backend separately to Railway, Render, or similar platform. See DEPLOYMENT.md for details.

## License

MIT
