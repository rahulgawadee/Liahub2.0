/**
 * One-time script to sync Organization (companies) to SchoolRecords
 * Run this with: node sync-companies-to-schoolrecords.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const Organization = require('./src/models/Organization');
const SchoolRecord = require('./src/models/SchoolRecord');
const User = require('./src/models/User');

async function syncCompaniesToSchoolRecords() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI or MONGO_URI not found in .env file');
    }
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get all school organizations (to find which school each company belongs to)
    const schools = await Organization.find({ type: 'school', active: true }).lean();
    console.log(`Found ${schools.length} schools`);

    // For each school, find companies and create SchoolRecords
    for (const school of schools) {
      console.log(`\nProcessing school: ${school.name} (${school._id})`);

      // Find all companies (you might need to adjust this query based on your data)
      // For now, we'll find all active companies
      const companies = await Organization.find({ type: 'company', active: true }).lean();
      console.log(`  Found ${companies.length} companies total`);

      // Create SchoolRecord for each company
      for (const company of companies) {
        // Check if SchoolRecord already exists
        const existing = await SchoolRecord.findOne({
          organization: school._id,
          type: 'company',
          'data.business': company.name
        });

        if (existing) {
          console.log(`  - SchoolRecord already exists for ${company.name}`);
          continue;
        }

        // Get company user for additional info
        const companyUser = await User.findOne({
          organization: company._id,
          roles: { $in: ['company_employer', 'company_hiring_manager', 'company_founder', 'company_ceo'] }
        }).select('companyProfile contact name').lean();

        // Create SchoolRecord
        const recordData = new Map();
        recordData.set('business', companyUser?.companyProfile?.companyName || company.name);
        recordData.set('name', companyUser?.companyProfile?.companyName || company.name);
        recordData.set('contactPerson', companyUser?.companyProfile?.contactPerson || '');
        recordData.set('email', companyUser?.companyProfile?.companyEmail || company.contact?.email || '');
        recordData.set('companyEmail', companyUser?.companyProfile?.companyEmail || company.contact?.email || '');
        recordData.set('phone', companyUser?.companyProfile?.companyPhone || company.contact?.phone || '');
        recordData.set('contactNumber', companyUser?.companyProfile?.companyPhone || company.contact?.phone || '');
        recordData.set('place', companyUser?.companyProfile?.city || company.address?.city || '');
        recordData.set('location', companyUser?.companyProfile?.city || company.address?.city || '');
        recordData.set('orgNumber', companyUser?.companyProfile?.companyRegNo || company.metadata?.companyRegNo || '');

        const schoolRecord = await SchoolRecord.create({
          organization: school._id,
          type: 'company',
          data: recordData,
          status: 'active'
        });

        console.log(`  ✓ Created SchoolRecord for ${company.name} (ID: ${schoolRecord._id})`);
      }
    }

    console.log('\n✅ Sync completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the sync
syncCompaniesToSchoolRecords();
