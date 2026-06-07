import pandas as pd

data_alice = {
    'Date': ['2023-10-01', '2023-10-02', '2023-10-03'],
    'Flower': ['Rose', 'Jasmine', 'Rose'],
    'Weight': [10.5, 5.0, 12.0],
    'Van': ['V1', 'V2', 'V1'],
    'Rate': [150.0, 200.0, 145.0]
}

data_bob = {
    'Date': ['2023-10-01', '2023-10-02'],
    'Flower': ['Lily', 'Lily'],
    'Weight': [8.0, 9.5],
    'Van': ['V3', 'V3'],
    'Rate': [300.0, 310.0]
}

with pd.ExcelWriter('test_bill_sample.xlsx') as writer:
    pd.DataFrame(data_alice).to_excel(writer, sheet_name='Alice', index=False)
    pd.DataFrame(data_bob).to_excel(writer, sheet_name='Bob', index=False)

print("Sample Excel file 'test_bill_sample.xlsx' created successfully.")
