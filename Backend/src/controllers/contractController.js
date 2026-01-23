const Contract = require("../models/Contract");
const ContractTemplate = require("../models/ContractTemplate");
const Organization = require("../models/Organization");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { sendEmail } = require("../services/emailService");
const logger = require("../utils/logger");

/**
 * Create a new contract (by education manager/admin)
 */
const createContract = async (req, res, next) => {
  try {
    const { 
      organizationId, 
      contractType, 
      contractContent, 
      contractFileUrl,
      schoolSignature,
      metadata 
    } = req.body;

    if (!organizationId) {
      return res.status(400).json({ message: "Organization ID is required" });
    }

    if (!schoolSignature) {
      return res.status(400).json({ message: "School signature is required" });
    }

    // Verify organization exists
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    // Create contract
    const contract = await Contract.create({
      organization: organizationId,
      createdBy: req.user.id,
      contractType: contractType || "text",
      contractContent,
      contractFileUrl,
      schoolSignature,
      schoolSignedBy: req.user.id,
      schoolSignedAt: new Date(),
      metadata: metadata || {},
    });

    // Find company users to notify
    const companyUsers = await User.find({
      organization: organizationId,
      roles: { $in: ["company_employer", "company_hiring_manager", "company_founder", "company_ceo"] },
    }).select("_id email name");

    // Send email notification to company
    for (const user of companyUsers) {
      const email = user.email || user.contact?.email;
      if (email) {
        try {
          await sendEmail({
            to: email,
            subject: "New Contract Awaiting Your Signature - LiaHub",
            html: `
              <p>Hello ${user.name?.first || ""},</p>
              <p>A new contract has been created for ${organization.name} and requires your signature.</p>
              <p>Please log in to LiaHub to review and sign the contract.</p>
              <p><strong>Note:</strong> You will be prompted to sign the contract upon your next login.</p>
              <br/>
              <p>Best regards,<br/>The LiaHub Team</p>
            `,
          });
        } catch (emailError) {
          logger.warn("Failed to send contract email", emailError);
        }
      }

      // Create in-app notification
      try {
        await Notification.create({
          recipient: user._id,
          actor: req.user.id,
          type: "contract_created",
          entity: { kind: "Contract", id: contract._id },
          payload: {
            contractId: contract._id.toString(),
            organizationName: organization.name,
          },
        });
      } catch (notifError) {
        logger.warn("Failed to create contract notification", notifError);
      }
    }

    res.status(201).json(contract);
  } catch (error) {
    next(error);
  }
};

/**
 * Get contracts for current user's organization or based on role
 */
