# Server Setup

## Environment Variables

Create a `.env` file in the `server/` directory with the following variables:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/slotswapper?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3001
```

Replace:
- `user` and `password` with your PostgreSQL credentials
- `your-super-secret-jwt-key-change-this-in-production` with a strong random string

## Quick Start

```bash
# Install dependencies
npm install

# Set up database (make sure PostgreSQL is running)
npm run migrate

# Seed with sample data
npm run seed

# Start development server
npm run dev
```

