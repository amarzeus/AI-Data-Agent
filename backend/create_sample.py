import pandas as pd

# Create sample data for Sales sheet
df1 = pd.DataFrame({
    'Sales': [100, 200, 150],
    'Region': ['North', 'South', 'East'],
    'Date': ['2023-01', '2023-02', '2023-03']
})

# Create sample data for Expenses sheet
df2 = pd.DataFrame({
    'Expenses': [50, 100, 75],
    'Region': ['North', 'South', 'East'],
    'Date': ['2023-01', '2023-02', '2023-03']
})

# Write to Excel with multiple sheets
with pd.ExcelWriter('uploads/sample_sales.xlsx') as writer:
    df1.to_excel(writer, sheet_name='Sales', index=False)
    df2.to_excel(writer, sheet_name='Expenses', index=False)

print('Sample Excel created: sample_sales.xlsx with sheets Sales and Expenses')
