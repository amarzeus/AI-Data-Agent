"""
Excel file processing service using pandas
"""

import os
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from pandas.api.types import (
    is_bool_dtype,
    is_datetime64_any_dtype,
    is_integer_dtype,
    is_numeric_dtype,
)

from .data_cleaner import data_cleaner
from ..utils.database import table_manager


class ExcelProcessor:
    """Service for processing Excel files and extracting structured metadata"""

    def __init__(self, upload_dir: str = "uploads"):
        self.upload_dir = upload_dir
        os.makedirs(upload_dir, exist_ok=True)

    def process_excel_file(self, file_path: str) -> Dict[str, Any]:
        """
        Process an Excel file and extract data, metadata, and statistics for each sheet.

        Returns a rich payload that includes cleaned dataframes (server-side only),
        schema suggestions, column profiling, and cleaning metadata for every sheet.
        """
        try:
            excel_data = pd.read_excel(file_path, sheet_name=None)

            # Normalize single-sheet workbooks into a dict for consistent processing
            if isinstance(excel_data, pd.DataFrame):
                excel_data = {"Sheet1": excel_data}

            processed_id = str(uuid.uuid4())
            processed_sheets: Dict[str, Dict[str, Any]] = {}
            sheet_summaries: List[Dict[str, Any]] = []
            cleaning_metadata_map: Dict[str, Any] = {}
            primary_sheet_key: Optional[str] = None
            total_rows = 0

            for index, (raw_sheet_name, df) in enumerate(excel_data.items()):
                sheet_name = raw_sheet_name or f"Sheet{index + 1}"
                if sheet_name in processed_sheets:
                    sheet_name = f"{sheet_name}_{index + 1}"

                primary_sheet_key = primary_sheet_key or sheet_name

                # Clean and profile the sheet
                cleaned_df, cleaning_metadata = data_cleaner.clean(df)
                column_mappings = self._build_column_mappings(cleaned_df)
                sanitized_df = cleaned_df.rename(columns=column_mappings)

                schema = self._infer_schema(cleaned_df, sheet_name, column_mappings)
                dataframe_info = self._build_dataframe_info(cleaned_df)
                numeric_stats = self._build_numeric_stats(cleaned_df)
                column_analysis = self._analyze_columns(cleaned_df, column_mappings)

                enriched_cleaning_metadata = {
                    **cleaning_metadata,
                    "dataframe_info": dataframe_info,
                    "numeric_stats": numeric_stats,
                    "column_analysis": column_analysis,
                }

                processed_sheets[sheet_name] = {
                    "dataframe": cleaned_df,
                    "sanitized_dataframe": sanitized_df,
                    "schema": schema,
                    "column_mappings": column_mappings,
                    "cleaning_metadata": enriched_cleaning_metadata,
                    "dataframe_info": dataframe_info,
                    "numeric_stats": numeric_stats,
                    "column_analysis": column_analysis,
                }

                cleaning_metadata_map[sheet_name] = enriched_cleaning_metadata
                total_rows += int(cleaned_df.shape[0])

                sheet_summaries.append(
                    {
                        "sheet_name": sheet_name,
                        "suggested_table_name": schema["table_name"],
                        "row_count": int(cleaned_df.shape[0]),
                        "column_count": int(cleaned_df.shape[1]),
                        "dataframe_info": dataframe_info,
                        "numeric_stats": numeric_stats,
                        "column_analysis": column_analysis,
                        "cleaning_metadata": cleaning_metadata,
                        "issue_summary": cleaning_metadata.get("issue_summary", {}),
                        "cleaning_metrics": cleaning_metadata.get("metrics", {}),
                        "columns_renamed": cleaning_metadata.get("columns_renamed", {}),
                    }
                )

            file_stats = os.stat(file_path)
            file_info = {
                "filename": os.path.basename(file_path),
                "size": file_stats.st_size,
                "created": datetime.fromtimestamp(file_stats.st_ctime).isoformat(),
                "modified": datetime.fromtimestamp(file_stats.st_mtime).isoformat(),
                "sheets": list(processed_sheets.keys()),
            }

            result: Dict[str, Any] = {
                "id": processed_id,
                "file_info": file_info,
                "processed_sheets": processed_sheets,
                "sheet_summaries": sheet_summaries,
                "cleaning_metadata": cleaning_metadata_map,
                "primary_sheet": primary_sheet_key,
                "sheet_names": list(processed_sheets.keys()),
                "total_sheets": len(processed_sheets),
                "total_rows": total_rows,
                "status": "success",
                "processed_at": datetime.utcnow().isoformat(),
            }

            if primary_sheet_key and processed_sheets:
                primary = processed_sheets[primary_sheet_key]
                result["dataframe_info"] = primary["dataframe_info"]
                result["numeric_stats"] = primary["numeric_stats"]
                result["column_analysis"] = primary["column_analysis"]
            else:
                result["dataframe_info"] = {}
                result["numeric_stats"] = {}
                result["column_analysis"] = {}

            return result

        except Exception as exc:
            return {
                "id": str(uuid.uuid4()),
                "error": str(exc),
                "status": "error",
                "processed_at": datetime.utcnow().isoformat(),
            }

    def _build_column_mappings(self, df: pd.DataFrame) -> Dict[Any, str]:
        """Create a mapping of original column names to sanitized SQL-safe identifiers."""
        mappings: Dict[Any, str] = {}
        collision_counter: Dict[str, int] = {}

        for idx, column in enumerate(df.columns):
            sanitized = table_manager.sanitize_column_name(str(column))
            if not sanitized:
                sanitized = f"column_{idx}"

            if sanitized in collision_counter:
                collision_counter[sanitized] += 1
                sanitized = f"{sanitized}_{collision_counter[sanitized]}"
            else:
                collision_counter[sanitized] = 0

            mappings[column] = sanitized

        return mappings

    def _build_dataframe_info(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Compile general DataFrame information for reporting purposes."""
        return {
            "shape": (int(df.shape[0]), int(df.shape[1])),
            "columns": [self._safe_str(col) for col in df.columns],
            "dtypes": {self._safe_str(col): str(dtype) for col, dtype in df.dtypes.items()},
            "null_counts": {self._safe_str(col): int(df[col].isna().sum()) for col in df.columns},
            "sample_data": self._build_sample_data(df),
        }

    def _build_sample_data(self, df: pd.DataFrame, rows: int = 10) -> List[Dict[str, Any]]:
        """Return a JSON-serializable preview of the DataFrame."""
        if df.empty:
            return []

        sample_df = df.head(rows).copy()
        for column in sample_df.columns:
            if is_datetime64_any_dtype(sample_df[column]):
                sample_df[column] = sample_df[column].apply(
                    lambda value: value.isoformat() if pd.notna(value) else None
                )
            else:
                sample_df[column] = sample_df[column].apply(self._cast_value)

        return sample_df.to_dict("records")

    def _build_numeric_stats(self, df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
        """Compute descriptive statistics for numeric columns."""
        stats: Dict[str, Dict[str, Any]] = {}
        numeric_columns = df.select_dtypes(include=["number"])

        for column in numeric_columns.columns:
            series = numeric_columns[column].dropna()
            if series.empty:
                continue

            stats[self._safe_str(column)] = {
                "mean": self._safe_float(series.mean()),
                "median": self._safe_float(series.median()),
                "std": self._safe_float(series.std()),
                "min": self._safe_float(series.min()),
                "max": self._safe_float(series.max()),
                "count": int(series.count()),
            }

        return stats

    def _analyze_columns(self, df: pd.DataFrame, column_mappings: Dict[Any, str]) -> Dict[str, Dict[str, Any]]:
        """Analyse each column and return profiling metadata."""
        analysis: Dict[str, Dict[str, Any]] = {}
        total_rows = max(len(df.index), 1)

        for column in df.columns:
            column_key = self._safe_str(column)
            series = df[column]
            null_count = int(series.isna().sum())
            null_percentage = float((null_count / total_rows) * 100) if total_rows else 0.0

            column_analysis: Dict[str, Any] = {
                "sanitized_name": column_mappings[column],
                "dtype": str(series.dtype),
                "unique_count": int(series.nunique(dropna=True)),
                "null_count": null_count,
                "null_percentage": null_percentage,
                "needs_cleaning": null_percentage > 20,
                "is_nullable": bool(series.isna().any()),
                "column_index": int(df.columns.get_loc(column)),
            }

            if is_numeric_dtype(series):
                column_analysis.update(
                    {
                        "is_numeric": True,
                        "mean": self._safe_float(series.mean()),
                        "median": self._safe_float(series.median()),
                        "std": self._safe_float(series.std()),
                        "min": self._safe_float(series.min()),
                        "max": self._safe_float(series.max()),
                    }
                )
            elif is_datetime64_any_dtype(series):
                if series.notna().any():
                    min_date = series.min()
                    max_date = series.max()
                    column_analysis.update(
                        {
                            "is_datetime": True,
                            "date_range": {
                                "min": self._cast_value(min_date),
                                "max": self._cast_value(max_date),
                            },
                        }
                    )
            else:
                str_lengths = series.dropna().astype(str).map(len)
                column_analysis.update(
                    {
                        "is_categorical": True,
                        "max_length": int(str_lengths.max()) if not str_lengths.empty else None,
                        "avg_length": float(str_lengths.mean()) if not str_lengths.empty else None,
                        "unique_values": self._sample_unique_values(series),
                    }
                )

            analysis[column_key] = column_analysis

        return analysis

    def _infer_schema(
        self,
        df: pd.DataFrame,
        sheet_name: str,
        column_mappings: Dict[Any, str],
    ) -> Dict[str, Any]:
        """Infer SQL schema information required for dynamic table creation."""
        columns: List[Dict[str, Any]] = []

        for original_name, sanitized_name in column_mappings.items():
            series = df[original_name]
            sql_type, max_length = self._map_series_to_sql_type(series)

            column_def: Dict[str, Any] = {
                "name": sanitized_name,
                "original_name": self._safe_str(original_name),
                "display_name": self._safe_str(original_name),
                "type": sql_type,
                "nullable": bool(series.isna().any()),
                "constraints": [],
            }

            if max_length is not None:
                column_def["max_length"] = max_length

            columns.append(column_def)

        base_table_name = table_manager.sanitize_table_name(sheet_name or "sheet")
        if not base_table_name:
            base_table_name = f"sheet_{uuid.uuid4().hex[:6]}"

        table_name = base_table_name

        return {
            "table_name": table_name,
            "base_table_name": base_table_name,
            "columns": columns,
        }

    def _map_series_to_sql_type(self, series: pd.Series) -> Tuple[str, Optional[int]]:
        """Map a pandas Series to an appropriate SQL column type."""
        if is_bool_dtype(series):
            return "BOOLEAN", None

        if is_datetime64_any_dtype(series):
            return "TIMESTAMP", None

        if is_numeric_dtype(series):
            if is_integer_dtype(series):
                return "INTEGER", None
            return "FLOAT", None

        max_length: Optional[int] = None
        str_lengths = series.dropna().astype(str).map(len)
        if not str_lengths.empty:
            max_length = int(str_lengths.max())

        return "TEXT", max_length

    def _sample_unique_values(self, series: pd.Series, limit: int = 20) -> List[Any]:
        """Return a serializable sample of unique values for categorical columns."""
        unique_values = series.dropna().unique()
        sampled = unique_values[:limit]
        return [self._cast_value(value) for value in sampled]

    def _safe_float(self, value: Any) -> Optional[float]:
        """Safely convert values to floats, returning None for NaN or non-numeric inputs."""
        try:
            if value is None:
                return None
            float_value = float(value)
            if np.isnan(float_value):
                return None
            return float_value
        except (TypeError, ValueError):
            return None

    def _cast_value(self, value: Any) -> Any:
        """Convert pandas/numpy scalar types into JSON-serializable Python primitives."""
        if value is None:
            return None
        if isinstance(value, (pd.Timestamp, datetime)):
            return value.isoformat()
        if isinstance(value, np.generic):
            return value.item()
        if pd.isna(value):
            return None
        return value

    def _safe_str(self, value: Any) -> str:
        """Convert values to safe string representations."""
        return "" if value is None else str(value)

    def get_preview_data(self, file_path: str, rows: int = 5) -> List[Dict[str, Any]]:
        """Get preview data from the first sheet of an Excel file"""
        try:
            df = pd.read_excel(file_path)
            preview_df = df.head(rows)
            return preview_df.to_dict('records')
        except Exception as e:
            raise ValueError(f"Failed to get preview data: {e}")

    def validate_excel_file(self, file_path: str) -> Dict[str, Any]:
        """Validate if file is a proper Excel file and return basic metadata"""
        try:
            # Try to read the file to validate it's a proper Excel file
            df = pd.read_excel(file_path)

            validation = {
                "is_valid": True,
                "row_count": len(df),
                "column_count": len(df.columns),
                "columns": df.columns.tolist(),
                "file_size": os.path.getsize(file_path)
            }

            return validation

        except Exception as e:
            return {
                "is_valid": False,
                "error": str(e),
                "file_size": os.path.getsize(file_path) if os.path.exists(file_path) else 0
            }


# Global instance
excel_processor = ExcelProcessor()