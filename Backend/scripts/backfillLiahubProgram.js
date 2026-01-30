require('dotenv').config();
const mongoose = require('mongoose');
const SchoolRecord = require('../src/models/SchoolRecord');

const escapeRegex = (value = '') => String(value || '').trim();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to DB');

    const cursor = SchoolRecord.find({ type: 'liahub_company' }).cursor();
    let updated = 0;
    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      const data = doc.data || {};
      // if program already exists, skip
      if (data.program || data.programme) continue;

      // try to find likely fields
      const possible = data.program || data.programme || data.programName || data.programmeName || data.programs || '';
      if (!possible) continue;

      // set canonical 'program' key
      doc.data = doc.data || {};
      doc.data.program = String(possible).trim();
      await doc.save();
      updated++;
    }

    console.log('Backfill complete. Updated:', updated);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
