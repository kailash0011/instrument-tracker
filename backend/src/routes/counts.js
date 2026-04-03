const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

function getNepalDate() {
  return new Date().toLocaleString('en-CA', { timeZone: 'Asia/Kathmandu' }).split(',')[0];
}

function getNepalHour() {
  return parseInt(new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kathmandu' }));
}

// POST /check
router.post('/check', authenticateToken, (req, res) => {
  try {
    const { date, shift, department_id } = req.body;
    const db = getDb();
    const session = db.prepare('SELECT cs.*, u.name as submitted_by_name FROM count_sessions cs LEFT JOIN users u ON cs.submitted_by = u.id WHERE cs.date = ? AND cs.shift = ? AND cs.department_id = ?').get(date, shift, department_id);
    res.json({
      exists: !!session,
      session: session || null,
      is_submitted: session ? session.is_submitted === 1 : false
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /session
router.post('/session', authenticateToken, (req, res) => {
  try {
    const { date, shift, department_id } = req.body;
    const db = getDb();

    const existing = db.prepare('SELECT * FROM count_sessions WHERE date = ? AND shift = ? AND department_id = ?').get(date, shift, department_id);
    if (existing) {
      if (existing.is_submitted) {
        return res.status(400).json({ error: 'Session already submitted' });
      }
      return res.json(existing);
    }

    const result = db.prepare('INSERT INTO count_sessions (date, shift, department_id) VALUES (?, ?, ?)').run(date, shift, department_id);
    const session = db.prepare('SELECT * FROM count_sessions WHERE id = ?').get(result.lastInsertRowid);
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /session/:id
router.get('/session/:id', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const id = req.params.id;

    const session = db.prepare('SELECT cs.*, d.name as dept_name FROM count_sessions cs JOIN departments d ON cs.department_id = d.id WHERE cs.id = ?').get(id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const instruments = db.prepare('SELECT * FROM instruments WHERE department_id = ?').all(session.department_id);
    const entries = db.prepare('SELECT * FROM count_entries WHERE session_id = ?').all(id);
    const entryMap = {};
    entries.forEach(e => { entryMap[e.instrument_id] = e; });

    const instrumentsWithEntries = instruments.map(inst => ({
      ...inst,
      entry: entryMap[inst.id] || { actual_count: 0, status: 'normal', remarks: '' }
    }));

    let submittedByUser = null;
    if (session.submitted_by) {
      submittedByUser = db.prepare('SELECT name FROM users WHERE id = ?').get(session.submitted_by);
    }

    res.json({
      ...session,
      submitted_by_name: submittedByUser ? submittedByUser.name : null,
      instruments: instrumentsWithEntries
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /entry
router.put('/entry', authenticateToken, (req, res) => {
  try {
    const { session_id, instrument_id, actual_count, status, remarks } = req.body;
    const db = getDb();

    const session = db.prepare('SELECT * FROM count_sessions WHERE id = ?').get(session_id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.is_submitted) return res.status(400).json({ error: 'Session already submitted' });

    db.prepare('INSERT INTO count_entries (session_id, instrument_id, actual_count, status, remarks) VALUES (?,?,?,?,?) ON CONFLICT(session_id, instrument_id) DO UPDATE SET actual_count=excluded.actual_count, status=excluded.status, remarks=excluded.remarks').run(session_id, instrument_id, actual_count, status || 'normal', remarks || '');

    const entry = db.prepare('SELECT * FROM count_entries WHERE session_id = ? AND instrument_id = ?').get(session_id, instrument_id);
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /submit/:sessionId
router.post('/submit/:sessionId', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const sessionId = req.params.sessionId;

    const session = db.prepare('SELECT * FROM count_sessions WHERE id = ?').get(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.is_submitted) return res.status(400).json({ error: 'Session already submitted' });

    const submittedAt = new Date().toISOString();
    db.prepare('UPDATE count_sessions SET is_submitted = 1, submitted_by = ?, submitted_at = ? WHERE id = ?').run(req.user.id, submittedAt, sessionId);

    const updated = db.prepare('SELECT * FROM count_sessions WHERE id = ?').get(sessionId);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /dashboard
router.get('/dashboard', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const today = getNepalDate();

    const departments = db.prepare('SELECT * FROM departments').all();
    const deptStatus = departments.map(dept => {
      const morning = db.prepare('SELECT cs.*, u.name as submitted_by_name FROM count_sessions cs LEFT JOIN users u ON cs.submitted_by = u.id WHERE cs.date=? AND cs.shift=? AND cs.department_id=?').get(today, 'morning', dept.id);
      const evening = db.prepare('SELECT cs.*, u.name as submitted_by_name FROM count_sessions cs LEFT JOIN users u ON cs.submitted_by = u.id WHERE cs.date=? AND cs.shift=? AND cs.department_id=?').get(today, 'evening', dept.id);
      return { ...dept, morning, evening };
    });

    const totalCounts = db.prepare('SELECT COUNT(*) as count FROM count_sessions WHERE date=? AND is_submitted=1').get(today).count;

    const mismatches = db.prepare(`
      SELECT ce.*, i.name as instrument_name, i.expected_quantity, d.name as dept_name, cs.shift, cs.date, u.name as submitted_by_name
      FROM count_entries ce
      JOIN instruments i ON ce.instrument_id = i.id
      JOIN count_sessions cs ON ce.session_id = cs.id
      JOIN departments d ON cs.department_id = d.id
      LEFT JOIN users u ON cs.submitted_by = u.id
      WHERE cs.date=? AND cs.is_submitted=1 AND ce.actual_count != i.expected_quantity
    `).all(today);

    const damageItems = db.prepare(`
      SELECT ce.*, i.name as instrument_name, i.expected_quantity, d.name as dept_name, cs.shift, cs.date, u.name as submitted_by_name
      FROM count_entries ce
      JOIN instruments i ON ce.instrument_id = i.id
      JOIN count_sessions cs ON ce.session_id = cs.id
      JOIN departments d ON cs.department_id = d.id
      LEFT JOIN users u ON cs.submitted_by = u.id
      WHERE cs.date=? AND cs.is_submitted=1 AND ce.status='damage'
    `).all(today);

    const sentToRepair = db.prepare(`
      SELECT ce.*, i.name as instrument_name, i.expected_quantity, d.name as dept_name, cs.shift, cs.date, u.name as submitted_by_name
      FROM count_entries ce
      JOIN instruments i ON ce.instrument_id = i.id
      JOIN count_sessions cs ON ce.session_id = cs.id
      JOIN departments d ON cs.department_id = d.id
      LEFT JOIN users u ON cs.submitted_by = u.id
      WHERE cs.date=? AND cs.is_submitted=1 AND ce.status='send_to_repair'
    `).all(today);

    const recentSessions = db.prepare(`
      SELECT cs.*, d.name as dept_name, u.name as submitted_by_name
      FROM count_sessions cs
      JOIN departments d ON cs.department_id = d.id
      LEFT JOIN users u ON cs.submitted_by = u.id
      WHERE cs.is_submitted=1
      ORDER BY cs.submitted_at DESC
      LIMIT 10
    `).all();

    res.json({
      date: today,
      departments: deptStatus,
      stats: {
        total_counts: totalCounts,
        mismatches: mismatches.length,
        damage_items: damageItems.length,
        sent_to_repair: sentToRepair.length
      },
      recent_sessions: recentSessions,
      mismatches,
      damage_items: damageItems,
      sent_to_repair: sentToRepair
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /history
router.get('/history', authenticateToken, (req, res) => {
  try {
    const { department_id, year_month } = req.query;
    if (!department_id || !year_month) {
      return res.status(400).json({ error: 'department_id and year_month are required' });
    }
    const db = getDb();

    const sessions = db.prepare(`
      SELECT cs.*, u.name as submitted_by_name, d.name as dept_name
      FROM count_sessions cs
      LEFT JOIN users u ON cs.submitted_by = u.id
      JOIN departments d ON cs.department_id = d.id
      WHERE cs.department_id = ? AND cs.date LIKE ? AND cs.is_submitted = 1
      ORDER BY cs.date, cs.shift
    `).all(department_id, `${year_month}%`);

    const result = sessions.map(session => {
      const entries = db.prepare(`
        SELECT ce.*, i.name as instrument_name, i.expected_quantity
        FROM count_entries ce
        JOIN instruments i ON ce.instrument_id = i.id
        WHERE ce.session_id = ?
      `).all(session.id);
      return { ...session, entries };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
