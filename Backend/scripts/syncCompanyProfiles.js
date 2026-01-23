const mongoose = require('mongoose');
const User = require('../src/models/User');
const Organization = require('../src/models/Organization');

async function syncCompanyProfilesToOrganizations() {
  try {
    console.log('Starting sync of company profiles to organizations...');

    // Find all organizations of type company
    const companies = await Organization.find({ type: "company", active: true });

    console.log(`Found ${companies.length} company organizations`);

    for (const org of companies) {
      // Find users with this organization and company roles
      const companyUsers = await User.find({
        organization: org._id,
        roles: { $in: ['company_employer', 'company_hiring_manager', 'company_founder', 'company_ceo'] },
        'companyProfile': { $exists: true }
      });

      if (companyUsers.length === 0) {
        console.log(`No company users found for organization ${org.name}`);
        continue;
      }

      // Use the first company user (assuming one main user per company)
      const user = companyUsers[0];
      const profile = user.companyProfile;

      // Prepare update data
      const update = {
        active: true,
      };

      const contact = {};
      if (profile.companyEmail) contact.email = profile.companyEmail;
      if (profile.companyPhone) contact.phone = profile.companyPhone;
      if (profile.website) contact.website = profile.website;
      if (Object.keys(contact).length) update.contact = contact;

      const address = {};
      if (profile.city) address.city = profile.city;
      if (profile.country) address.country = profile.country;
      if (Object.keys(address).length) update.address = address;

      const metadata = {};
      if (profile.companyRegNo) metadata.companyRegNo = profile.companyRegNo;
      if (profile.contactPerson) metadata.contactPerson = profile.contactPerson;
      if (profile.roles && profile.roles.length) metadata.roles = profile.roles;
      if (Object.keys(metadata).length) update.metadata = metadata;

      // Update the organization
      await Organization.findByIdAndUpdate(org._id, { $set: update });

      console.log(`Updated organization ${org.name} with company profile data`);
    }

    console.log('Sync completed successfully');
  } catch (error) {
    console.error('Error during sync:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Connect to database
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/liahub';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
  syncCompanyProfilesToOrganizations();
}).catch(err => {
  console.error('MongoDB connection error:', err);
});