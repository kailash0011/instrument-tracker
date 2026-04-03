const express = require('express');
const ExcelJS = require('exceljs');
const { getDb } = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

function getHistoryData(department_id, year_month) {
  const db = getDb();

  const sessions = db.prepare(`
    SELECT cs.*, u.name as submitted_by_name, d.name as dept_name
    FROM count_sessions cs
    LEFT JOIN users u ON cs.submitted_by = u.id
    JOIN departments d ON cs.department_id = d.id
    WHERE cs.department_id = ? AND cs.date LIKE ? AND cs.is_submitted = 1
    ORDER BY cs.date, cs.shift
  `).all(department_id, `${year_month}%`);

  return sessions.map(session => {
    const entries = db.prepare(`
      SELECT ce.*, i.name as instrument_name, i.expected_quantity
      FROM count_entries ce
      JOIN instruments i ON ce.instrument_id = i.id
      WHERE ce.session_id = ?
    `).all(session.id);
    return { ...session, entries };
  });
}

// GET /excel
router.get('/excel', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { department_id, year_month } = req.query;
    if (!department_id || !year_month) {
      return res.status(400).json({ error: 'department_id and year_month are required' });
    }

    const db = getDb();
    const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(department_id);
    const sessions = getHistoryData(department_id, year_month);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Count Data');

    // Title row
    worksheet.mergeCells('A1:H1');
    worksheet.getCell('A1').value = `OT Instrument Tracker - ${dept ? dept.name : ''} - ${year_month}`;
    worksheet.getCell('A1').font = { bold: true, size: 14 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // Headers
    worksheet.addRow(['Date', 'Shift', 'Instrument Name', 'Expected', 'Actual Count', 'Status', 'Remarks', 'Counted By']);
    worksheet.getRow(2).font = { bold: true };
    worksheet.getRow(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' }
    };

    // Data rows
    sessions.forEach(session => {
      session.entries.forEach(entry => {
        worksheet.addRow([
          session.date,
          session.shift,
          entry.instrument_name,
          entry.expected_quantity,
          entry.actual_count,
          entry.status,
          entry.remarks,
          session.submitted_by_name || ''
        ]);
      });
    });

    // Column widths
    worksheet.columns = [
      { width: 15 },
      { width: 12 },
      { width: 25 },
      { width: 12 },
      { width: 14 },
      { width: 18 },
      { width: 30 },
      { width: 20 }
    ];

    const filename = `instrument-tracker-${dept ? dept.name.replace(/\s+/g, '-') : 'dept'}-${year_month}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /print
router.get('/print', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { department_id, year_month } = req.query;
    if (!department_id || !year_month) {
      return res.status(400).json({ error: 'department_id and year_month are required' });
    }

    const db = getDb();
    const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(department_id);
    const sessions = getHistoryData(department_id, year_month);

    res.json({ dept, sessions, year_month });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
