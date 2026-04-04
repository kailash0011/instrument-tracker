const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { department_id } = req.query;
    let instruments;
    if (department_id) {
      instruments = db.prepare(`
        SELECT i.*, d.name as department_name
        FROM instruments i
        LEFT JOIN departments d ON i.department_id = d.id
        WHERE i.department_id = ?
        ORDER BY i.name
      `).all(department_id);
    } else {
      instruments = db.prepare(`
        SELECT i.*, d.name as department_name
        FROM instruments i
        LEFT JOIN departments d ON i.department_id = d.id
        ORDER BY i.name
      `).all();
    }
    res.json(instruments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, expected_quantity, department_id } = req.body;
    if (!name || !expected_quantity || !department_id) {
      return res.status(400).json({ error: 'Name, expected_quantity, and department_id are required' });
    }
    const db = getDb();
    const result = db.prepare('INSERT INTO instruments (department_id, name, expected_quantity) VALUES (?, ?, ?)').run(department_id, name, expected_quantity);
    const instrument = db.prepare(`
      SELECT i.*, d.name as department_name
      FROM instruments i
      LEFT JOIN departments d ON i.department_id = d.id
      WHERE i.id = ?
    `).get(result.lastInsertRowid);
    res.json(instrument);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, expected_quantity, department_id } = req.body;
    const db = getDb();
    db.prepare('UPDATE instruments SET name = ?, expected_quantity = ?, department_id = ? WHERE id = ?').run(name, expected_quantity, department_id, req.params.id);
    const instrument = db.prepare(`
      SELECT i.*, d.name as department_name
      FROM instruments i
      LEFT JOIN departments d ON i.department_id = d.id
      WHERE i.id = ?
    `).get(req.params.id);
    res.json(instrument);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM count_entries WHERE instrument_id = ?').run(req.params.id);
    db.prepare('DELETE FROM instruments WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
