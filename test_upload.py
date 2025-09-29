#!/usr/bin/env python3
"""
Test script to verify Excel upload functionality works without database locking issues.
"""

import os
import requests
import time
from pathlib import Path

def test_excel_upload():
    """Test uploading an Excel file to verify the locking fix works."""

    # Check if sample Excel file exists
    sample_files = [
        "sample_test_data.xlsx",
        "multi_sheet_test.xlsx",
        "sample_dirty.xlsx"
    ]

    excel_file = None
    for filename in sample_files:
        if os.path.exists(filename):
            excel_file = filename
            break

    if not excel_file:
        print("❌ No sample Excel file found. Please add a sample .xlsx file to the project root.")
        return False

    print(f"✅ Using sample file: {excel_file}")

    # Backend URL
    backend_url = "http://localhost:8000"

    try:
        # Check if backend is running
        health_response = requests.get(f"{backend_url}/health")
        if health_response.status_code != 200:
            print("❌ Backend is not running. Please start the backend first.")
            return False

        print("✅ Backend is running")

        # Prepare file for upload
        file_path = Path(excel_file)
        with open(file_path, 'rb') as f:
            files = {'file': (file_path.name, f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}

            print(f"📤 Uploading {excel_file}...")

            # Upload the file
            start_time = time.time()
            response = requests.post(f"{backend_url}/upload", files=files)
            end_time = time.time()

            if response.status_code == 200:
                result = response.json()
                print("✅ Upload successful!")
                print(f"   📊 File ID: {result.get('file_id')}")
                print(f"   📊 Total sheets: {result.get('total_sheets', 0)}")
                print(f"   📊 Total rows: {result.get('total_rows', 0)}")
                processing_time = result.get('processing_time_seconds', 0)
                total_time = end_time - start_time
                print(f"   ⏱️  Processing time: {processing_time:.2f}s")
                print(f"   ⏱️  Total time: {total_time:.2f}s")

                return True
            else:
                print(f"❌ Upload failed with status {response.status_code}")
                print(f"   Error: {response.text}")
                return False

    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Make sure it's running on http://localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Excel upload functionality...")
    print("=" * 50)

    success = test_excel_upload()

    print("=" * 50)
    if success:
        print("🎉 Test completed successfully!")
        print("✅ Database locking issue has been resolved!")
    else:
        print("❌ Test failed. Check the error messages above.")
