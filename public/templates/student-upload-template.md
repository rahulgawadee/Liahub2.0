# Student Data Upload Template

## Excel Column Headers (Swedish)

Your Excel file should have the following column headers in the first row:

1. **Date** - Date of entry
2. **Företag** - Company name
3. **Ort/land** - Location/Country
4. **Kontaktperson** - Contact person
5. **Roll** - Role
6. **Mejl** - Company email
7. **Telefon** - Phone number
8. **Ftg org/reg nr** - Company organization/registration number
9. **Notera** - Notes
10. **Tilldela/urvalsprocess** - Assignment/Selection process
11. **NBI/Handelsakadmin program** - Program name
12. **UL** - Education leader
13. **Mejl** - (duplicate column for additional email)
14. **Studerande Namn** - Student name (Required)
15. **Studerande mejladress (skola)** - Student school email (Required)
16. **Info från UL** - Information from education leader

## File Requirements

- **File Format**: .xlsx or .xls
- **Maximum Size**: 10MB
- **First Row**: Must contain the exact Swedish column headers listed above
- **Minimum Data**: At least student name or email must be provided
- **Encoding**: UTF-8 recommended for Swedish characters

## Example Data Row

```
| Date       | Företag  | Ort/land | Kontaktperson | Roll      | Mejl              | Telefon      | ... |
|------------|----------|----------|---------------|-----------|-------------------|--------------|-----|
| 2025-01-15 | ABC Corp | Stockholm| John Doe      | Supervisor| john@abc.com      | +46701234567 | ... |
```

## Notes

- Empty cells are allowed and will be stored as empty strings
- Rows without both student name AND email will be skipped
- Duplicate column names (like "Mejl") are handled separately
- All data will be visible to authorized users in the dashboard
