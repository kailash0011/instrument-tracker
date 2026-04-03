const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const staff = db.prepare("SELECT id, name, username, phone, is_blocked, created_at FROM users WHERE role = 'staff'").all();
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id/block
router.put('/:id/block', authenticateToken, requireAdmin, (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE users SET is_blocked = 1 WHERE id = ?').run(req.params.id);
    const user = db.prepare('SELECT id, name, username, phone, is_blocked, created_at FROM users WHERE id = ?').get(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id/unblock
router.put('/:id/unblock', authenticateToken, requireAdmin, (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE users SET is_blocked = 0 WHERE id = ?').run(req.params.id);
    const user = db.prepare('SELECT id, name, username, phone, is_blocked, created_at FROM users WHERE id = ?').get(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
