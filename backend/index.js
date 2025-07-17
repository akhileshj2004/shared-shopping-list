// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs'); // For password hashing
const jwt = require('jsonwebtoken'); // For JSON Web Tokens

const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json()); // For parsing JSON request bodies

// --- MySQL Database Configuration ---
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool; // Connection pool for database

// Helper to generate a unique ID
const generateUniqueId = () => Math.random().toString(36).substr(2, 9);

// --- Database Initialization ---
async function initializeDatabase() {
  try {
    const tempConnection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });
    await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await tempConnection.end();

    pool = mysql.createPool(dbConfig);
    await pool.getConnection();
    console.log('Connected to MySQL database and pool created.');

    // Create tables if they don't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table "users" ensured.');

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS lists (
          id VARCHAR(255) PRIMARY KEY,
          owner_id VARCHAR(255) NOT NULL,
          name VARCHAR(255) DEFAULT 'My Shopping List',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('Table "lists" ensured.');

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS items (
          id VARCHAR(255) PRIMARY KEY,
          list_id VARCHAR(255) NOT NULL,
          text VARCHAR(255) NOT NULL,
          checked BOOLEAN DEFAULT FALSE,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
      )
    `);
    console.log('Table "items" ensured.');

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS shared_lists (
          list_id VARCHAR(255) NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          shared_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (list_id, user_id),
          FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('Table "shared_lists" ensured.');

  } catch (error) {
    console.error('Failed to connect to MySQL or create tables:', error);
    process.exit(1);
  }
}

// --- JWT Middleware ---
// This middleware will extract and verify the JWT from the request header
// and attach the user ID to req.user.id for protected routes.
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) return res.sendStatus(401); // No token

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Invalid token
    req.user = user; // user object contains { id: userId, username: username }
    next();
  });
};

// --- API Routes for Authentication ---
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    // Check if username already exists
    const [existingUsers] = await pool.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Username already taken.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // Hash password
    const userId = generateUniqueId();

    await pool.execute('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)',
      [userId, username, hashedPassword]);

    res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const [users] = await pool.execute('SELECT id, username, password_hash FROM users WHERE username = ?', [username]);
    const user = users[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Generate JWT
    const accessToken = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ accessToken, user: { id: user.id, username: user.username } });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// Protected route to get current user info (for frontend to verify login)
app.get('/api/user/me', authenticateToken, (req, res) => {
  res.json({ user: req.user }); // req.user is populated by authenticateToken middleware
});

// --- Helper function to get list items (now considers ownership/sharing) ---
async function getListItems(listId, userId) {
  try {
    // Check if the user owns the list or if it's shared with them
    const [listAccess] = await pool.execute(`
      SELECT l.id
      FROM lists l
      LEFT JOIN shared_lists sl ON l.id = sl.list_id
      WHERE l.id = ? AND (l.owner_id = ? OR sl.user_id = ?)
    `, [listId, userId, userId]);

    if (listAccess.length === 0) {
      return null; // User does not have access
    }

    const [rows] = await pool.execute(
      'SELECT id, text, checked, timestamp FROM items WHERE list_id = ? ORDER BY timestamp ASC',
      [listId]
    );
    return rows.map(row => ({
      ...row,
      checked: row.checked === 1
    }));
  } catch (error) {
    console.error(`Error fetching items for list ${listId} for user ${userId}:`, error);
    return null; // Indicate an error or no access
  }
}

// --- Socket.IO Event Handlers (Protected) ---
// We'll use a custom Socket.IO middleware to authenticate connections
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided.'));
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return next(new Error('Authentication error: Invalid token.'));
    }
    socket.user = user; // Attach user info to the socket
    next();
  });
});

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id, 'User ID:', socket.user.id);
  const userId = socket.user.id;

  // Emit the user's lists upon connection
  socket.on('getUsersLists', async () => {
    try {
      const [ownedLists] = await pool.execute(
        'SELECT id, name, owner_id FROM lists WHERE owner_id = ?',
        [userId]
      );
      const [sharedLists] = await pool.execute(`
        SELECT l.id, l.name, l.owner_id, u.username AS owner_username
        FROM lists l
        JOIN shared_lists sl ON l.id = sl.list_id
        JOIN users u ON l.owner_id = u.id
        WHERE sl.user_id = ?
      `, [userId]);

      socket.emit('usersLists', { owned: ownedLists, shared: sharedLists });
    } catch (error) {
      console.error('Error getting users lists:', error);
      socket.emit('error', 'Failed to retrieve your lists.');
    }
  });

  socket.on('joinList', async (listId) => {
    // Before joining, verify user has access to this list
    const hasAccess = await getListItems(listId, userId); // getListItems returns null if no access
    if (hasAccess === null) {
      console.log(`User ${userId} attempted to join unauthorized list: ${listId}`);
      return socket.emit('error', 'You do not have access to this list.');
    }

    // Leave any previously joined rooms to ensure only one list is active per client
    // (This is a simplification; a more complex app might allow multiple active lists)
    socket.rooms.forEach(room => {
      if (room !== socket.id) { // Don't leave the default personal room
        socket.leave(room);
      }
    });

    socket.join(listId);
    console.log(`User ${socket.id} (ID: ${userId}) joined list: ${listId}`);

    const items = await getListItems(listId, userId);
    if (items !== null) {
      socket.emit('listUpdate', items);
    }
  });

  socket.on('createList', async ({ listName }) => {
    const newListId = generateUniqueId();
    try {
      await pool.execute('INSERT INTO lists (id, owner_id, name) VALUES (?, ?, ?)',
        [newListId, userId, listName || 'My Shopping List']);
      console.log(`New list created in DB by ${userId}: ${newListId}`);
      // Re-fetch and emit all lists for the user
      const [ownedLists] = await pool.execute(
        'SELECT id, name, owner_id FROM lists WHERE owner_id = ?',
        [userId]
      );
      const [sharedLists] = await pool.execute(`
        SELECT l.id, l.name, l.owner_id, u.username AS owner_username
        FROM lists l
        JOIN shared_lists sl ON l.id = sl.list_id
        JOIN users u ON l.owner_id = u.id
        WHERE sl.user_id = ?
      `, [userId]);
      socket.emit('usersLists', { owned: ownedLists, shared: sharedLists });
    } catch (error) {
      console.error('Error creating new list:', error);
      socket.emit('error', 'Failed to create new list.');
    }
  });

  socket.on('addItem', async ({ listId, text }) => {
    const hasAccess = await getListItems(listId, userId);
    if (hasAccess === null) return socket.emit('error', 'Unauthorized to add item to this list.');

    try {
      const newItem = {
        id: generateUniqueId(),
        list_id: listId,
        text,
        checked: false,
        timestamp: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };
      await pool.execute(
        'INSERT INTO items (id, list_id, text, checked, timestamp) VALUES (?, ?, ?, ?, ?)',
        [newItem.id, newItem.list_id, newItem.text, newItem.checked, newItem.timestamp]
      );
      const updatedList = await getListItems(listId, userId);
      io.to(listId).emit('listUpdate', updatedList); // Broadcast to all clients in this list's room
      console.log(`Item added to list ${listId} by ${userId}:`, newItem.text);
    } catch (error) {
      console.error(`Error adding item to list ${listId}:`, error);
      socket.emit('error', 'Failed to add item.');
    }
  });

  socket.on('removeItem', async ({ listId, itemId }) => {
    const hasAccess = await getListItems(listId, userId);
    if (hasAccess === null) return socket.emit('error', 'Unauthorized to remove item from this list.');

    try {
      await pool.execute('DELETE FROM items WHERE id = ? AND list_id = ?', [itemId, listId]);
      const updatedList = await getListItems(listId, userId);
      io.to(listId).emit('listUpdate', updatedList);
      console.log(`Item removed from list ${listId} by ${userId}: ${itemId}`);
    } catch (error) {
      console.error(`Error removing item from list ${listId}:`, error);
      socket.emit('error', 'Failed to remove item.');
    }
  });

  socket.on('toggleItem', async ({ listId, itemId }) => {
    const hasAccess = await getListItems(listId, userId);
    if (hasAccess === null) return socket.emit('error', 'Unauthorized to toggle item in this list.');

    try {
      const [rows] = await pool.execute('SELECT checked FROM items WHERE id = ? AND list_id = ?', [itemId, listId]);
      if (rows.length > 0) {
        const currentCheckedStatus = rows[0].checked === 1;
        const newCheckedStatus = !currentCheckedStatus;
        const newTimestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

        await pool.execute(
          'UPDATE items SET checked = ?, timestamp = ? WHERE id = ? AND list_id = ?',
          [newCheckedStatus, newTimestamp, itemId, listId]
        );
        const updatedList = await getListItems(listId, userId);
        io.to(listId).emit('listUpdate', updatedList);
        console.log(`Item toggled in list ${listId} by ${userId}: ${itemId} to ${newCheckedStatus}`);
      }
    } catch (error) {
      console.error(`Error toggling item in list ${listId}:`, error);
      socket.emit('error', 'Failed to toggle item.');
    }
  });

  socket.on('shareList', async ({ listId, usernameToShareWith }) => {
    try {
      // 1. Check if the current user owns this list
      const [listOwner] = await pool.execute('SELECT owner_id, name FROM lists WHERE id = ?', [listId]);
      if (listOwner.length === 0 || listOwner[0].owner_id !== userId) {
        return socket.emit('error', 'You can only share lists you own.');
      }

      // 2. Find the user to share with
      const [targetUsers] = await pool.execute('SELECT id FROM users WHERE username = ?', [usernameToShareWith]);
      if (targetUsers.length === 0) {
        return socket.emit('error', `User '${usernameToShareWith}' not found.`);
      }
      const targetUserId = targetUsers[0].id;

      // Prevent sharing with self (though database PK would prevent duplicate entry, it's good UX)
      if (targetUserId === userId) {
        return socket.emit('error', 'Cannot share a list with yourself.');
      }

      // 3. Insert into shared_lists table
      await pool.execute('INSERT INTO shared_lists (list_id, user_id) VALUES (?, ?)',
        [listId, targetUserId]);
      console.log(`List ${listId} ('${listOwner[0].name}') shared by ${userId} with ${targetUserId} (${usernameToShareWith})`);
      socket.emit('shareSuccess', `List '${listOwner[0].name}' shared with ${usernameToShareWith}.`);

      // Optionally, notify the target user if they are online
      // (This would require tracking active sockets by userId, more advanced)

    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        socket.emit('error', `List is already shared with ${usernameToShareWith}.`);
      } else {
        console.error('Error sharing list:', error);
        socket.emit('error', 'Failed to share list.');
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

initializeDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
