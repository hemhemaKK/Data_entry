import pandas as pd
import os

export_dir = "render_export"
yesterday = "2026-07-05"

for file in os.listdir(export_dir):
    if file.endswith('.csv'):
        df = pd.read_csv(os.path.join(export_dir, file))
        
        # Look for date columns
        date_cols = [col for col in df.columns if 'date' in col.lower() or 'created_at' in col.lower()]
        
        if date_cols:
            col = date_cols[0] # pick the first date column
            # Convert to string and filter
            filtered = df[df[col].astype(str).str.startswith(yesterday)]
            if not filtered.empty:
                print(f"--- {file} ---")
                print(f"Found {len(filtered)} rows for {yesterday} based on column '{col}'")
                print(filtered.head(3))
                print()
