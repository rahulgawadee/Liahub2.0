# Student Data Upload Template

## Excel Column Headers (Swedish)

Your Excel file must have these **exact** column headers in the first row (row 1):

1. **Date**
2. **Företag**
3. **Ort/land**
4. **Kontaktperson**
5. **Roll**
6. **Mejl**
7. **Telefon**
8. **Ftg org/reg nr**
9. **Notera**
10. **Tilldela/urvalsprocess**
11. **NBI/Handelsakadmin program**
12. **UL**
13. **Studerande Namn**
14. **Studerande mejladress (skola)**
15. **Info från UL**

### Required data

- At least one of these must be provided per row: **Studerande Namn** or **Studerande mejladress (skola)**.

## File Requirements

- **File Format**: .xlsx or .xls
- **Maximum Size**: 10MB
- **First Row**: Must contain the exact Swedish column headers listed above
- **Minimum Data**: At least student name or school email must be provided
- **Encoding**: UTF-8 recommended for Swedish characters

## Example Data Row

```
| Date       | Företag  | Ort/land | Kontaktperson | Roll      | Mejl              | Telefon      | ... |
|------------|----------|----------|---------------|-----------|-------------------|--------------|-----|
| 2025-01-15 | ABC Corp | Stockholm| John Doe      | Supervisor| john@abc.com      | +46701234567 | ... |
```

## Notes

- Empty cells are allowed and will be stored as empty strings
- Rows without both student name AND school email will be skipped
- All data will be visible to authorized users in the dashboard
