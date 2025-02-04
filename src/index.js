require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword
      }
    });

    res.json({ message: 'User created successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'your-secret-key');
    
    await prisma.user.update({
      where: { id: user.id },
      data: { status: 'online' }
    });

    res.json({ token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Message routes
app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const { content, receiverId } = req.body;
    const message = await prisma.message.create({
      data: {
        content,
        senderId: req.user.id,
        receiverId
      }
    });
    res.json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/messages', authenticateToken, async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.user.id },
          { receiverId: req.user.id }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            status: true
          }
        },
        receiver: {
          select: {
            id: true,
            username: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(messages);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.patch('/api/messages/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const message = await prisma.message.update({
      where: { id },
      data: { isRead: true }
    });
    res.json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// User routes
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        status: true
      }
    });
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});