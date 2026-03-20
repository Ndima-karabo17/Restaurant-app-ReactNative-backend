import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// SIGNUP
export const signup = async (req: Request, res: Response) => {
  const { email, password, address } = req.body;

  try {
    const userExists = await query('SELECT * FROM Users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    //  password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

   const newUser = await query(
      'INSERT INTO Users (email, password_hash, address) VALUES ($1, $2, $3) RETURNING id, email',
      [email, hashedPassword, address]
    );

    console.log(" User created successfully:", email);
    res.status(201).json(newUser.rows[0]);

  } catch (err: any) {
    console.error(" Sign upp error:", err.message); // This prints to your VS Code Terminal
    res.status(500).json({ 
      error: 'Server error during signup', 
      details: err.message 
    });
  }
};

// Signin
export const signin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const result = await query('SELECT * FROM Users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if your DB column is user.password or user.password_hash
    const dbPassword = user.password || user.password_hash;

    const isMatch = await bcrypt.compare(password, dbPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });

    res.json({ 
      token, 
      user: { id: user.id, email: user.email } 
    });

  } catch (err: any) {
    console.error(" SIGNIN ERROR:", err.message);
    res.status(500).json({ error: 'Server error during signin' });
  }
};