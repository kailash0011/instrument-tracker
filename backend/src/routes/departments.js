const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const departments = db.prepare('SELECT * FROM departments ORDER BY name').all();
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const db = getDb();
    const result = db.prepare('INSERT INTO departments (name) VALUES (?)').run(name);
    const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(result.lastInsertRowid);
    res.json(dept);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const db = getDb();
    db.prepare('UPDATE departments SET name = ? WHERE id = ?').run(name, req.params.id);
    const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(req.params.id);
    res.json(dept);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const id = req.params.id;

    // Delete related entries first
    const sessions = db.prepare('SELECT id FROM count_sessions WHERE department_id = ?').all(id);
    sessions.forEach(s => {
      db.prepare('DELETE FROM count_entries WHERE session_id = ?').run(s.id);
    });
    db.prepare('DELETE FROM count_sessions WHERE department_id = ?').run(id);
    db.prepare('DELETE FROM instruments WHERE department_id = ?').run(id);
    db.prepare('DELETE FROM departments WHERE id = ?').run(id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
