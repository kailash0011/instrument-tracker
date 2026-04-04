const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
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

// PUT /:id/reset-password
router.put('/:id/reset-password', authenticateToken, requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'staff'").get(req.params.id);
    if (!user) return res.status(404).json({ error: 'Staff member not found' });

    // Exclude visually ambiguous characters (I, l, O, 0, 1) for readability
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const maxUnbiased = 256 - (256 % chars.length);
    let tempPassword = '';
    while (tempPassword.length < 8) {
      const byte = crypto.randomBytes(1)[0];
      if (byte < maxUnbiased) tempPassword += chars[byte % chars.length];
    }

    const passwordHash = bcrypt.hashSync(tempPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, req.params.id);

    res.json({ temp_password: tempPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
