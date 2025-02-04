require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const http = require("http");
const { Server } = require("socket.io");

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  })
);

app.use(express.json());

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Access denied" });

  jwt.verify(
    token,
    process.env.JWT_SECRET || "your-secret-key",
    (err, user) => {
      if (err) return res.status(403).json({ error: "Invalid token" });
      req.user = user;
      next();
    }
  );
};

// Socket.io
const usersOnline = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("userOnline", async (userId) => {
    if (!userId) return;
    usersOnline.set(userId, socket.id);
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { status: "online" },
      });
    } catch (err) {
      console.error("Error updating user status:", err);
    }
  });

  socket.on("sendMessage", async ({ senderId, receiverId, content }) => {
    try {
      if (!senderId || !receiverId || !content) {
        console.error("Invalid message payload");
        return;
      }
      console.log(
        `Received message from ${senderId} to ${receiverId}: ${content}`
      );

      const message = await prisma.message.create({
        data: { senderId, receiverId, content },
      });

      const receiverSocketId = usersOnline.get(receiverId);
      if (!receiverSocketId) {
        console.log(
          `User ${receiverId} is offline, message saved in database.`
        );
        return;
      }
      io.to(receiverSocketId).emit("receiveMessage", message);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });

  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);
    const userId = [...usersOnline.entries()].find(
      ([_, id]) => id === socket.id
    )?.[0];
    if (userId) {
      usersOnline.delete(userId);
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { status: "offline" },
        });
      } catch (err) {
        console.error("Error updating user status on disconnect:", err);
      }
    }
  });
});

// Auth routes
app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "Missing fields" });

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser)
      return res.status(400).json({ error: "Username already taken" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, password: hashedPassword },
    });

    res.json({ message: "User created successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(400).json({ error: "User not found" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );
    await prisma.user.update({
      where: { id: user.id },
      data: { status: "online" },
    });

    res.json({ token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Message routes
app.post("/api/messages", authenticateToken, async (req, res) => {
  try {
    const { content, receiverId } = req.body;
    if (!content || !receiverId)
      return res.status(400).json({ error: "Missing fields" });

    const message = await prisma.message.create({
      data: { content, senderId: req.user.id, receiverId },
    });
    res.json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// User routes
app.get("/api/users", authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, status: true },
    });
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/logout", authenticateToken, async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { status: "offline" },
    });
    res.json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ error: "Failed to logout" });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
