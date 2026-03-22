import express, { Request, Response } from 'express';
import cors from 'cors';
import { query } from './db';
import { signin, signup } from './auth';
import dotenv from 'dotenv';
import { protect, AuthRequest } from './middleware/auth';

dotenv.config();
const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// --- 1. HEALTH CHECK ---
app.get('/', (req, res) => {
  res.send('Restaurant API is running smoothly ');
});

// --- 2. DASHBOARD ANALYTICS ---
app.get('/api/dashboard/stats', async (req: Request, res: Response) => {
  try {
    const orderStats = await query('SELECT COUNT(*) FROM orders');
    const userStats = await query('SELECT COUNT(*) FROM users');

    res.status(200).json({
      totalOrders: parseInt(orderStats.rows[0].count),
      totalUsers: parseInt(userStats.rows[0].count),
    });
  } catch (err) {
    console.error("Stats Error:", err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// --- 3. GET ALL PRODUCTS (Mobile + CMS) ---
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM products ORDER BY category ASC');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Products Fetch Error:", err);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// --- 4. ADD PRODUCT (CMS) ---
app.post('/api/products', async (req: Request, res: Response) => {
  const { name, category, price, description, image_url } = req.body;
  try {
    const result = await query(
      'INSERT INTO products (name, category, price, description, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, category || 'General', price, description, image_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Product Insert Error:", err);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// --- 5. UPDATE PRODUCT (CMS) ---
app.put('/api/products/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, category, price, description, image_url } = req.body;
  try {
    await query(
      'UPDATE products SET name=$1, category=$2, price=$3, description=$4, image_url=$5 WHERE id=$6',
      [name, category, price, description, image_url, id]
    );
    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    console.error("Product Update Error:", err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// --- 6. DELETE PRODUCT (CMS) ---
app.delete('/api/products/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error("Product Delete Error:", err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// --- 7. GET ALL ORDERS (CMS Dashboard) ---
app.get('/api/orders', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT 
        o.id, 
        u.name as customer_name, 
        o.total_amount, 
        o.status, 
        o.created_at,
        (SELECT string_agg(p.name, ', ') 
         FROM order_items oi 
         JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id = o.id) as items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Order Fetch Error:", err);
    res.status(500).json({ error: 'Failed to fetch order list' });
  }
});

// --- 8. PLACE ORDER (Mobile App) ---
app.post('/api/orders', async (req: Request, res: Response) => {
  const { userId, total, items } = req.body;

  try {
    await query('BEGIN');

    const orderResult = await query(
      'INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING id',
      [userId || null, total, 'pending']
    );
    const orderId = orderResult.rows[0].id;

    for (const item of items) {
      await query(
        'INSERT INTO order_items (order_id, product_id, quantity) VALUES ($1, $2, $3)',
        [orderId, item.id, item.quantity]
      );
    }

    await query('COMMIT');
    res.status(201).json({ message: 'Order placed successfully', orderId });
  } catch (err) {
    await query('ROLLBACK');
    console.error("Transaction Error:", err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// --- 9. AUTH ROUTES ---
app.post('/api/signup', signup);
app.post('/api/signin', signin);

// --- 10. AUTH PROFILE (Mobile + CMS) ---
app.get('/api/auth/profile', protect, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT id, email, address FROM users WHERE id = $1',
      [req.userId]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// --- 11. GET ALL USERS (CMS) ---
app.get('/api/users', protect, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT id, email, address, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});
// --- GET SINGLE ORDER ITEMS ---
app.get('/api/orders/:id/items', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query(`
      SELECT p.id, p.name, p.price, p.image_url, oi.quantity
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `, [id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order items' });
  }
});
