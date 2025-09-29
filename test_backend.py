#!/usr/bin/env python3
"""
Basic backend functionality test script
"""

import os
import sys
import json
from datetime import datetime

def test_imports():
    """Test basic Python imports"""
    print("🔍 Testing Python imports...")

    try:
        import pandas as pd
        print("✅ Pandas imported successfully")
    except ImportError:
        print("❌ Pandas not available - will install later")

    try:
        import fastapi
        print("✅ FastAPI imported successfully")
    except ImportError:
        print("❌ FastAPI not available - will install later")

    try:
        import sqlalchemy
        print("✅ SQLAlchemy imported successfully")
    except ImportError:
        print("❌ SQLAlchemy not available - will install later")

def test_file_structure():
    """Test that all required files exist"""
    print("\n📁 Testing file structure...")

    required_files = [
        "backend/main.py",
        "backend/requirements.txt",
        "backend/app/core/config.py",
        "backend/app/models/base.py",
        "backend/app/services/excel_processor.py",
        "frontend/package.json",
        "frontend/src/App.tsx",
    ]

    for file_path in required_files:
        if os.path.exists(file_path):
            print(f"✅ {file_path}")
        else:
            print(f"❌ {file_path} - MISSING")

def test_sample_data_creation():
    """Create sample Excel file for testing"""
    print("\n📊 Creating sample data...")

    try:
        import pandas as pd
        import numpy as np

        # Create sample sales data
        np.random.seed(42)
        sample_data = {
            'Date': pd.date_range('2024-01-01', periods=50, freq='D'),
            'Product': np.random.choice(['Product A', 'Product B', 'Product C'], 50),
            'Sales': np.random.randint(100, 1000, 50),
            'Quantity': np.random.randint(1, 20, 50),
            'Region': np.random.choice(['North', 'South', 'East', 'West'], 50)
        }

        df = pd.DataFrame(sample_data)

        # Save as Excel file
        df.to_excel('sample_test_data.xlsx', index=False)

        print("✅ Sample Excel file created: sample_test_data.xlsx")
        print(f"   Shape: {df.shape}")
        print(f"   Columns: {list(df.columns)}")

        return True

    except ImportError:
        print("❌ Cannot create sample data - pandas not available")
        return False
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        return False

def test_database_schema():
    """Test database models can be imported"""
    print("\n🗄️ Testing database schema...")

    try:
        # Test importing database models
        sys.path.append('backend')

        from app.models.base import UploadedFile, FileSheet, SheetColumn
        print("✅ Database models imported successfully")

        # Test model instantiation
        file_record = UploadedFile(
            filename="test.xlsx",
            original_filename="test.xlsx",
            file_path="/tmp/test.xlsx",
            file_size=1024,
            file_hash="abc123",
            mime_type="application/vnd.ms-excel"
        )
        print("✅ Database model instantiation works")

        return True

    except ImportError as e:
        print(f"❌ Database model import failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Database model test failed: {e}")
        return False

def test_excel_processor():
    """Test Excel processor functionality"""
    print("\n📋 Testing Excel processor...")

    try:
        sys.path.append('backend')
        from app.services.excel_processor import excel_processor

        print("✅ Excel processor imported successfully")

        # Test processor methods exist
        if hasattr(excel_processor, 'process_excel_file'):
            print("✅ process_excel_file method exists")
        else:
            print("❌ process_excel_file method missing")

        if hasattr(excel_processor, 'validate_excel_file'):
            print("✅ validate_excel_file method exists")
        else:
            print("❌ validate_excel_file method missing")

        return True

    except ImportError as e:
        print(f"❌ Excel processor import failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Excel processor test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 AI Data Agent - Backend Test Suite")
    print("=" * 50)
    print(f"Started at: {datetime.now().isoformat()}")

    # Run tests
    test_imports()
    test_file_structure()
    test_sample_data_creation()
    test_database_schema()
    test_excel_processor()

    print("\n" + "=" * 50)
    print("✅ Basic testing completed!")
    print("\nNext steps:")
    print("1. Install remaining dependencies: cd backend && ./venv/bin/pip install -r requirements.txt")
    print("2. Set up environment variables: cp backend/.env.example backend/.env")
    print("3. Add your Google Gemini API key to backend/.env")
    print("4. Run the backend: cd backend && ./venv/bin/python main.py")
    print("5. Test frontend: cd frontend && npm install && npm start")

if __name__ == "__main__":
    main()