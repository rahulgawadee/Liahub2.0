# Company Dropdown Feature Implementation

## Overview
This document describes the company dropdown feature for the student table in the LiaHub dashboard. When adding or editing a student, users can now select a company from a dropdown list that displays all companies previously imported via Excel.

## Changes Made

### 1. Backend Database Model
**File**: `Backend/src/models/SchoolRecord.js`
- Added two new fields to the SchoolRecord schema:
  - `assignedCompanyId`: Reference to a company SchoolRecord (ObjectId)
  - `assignedCompanyName`: String field to store company name

### 2. Backend API Endpoint
**File**: `Backend/src/routes/dashboardRoutes.js` & `Backend/src/controllers/dashboardController.js`
- Added new GET endpoint: `/dashboard/school/companies-dropdown`
- This endpoint fetches all companies (type: 'company', 'liahub_company', or 'lead_company') for the authenticated school
- Returns a list of companies with name, location, ID, and type
- Automatically deduplicates companies by name

### 3. Backend Controller Updates
**File**: `Backend/src/controllers/dashboardController.js`
- Updated `createSchoolRecord()`:
  - Now saves `assignedCompanyId` from the request to both the data map and the direct record field
  
- Updated `updateSchoolRecord()`:
  - Now saves `assignedCompanyId` from the request for student records
  - Properly updates the company reference when a student's company is changed

- Updated `mapRecordToRow()`:
  - Student rows now include `assignedCompanyId` from the record object (not just from data)
  - This ensures the company reference is properly serialized

### 4. Frontend Section Definitions
**File**: `src/Components/table/sectionDefinitions.js`
- Added `companySelect` field to the students section columns:
  - Type: 'select' with dynamic options
  - Marked as `isCompanyDropdown: true` and `dynamicOptions: true`
  - This field is not included in the data payload (excluded via the buildRecordPayloadForSection logic)

### 5. Frontend Form Component
**File**: `src/Components/table/DataTable.jsx`
- Updated companies list fetch to use the new `/dashboard/school/companies-dropdown` endpoint
- Added `cleanupmethod in the useEffect to prevent memory leaks
- Updated the RecordEditorDialog form rendering:
  - Added special handling for `companySelect` field (company dropdown)
  - When a company is selected, the `applyCompanyAutofill()` function is called
  - This populates related fields (placement, location, contact person, etc.) from the selected company
  - The `placement` field is now read-only and auto-filled from the dropdown selection
  - Displays company location alongside company name in dropdown options

## How It Works

### Adding a Student with Company Selection
1. User clicks "Add" button in Students section
2. Form dialog opens with all available fields
3. User selects a program and enters student details
4. User clicks on the "Company (Select from list)" dropdown
5. All companies are displayed with their names and locations
6. User selects a company
7. System automatically fetches company details and populates:
   - Placement (company name)
   - Location (city/country)
   - Contact Person
   - Role
   - Email
   - Phone
   - Org Number
8. User reviews the auto-filled fields and can modify if needed
9. User clicks "Save changes"
10. Student record is created with the company reference

### Editing a Student's Company
1. User clicks edit icon on a student row
2. Form dialog opens with existing student data
3. User can change the company selection in the dropdown
4. All related fields are automatically updated
5. User clicks "Save changes"
6. Student record is updated with the new company reference

### Deleting a Student
- Uses existing delete functionality
- Company reference is also deleted with the student record

### Data Flow
```
Frontend Form (companySelect)
    ↓
Form values include: companySelect (company ID)
    ↓
buildRecordPayloadForSection() extracts companySelect
    ↓
Payload includes: assignedCompanyId
    ↓
Backend createSchoolRecord() or updateSchoolRecord()
    ↓
Saves to SchoolRecord.assignedCompanyId (direct field)
    ↓
Saves to SchoolRecord.data.assignedCompanyId (data map)
    ↓
mapRecordToRow() retrieves both fields
    ↓
Response includes assignedCompanyId
    ↓
Frontend displays in table
```

## CRUD Operations Supported

### ✅ Create (Add)
- Select company from dropdown when adding a student
- Company ID and name are saved to the student record

### ✅ Read (Fetch)
- Company dropdown endpoint returns all available companies
- Student records include assignedCompanyId and assignedCompanyName
- Company details can be populated in the form

### ✅ Update (Edit)
- When editing a student, can change the selected company
- All related fields are updated accordingly
- Company reference is updated in the database

### ✅ Delete
- When deleting a student, the company reference is deleted with it
- Uses existing delete functionality

## Features

1. **Dynamic Dropdown**: Companies are fetched from the server and displayed in a dropdown
2. **Auto-fill**: When a company is selected, related fields are automatically populated
3. **Search/Refresh**: Users can refresh the companies list to see newly added companies
4. **Deduplication**: Duplicate companies are automatically removed from the dropdown
5. **Read-only Fields**: Auto-filled fields are read-only to prevent accidental modification
6. **Fallback**: If API fails, uses cached company data from the initial fetch

## Testing Checklist

- [ ] Add a new student and select a company from dropdown
- [ ] Verify that company details (location, contact, etc.) are auto-filled
- [ ] Verify that the student record is created with the company reference
- [ ] Edit an existing student and change the company
- [ ] Verify that company details are updated when changed
- [ ] Delete a student with a company assignment
- [ ] Verify that the company reference is properly stored in database
- [ ] Upload an Excel file with companies
- [ ] Verify that newly added companies appear in the dropdown after refresh
- [ ] Test with multiple companies to ensure deduplication works
- [ ] Test reading the student list to ensure company data is returned correctly

## Database Queries

To verify the implementation, you can run these queries in MongoDB:

```javascript
// Find all students with company assignments
db.schoolrecords.find({ type: 'student', assignedCompanyId: { $exists: true, $ne: null } })

// Count students with company assignments
db.schoolrecords.countDocuments({ type: 'student', assignedCompanyId: { $exists: true, $ne: null } })

// Find a specific student and show company reference
db.schoolrecords.findOne({ type: 'student', _id: ObjectId('...') })

// Show all companies available for dropdown
db.schoolrecords.find({ $or: [{ type: 'company' }, { type: 'liahub_company' }, { type: 'lead_company' }], status: 'active' })
```

## API Endpoints

### Get Companies for Dropdown
```
GET /dashboard/school/companies-dropdown
Authorization: Bearer {token}
```

Response:
```json
{
  "companies": [
    {
      "id": "ObjectId",
      "name": "Company Name",
      "location": "City, Country",
      "type": "company|liahub_company|lead_company",
      "data": { ... }
    }
  ],
  "total": 5
}
```

### Create/Update Student with Company
```
POST /dashboard/school/records
or
PUT /dashboard/school/records/:id

Request:
{
  "type": "student",
  "status": "Active",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "programme": "NBI",
    "assignedCompanyId": "ObjectId of company",
    "assignedCompanyName": "Company Name",
    ...
  }
}
```

## Future Enhancements

1. Add company search/filter in the dropdown
2. Add company information panel showing full details
3. Add company contact notifications (auto-notify when student is assigned)
4. Add company metrics (students assigned, placements, etc.)
5. Add bulk company assignment for multiple students
6. Add company performance tracking
