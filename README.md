#  RestaurantApp — Backend

> Node.js + Express REST API for the RestaurantApp platform

---

## Description

The RestaurantApp Backend is the central API that powers both the mobile app and the CMS. It handles authentication, menu management, order processing, and user profiles. Built with Express and TypeScript, connected to a PostgreSQL database, and hosted on Render.

**Features:**
- JWT-based authentication (signup, signin, protected routes)
- Full CRUD for menu products
- Order placement with transaction support (BEGIN/COMMIT/ROLLBACK)
- Order history with joined product details
- User profile management
- Dashboard statistics (total orders, total users)
- CORS enabled for both mobile and CMS clients

---

## Tech Stack

- Node.js + Express
- TypeScript
- PostgreSQL (pg)
- JWT (jsonwebtoken)
- bcrypt (password hashing)
- dotenv
- Hosted on **Render**

---

## Installation

### Prerequisites
- Node.js v18+
- PostgreSQL database (local or cloud — Render, Neon, etc.)

### Steps

```bash
# Clone the repo
git clone https://github.com/yourusername/restaurant-backend.git
cd restaurant-backend

# Install dependencies
npm install
```

Create a `.env` file in the root:
```env
DATABASE_URL=postgresql://user:password@host:5432/RestaurantApp
JWT_SECRET=your_secret_key_here
PORT=5000
```

### Database Setup

Run this SQL in pgAdmin or your cloud database query tool:

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  address TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  category VARCHAR(100),
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1
);
```

### Run the server

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

---

## Usage

The server runs on `http://localhost:5000` by default. All routes are prefixed with `/api`.

Test the health check:
```
GET http://localhost:5000/
→ "Restaurant API is running smoothly 🚀"
```

---

## API Routes

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |

### Products
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | None | Get all menu items |
| POST | `/api/products` | None | Add new product |
| PUT | `/api/products/:id` | None | Update product |
| DELETE | `/api/products/:id` | None | Delete product |

### Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/orders` | None | Get all orders with customer names |
| POST | `/api/orders` | None | Place new order (transaction) |
| GET | `/api/orders/:id/items` | None | Get items for a specific order |

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/signup` | None | Register new user |
| POST | `/api/signin` | None | Sign in, returns JWT |
| GET | `/api/auth/profile` | JWT | Get current user profile |
| PUT | `/api/auth/profile` | JWT | Update user profile |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | JWT | Get all users (CMS) |

### Dashboard
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard/stats` | None | Total orders and users |

---




## Deployment

This backend is deployed on **Render** (free tier).

> ⚠️ Render free tier spins down after inactivity. The first request after sleep may take 30–60 seconds.

To deploy:
1. Push code to GitHub
2. Connect repo on [render.com](https://render.com)
3. Set environment variables in Render dashboard → **Environment** tab
4. Render auto-deploys on every push to main

---


## Roadmap

- [ ] Add admin role middleware to protect CMS routes
- [ ] Order status update endpoint (pending → completed)
- [ ] Pagination for orders and products
- [ ] Rate limiting

---

## Authors

Built by **Ndima Mhangwani** 🇿🇦

---


## Project Status

🟢 **Active — Version 1.0.0**
