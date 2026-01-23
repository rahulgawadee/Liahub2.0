const XLSX = require('xlsx');
const path = require('path');

// Swedish column headers
const headers = [
  'Date',
  'Företag',
  'Ort/land',
  'Kontaktperson',
  'Roll',
  'Mejl',
  'Telefon',
  'Ftg org/reg nr',
  'Notera',
  'Tilldela/urvalsprocess',
  'NBI/Handelsakadmin program',
  'UL',
  'Mejl',
  'Studerande Namn',
  'Studerande mejladress (skola)',
  'Info från UL'
];

// Sample data rows
const sampleData = [
  [
    '2025-01-15',
    'Tech Solutions AB',
    'Stockholm',
    'Anna Svensson',
    'Supervisor',
    'anna@techsolutions.se',
    '+46701234567',
    '556789-1234',
    'Preferred student with programming skills',
    'Direct placement',
    'NBI Program 2024',
    'Lars Andersson',
    'lars@school.se',
    'Erik Johansson',
    'erik.johansson@student.school.se',
    'Student is interested in backend development'
  ],
  [
    '2025-01-16',
    'Design Studio',
    'Göteborg',
    'Maria Bergström',
    'Creative Director',
    'maria@designstudio.se',
    '+46709876543',
    '556123-4567',
    'Looking for creative student',
    'Interview required',
    'Handelsakadmin 2024',
    'Karin Nilsson',
    'karin@school.se',
    'Sofia Lundberg',
    'sofia.lundberg@student.school.se',
    'Student has strong design portfolio'
  ],
  [
    '2025-01-17',
    'Finance Corp',
    'Malmö',
    'Johan Karlsson',
    'Department Manager',
    'johan@financecorp.se',
    '+46707654321',
    '556456-7890',
    'Internship in accounting department',
    'Selection process ongoing',
    'NBI Program 2024',
    'Lars Andersson',
    'lars@school.se',
    'Oskar Eriksson',
    'oskar.eriksson@student.school.se',
    'Strong analytical skills required'
  ]
];

// Create a new workbook
const workbook = XLSX.utils.book_new();

// Create worksheet data with headers and sample rows
const worksheetData = [headers, ...sampleData];

// Create worksheet
const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

// Set column widths for better readability
const columnWidths = headers.map(() => ({ wch: 20 }));
worksheet['!cols'] = columnWidths;

// Add worksheet to workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

// Create output directory if it doesn't exist
const fs = require('fs');
const outputDir = path.join(__dirname, '../public/templates');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write to file
const outputPath = path.join(outputDir, 'student-upload-template.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log(`✓ Sample Excel template created at: ${outputPath}`);
console.log(`✓ Contains ${sampleData.length} sample rows`);
console.log(`✓ Swedish column headers included`);