const getContracts = async (req, res, next) => {
  try {
    const user = req.user;
    const userOrg = user.organization;

    let query = {};

    // Platform admin can see all contracts
    if (user.roles?.includes('platform_admin')) {
      // No filter - see all contracts
    }
    // Education staff can see all contracts for their organization
    else if (user.roles?.some(role => ['school_admin', 'education_manager', 'teacher', 'university_admin', 'university_manager'].includes(role))) {
      if (!userOrg) {
        return res.status(400).json({ message: "Organization context missing" });
      }
      query.organization = userOrg;
    }
    // Company users can see contracts for their organization
    else if (user.roles?.some(role => ['company_employer', 'company_hiring_manager', 'company_founder', 'company_ceo'].includes(role))) {
      if (!userOrg) {
        return res.status(400).json({ message: "Organization context missing" });
      }
      query.organization = userOrg;
    }
    else {
      return res.status(403).json({ message: "Unauthorized to view contracts" });
    }

    const contracts = await Contract.find(query)
      .populate("createdBy", "name email")
      .populate("schoolSignedBy", "name email")
      .populate("companySignedBy", "name email")
      .populate("organization", "name type")
      .sort({ createdAt: -1 });

    res.json(contracts);
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending contract for company (first login check)
 */
const getPendingContract = async (req, res, next) => {
  try {
    const organization = req.user.organization;
    if (!organization) {
      return res.json({ contract: null, hasPendingContract: false });
    }

    // Check if user is from company
    const companyRoles = ["company_employer", "company_hiring_manager", "company_founder", "company_ceo"];
    const isCompanyUser = req.user.roles?.some(role => companyRoles.includes(role));
    
    if (!isCompanyUser) {
      return res.json({ contract: null, hasPendingContract: false });
    }

    // Find pending contract
    const contract = await Contract.findOne({ 
      organization, 
      status: "pending" 
    })
      .populate("createdBy", "name email")
      .populate("schoolSignedBy", "name email")
      .populate("organization", "name")
      .sort({ createdAt: -1 });

    res.json({ 
      contract, 
      hasPendingContract: !!contract 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sign contract (by company)
 */
const signContract = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { companySignature } = req.body;

    if (!companySignature) {
      return res.status(400).json({ message: "Company signature is required" });
    }

    const contract = await Contract.findById(id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Verify user is from the correct organization
    if (contract.organization.toString() !== req.user.organization?.toString()) {
      return res.status(403).json({ message: "Unauthorized to sign this contract" });
    }

    // Update contract with company signature
    contract.companySignature = companySignature;
    contract.companySignedBy = req.user.id;
    contract.companySignedAt = new Date();
    contract.status = "signed";
    await contract.save();

    // Update user's organization to mark as verified
    await Organization.findByIdAndUpdate(contract.organization, {
      $set: { "metadata.contractSigned": true, "metadata.verifiedAt": new Date() }
    });

    // Notify education manager/admin
    try {
      await Notification.create({
        recipient: contract.createdBy,
        actor: req.user.id,
        type: "contract_signed",
        entity: { kind: "Contract", id: contract._id },
        payload: {
          contractId: contract._id.toString(),
          signedBy: `${req.user.name?.first || ""} ${req.user.name?.last || ""}`.trim(),
        },
      });
    } catch (notifError) {
      logger.warn("Failed to create contract signed notification", notifError);
    }

    res.json(contract);
  } catch (error) {
    next(error);
  }
};

/**
 * Get contract by ID
 */
const getContractById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contract = await Contract.findById(id)
      .populate("createdBy", "name email")
      .populate("schoolSignedBy", "name email")
      .populate("companySignedBy", "name email")
      .populate("organization", "name type");

    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Verify access
    const userOrg = req.user.organization?.toString();
    const contractOrg = contract.organization?._id?.toString();
    
    if (userOrg !== contractOrg && contract.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to view this contract" });
    }

    res.json(contract);
  } catch (error) {
    next(error);
  }
};

/**
 * Update contract (before company signs)
 */
const updateContract = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { contractContent, contractFileUrl, schoolSignature, metadata } = req.body;

    const contract = await Contract.findById(id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Only creator can update
    if (contract.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to update this contract" });
    }

    // Can't update signed contracts
    if (contract.status === "signed") {
      return res.status(400).json({ message: "Cannot update signed contract" });
    }

    // Update fields
    if (contractContent !== undefined) contract.contractContent = contractContent;
    if (contractFileUrl !== undefined) contract.contractFileUrl = contractFileUrl;
    if (schoolSignature) {
      contract.schoolSignature = schoolSignature;
      contract.schoolSignedAt = new Date();
    }
    if (metadata) contract.metadata = { ...contract.metadata, ...metadata };

    await contract.save();
    res.json(contract);
  } catch (error) {
    next(error);
  }
};

/**
 * Get active contract template for school
 */
const getContractTemplate = async (req, res, next) => {
  try {
    const organization = req.user.organization;
    if (!organization) {
      return res.status(400).json({ message: "Organization context missing" });
    }

    const template = await ContractTemplate.findOne({ 
      school: organization, 
      isActive: true 
    })
      .populate("createdBy", "name email")
      .populate("lastModifiedBy", "name email")
      .populate("schoolSignedBy", "name email");

    if (!template) {
      return res.json({ template: null });
    }

    res.json({ template });
  } catch (error) {
    next(error);
  }
};

/**
 * Create or update contract template
 */
const upsertContractTemplate = async (req, res, next) => {
  try {
    const organization = req.user.organization;
    if (!organization) {
      return res.status(400).json({ message: "Organization context missing" });
    }

    const { 
      contractType, 
      contractContent, 
      contractFileUrl,
      schoolSignature,
      title,
      description 
    } = req.body;

    if (!schoolSignature) {
      return res.status(400).json({ message: "School signature is required" });
    }

    // Deactivate old template
    await ContractTemplate.updateMany(
      { school: organization, isActive: true },
      { $set: { isActive: false } }
    );

    // Find existing template or create new
    let template = await ContractTemplate.findOne({ 
      school: organization 
    }).sort({ createdAt: -1 });

    if (template) {
      // Update existing
      template.contractType = contractType || "text";
      template.contractContent = contractContent;
      template.contractFileUrl = contractFileUrl;
      template.schoolSignature = schoolSignature;
      template.schoolSignedBy = req.user.id;
      template.schoolSignedAt = new Date();
      template.title = title || template.title;
      template.description = description || template.description;
      template.isActive = true;
      template.version += 1;
      template.lastModifiedBy = req.user.id;
      await template.save();
    } else {
      // Create new
      template = await ContractTemplate.create({
        school: organization,
        contractType: contractType || "text",
        contractContent,
        contractFileUrl,
        schoolSignature,
        schoolSignedBy: req.user.id,
        schoolSignedAt: new Date(),
        title: title || "Company Partnership Agreement",
        description,
        isActive: true,
        version: 1,
        createdBy: req.user.id,
      });
    }

    res.json({ template });
  } catch (error) {
    next(error);
  }
};

/**
 * Download contract as PDF or text file
 */
const downloadContract = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contract = await Contract.findById(id)
      .populate("createdBy", "name email")
      .populate("schoolSignedBy", "name email")
      .populate("companySignedBy", "name email")
      .populate("organization", "name type");

    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Verify access
    const userOrg = req.user.organization?.toString();
    const contractOrg = contract.organization?._id?.toString();
    
    if (userOrg !== contractOrg && contract.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to download this contract" });
    }

    // For PDF contracts, redirect to file
    if (contract.contractType === 'pdf' && contract.contractFileUrl) {
      return res.json({ 
        type: 'pdf',
        url: contract.contractFileUrl,
        filename: `contract_${contract._id}.pdf`
      });
    }

    // For text contracts, return formatted data for frontend to generate PDF
    const contractData = {
      type: 'text',
      title: contract.metadata?.contractTitle || 'Company Partnership Agreement',
      content: contract.contractContent,
      organization: contract.organization?.name,
      createdAt: contract.createdAt,
      schoolSignature: contract.schoolSignature,
      schoolSignedBy: `${contract.schoolSignedBy?.name?.first || ''} ${contract.schoolSignedBy?.name?.last || ''}`.trim(),
      schoolSignedAt: contract.schoolSignedAt,
      companySignature: contract.companySignature,
      companySignedBy: contract.companySignedBy ? `${contract.companySignedBy?.name?.first || ''} ${contract.companySignedBy?.name?.last || ''}`.trim() : null,
      companySignedAt: contract.companySignedAt,
      status: contract.status,
    };

    res.json(contractData);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createContract,
  getContracts,
  getPendingContract,
  signContract,
  getContractById,
  updateContract,
  getContractTemplate,
  upsertContractTemplate,
  downloadContract,
};
