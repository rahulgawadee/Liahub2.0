const Organization = require("../models/Organization");

/**
 * Get list of all companies (for schools to assign jobs to)
 */
const listCompanies = async (req, res, next) => {
  try {
    const organizations = await Organization.find({ type: "company", active: true })
      .select("name description contact")
      .sort({ name: 1 });

    // Enrich with company profile data
    const User = require('../models/User');
    const enrichedCompanies = await Promise.all(
      organizations.map(async (org) => {
        const companyUser = await User.findOne({
          organization: org._id,
          roles: { $in: ['company_employer', 'company_hiring_manager', 'company_founder', 'company_ceo'] },
          'companyProfile': { $exists: true }
        }).select('companyProfile name roles').lean();

        const companyName = companyUser?.companyProfile?.companyName || org.name;
        
        const fullName = companyUser
          ? [companyUser.name?.first, companyUser.name?.last].filter(Boolean).join(' ') || null
          : null;

        return {
          id: org._id,
          name: companyName,
          description: org.description,
          contact: org.contact,
          companyProfile: companyUser?.companyProfile,
          userRoles: companyUser?.roles,
          userName: fullName,
        };
      })
    );

    res.json({ companies: enrichedCompanies });
  } catch (error) {
    next(error);
  }
};

/**
 * Get organizations by type
 */
const listOrganizations = async (req, res, next) => {
  try {
    const { type } = req.query;
    const query = { active: true };
    
    if (type) {
      query.type = type;
    }
    
    const organizations = await Organization.find(query)
      .select("name type description contact")
      .sort({ name: 1 });
    
    res.json({ organizations });
  } catch (error) {
    next(error);
  }
};

/**
 * Get organization by id
 */
const getOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;
    let org = await Organization.findById(id).lean();
    if (!org) return res.status(404).json({ message: 'Organization not found' });

    // Always try to populate with fresh company profile data for dynamic updates
    if (org.type === 'company') {
      const User = require('../models/User');
      const companyUser = await User.findOne({
        organization: id,
        roles: { $in: ['company_employer', 'company_hiring_manager', 'company_founder', 'company_ceo'] },
        'companyProfile': { $exists: true }
      }).select('companyProfile').lean();

      if (companyUser && companyUser.companyProfile) {
        const profile = companyUser.companyProfile;
        // Always update organization with latest profile data
        org.metadata = org.metadata || {};
        org.metadata.companyRegNo = profile.companyRegNo || org.metadata.companyRegNo;
        org.metadata.contactPerson = profile.contactPerson || org.metadata.contactPerson;
        org.metadata.roles = profile.roles || org.metadata.roles;

        org.contact = org.contact || {};
        org.contact.email = profile.companyEmail || org.contact.email;
        org.contact.phone = profile.companyPhone || org.contact.phone;
        org.contact.website = profile.website || org.contact.website;

        org.address = org.address || {};
        org.address.city = profile.city || org.address.city;
        org.address.country = profile.country || org.address.country;

        // Update the organization in database for future requests
        await Organization.findByIdAndUpdate(id, {
          $set: {
            metadata: org.metadata,
            contact: org.contact,
            address: org.address
          }
        });
      }
    }

    res.json({ organization: org });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listCompanies,
  listOrganizations,
  getOrganization,
};
