const bcrypt = require('bcryptjs');
const { getDb } = require('./database');

async function runSeed() {
  const db = getDb();

  // Create admin if not exists
  const adminExists = db.prepare("SELECT id FROM users WHERE username = 'Admin'").get();
  if (!adminExists) {
    const passwordHash = await bcrypt.hash('Admin123', 10);
    db.prepare("INSERT INTO users (name, username, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)").run('Admin', 'Admin', '', passwordHash, 'admin');
    console.log('Admin user created');
  }

  // Create departments if not exist
  const deptCount = db.prepare('SELECT COUNT(*) as count FROM departments').get().count;
  if (deptCount === 0) {
    const deptNames = ['Surgery', 'Gyane', 'Ortho', 'Extra Instruments', 'Sutures'];
    const insertDept = db.prepare('INSERT INTO departments (name) VALUES (?)');
    deptNames.forEach(name => insertDept.run(name));
    console.log('Departments created');

    const getDept = (name) => db.prepare('SELECT id FROM departments WHERE name = ?').get(name);
    const insertInstrument = db.prepare('INSERT INTO instruments (department_id, name, expected_quantity) VALUES (?, ?, ?)');

    // Surgery
    const surgery = getDept('Surgery');
    [
      ['Scalpel Handle', 5],
      ['Tissue Forceps', 4],
      ['Artery Forceps', 10],
      ['Needle Holder', 6],
      ['Scissors', 4],
      ['Retractors', 3],
      ['Suction Tip', 2],
      ['Towel Clips', 8]
    ].forEach(([name, qty]) => insertInstrument.run(surgery.id, name, qty));

    // Gyane
    const gyane = getDept('Gyane');
    [
      ['Sims Speculum', 3],
      ['Cusco Speculum', 4],
      ['Uterine Sound', 2],
      ['Dilators', 10],
      ['Curette', 3],
      ['Ovum Forceps', 4],
      ['Volsellum', 2],
      ['Green Armytage Forceps', 6]
    ].forEach(([name, qty]) => insertInstrument.run(gyane.id, name, qty));

    // Ortho
    const ortho = getDept('Ortho');
    [
      ['Bone Cutter', 3],
      ['Bone Nibbler', 2],
      ['Periosteal Elevator', 4],
      ['Mallet', 2],
      ['Chisels', 5],
      ['Drill', 2],
      ['Bone Holding Forceps', 4],
      ['Retractors', 6]
    ].forEach(([name, qty]) => insertInstrument.run(ortho.id, name, qty));

    // Extra Instruments
    const extra = getDept('Extra Instruments');
    [
      ['Electrocautery Pencil', 4],
      ['Diathermy Plate', 2],
      ['Tourniquet', 3],
      ['Irrigation Set', 5],
      ['Suction Tube', 4]
    ].forEach(([name, qty]) => insertInstrument.run(extra.id, name, qty));

    // Sutures
    const sutures = getDept('Sutures');
    [
      ['Vicryl 1', 10],
      ['Vicryl 2-0', 10],
      ['Prolene 1', 8],
      ['Prolene 2-0', 8],
      ['Chromic Catgut', 6],
      ['Silk 2-0', 10]
    ].forEach(([name, qty]) => insertInstrument.run(sutures.id, name, qty));

    console.log('Instruments seeded');
  }
}

module.exports = { runSeed };
