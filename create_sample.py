import pandas as pd

data = {
    'Name': ['Alice', 'Bob', '', 'Dave', 'Eve'],
    'Email': ['alice@example.com', 'invalid-email', 'charlie@example.com', 'dave@example.com', 'eve@'],
    'Amount': [150.5, -20.0, 300, 'text', 100],
    'Date': ['2023-01-01', '2023-01-02', '2023-01-03', '2023-01-04', '2023-01-05']
}
df = pd.DataFrame(data)
df.to_excel('test_sample.xlsx', index=False)
print("Sample Excel file created successfully.")
