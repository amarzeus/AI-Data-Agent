"""
Data cleaning service for handling dirty, inconsistent, or incomplete Excel data
"""

import pandas as pd
from typing import Tuple, List, Dict, Any
from datetime import datetime


class DataCleaner:
    """Service for cleaning and preprocessing DataFrames from Excel files"""

    def __init__(self):
        self.issues: List[str] = []
        self.cleaning_steps: List[str] = []
        self.issue_summary: Dict[str, int] = {}
        self.metrics: Dict[str, int] = {}
        self.columns_renamed: Dict[str, str] = {}

    def clean(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Clean the DataFrame by handling common data quality issues.

        Args:
            df: Input DataFrame

        Returns:
            Tuple of cleaned DataFrame and metadata about cleaning operations
        """
        working_df = df.copy()
        self._reset_state(working_df)

        # Step 1: Handle unnamed columns
        working_df = self._rename_unnamed_columns(working_df)

        # Step 2: Standardize data types and handle mixed types
        working_df = self._standardize_data_types(working_df)

        # Step 3: Handle missing values
        working_df = self._handle_missing_values(working_df)

        # Step 4: Standardize date formats
        working_df = self._standardize_dates(working_df)

        # Step 5: Remove duplicates
        working_df = self._remove_duplicates(working_df)

        # Step 6: Basic text standardization (e.g., trim strings)
        working_df = self._standardize_text(working_df)

        cleaned_row_count = len(working_df)
        cleaned_col_count = working_df.shape[1]
        original_row_count = self.original_shape[0]
        original_col_count = self.original_shape[1]
        total_cells = original_row_count * max(original_col_count, 1)
        total_issues = sum(self.issue_summary.values())

        quality_score = (
            max(0.0, 1.0 - (total_issues / total_cells)) if total_cells > 0 else 0.0
        )

        metadata = {
            "original_row_count": original_row_count,
            "original_column_count": original_col_count,
            "cleaned_row_count": cleaned_row_count,
            "cleaned_column_count": cleaned_col_count,
            "rows_removed": max(original_row_count - cleaned_row_count, 0),
            "columns_renamed": self.columns_renamed,
            "issues": self.issues,
            "issue_summary": self.issue_summary,
            "cleaning_steps": self.cleaning_steps,
            "metrics": self.metrics,
            "quality_score": round(quality_score, 4),
            "cells_modified": sum(self.metrics.values()),
            "cleaned_at": datetime.utcnow().isoformat(),
        }

        return working_df, metadata

    def _reset_state(self, df: pd.DataFrame) -> None:
        self.issues = []
        self.cleaning_steps = []
        self.issue_summary = {}
        self.metrics = {
            "filled_null_values": 0,
            "rows_dropped": 0,
            "duplicates_removed": 0,
            "numeric_conversions": 0,
            "datetime_conversions": 0,
            "text_standardized": 0,
        }
        self.columns_renamed = {}
        self.original_shape = (len(df), df.shape[1])

    def _record_issue(self, issue_type: str, message: str) -> None:
        entry = f"[{issue_type}] {message}"
        self.issues.append(entry)
        self.issue_summary[issue_type] = self.issue_summary.get(issue_type, 0) + 1

    def _record_step(self, step: str) -> None:
        self.cleaning_steps.append(step)

    def _increment_metric(self, metric: str, value: int) -> None:
        self.metrics[metric] = self.metrics.get(metric, 0) + value

    def _rename_unnamed_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Rename unnamed columns to 'column_{index}'"""
        for i, col in enumerate(df.columns):
            if pd.isna(col) or str(col).strip() == "" or str(col).startswith("Unnamed:"):
                new_name = f"column_{i}"
                df = df.rename(columns={col: new_name})
                self.columns_renamed[str(col)] = new_name
                self._record_issue("missing_header", f"Renamed unnamed column '{col}' to '{new_name}'")
        if self.columns_renamed:
            self._record_step("Renamed unnamed columns")
        return df

    def _standardize_data_types(self, df: pd.DataFrame) -> pd.DataFrame:
        """Convert columns to appropriate data types, handling mixed types"""
        for col in df.columns:
            if df[col].dtype == "object":
                # Try to convert to numeric if possible
                numeric_series = pd.to_numeric(df[col], errors="coerce")
                if len(df[col]) > 0 and (numeric_series.notna().sum() / len(df[col])) > 0.8:
                    df[col] = numeric_series
                    self._record_step(f"Converted column '{col}' to numeric")
                    self._increment_metric("numeric_conversions", int(numeric_series.notna().sum()))
                    continue

                datetime_series = pd.to_datetime(df[col], errors="coerce")
                if len(df[col]) > 0 and (datetime_series.notna().sum() / len(df[col])) > 0.5:
                    df[col] = datetime_series
                    invalid_count = int(datetime_series.isna().sum())
                    if invalid_count > 0:
                        self._record_issue(
                            "invalid_datetime",
                            f"Standardized dates in '{col}', {invalid_count} invalid entries set to NaT",
                        )
                    self._record_step(f"Converted column '{col}' to datetime")
                    self._increment_metric("datetime_conversions", int(datetime_series.notna().sum()))
        return df

    def _handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Fill or drop missing values based on column type"""
        for col in df.columns:
            missing_count = int(df[col].isnull().sum())
            if missing_count == 0:
                continue

            if str(df[col].dtype) in ["int64", "float64", "Int64", "Float64"]:
                median_val = df[col].median()
                df[col] = df[col].fillna(median_val)
                self._record_issue(
                    "missing_values",
                    f"Filled {missing_count} missing values in '{col}' with median ({median_val})",
                )
                self._increment_metric("filled_null_values", missing_count)
            elif df[col].dtype == "object":
                mode_val = df[col].mode(dropna=True)
                fill_val = mode_val.iloc[0] if not mode_val.empty else "Unknown"
                df[col] = df[col].fillna(fill_val)
                self._record_issue(
                    "missing_values",
                    f"Filled {missing_count} missing values in '{col}' with '{fill_val}'",
                )
                self._increment_metric("filled_null_values", missing_count)
            else:
                before_rows = len(df)
                df = df.dropna(subset=[col])
                rows_removed = before_rows - len(df)
                if rows_removed > 0:
                    self._record_issue(
                        "missing_values",
                        f"Dropped {rows_removed} rows due to >50% missing data in '{col}'",
                    )
                    self._increment_metric("rows_dropped", rows_removed)

            self._record_step(f"Handled missing values in '{col}' ({missing_count} values)")

        return df

    def _standardize_dates(self, df: pd.DataFrame) -> pd.DataFrame:
        """Standardize date columns to datetime for non-object types that slipped through"""
        for col in df.columns:
            if df[col].dtype == "object":
                converted = pd.to_datetime(df[col], errors="coerce")
                if converted.notna().sum() > 0:
                    invalid_count = int(converted.isna().sum())
                    df[col] = converted
                    if invalid_count > 0:
                        self._record_issue(
                            "invalid_datetime",
                            f"Normalized '{col}' to datetime; {invalid_count} invalid entries set to NaT",
                        )
                    self._record_step(f"Standardized date formats in '{col}'")
                    self._increment_metric("datetime_conversions", int(converted.notna().sum()))
        return df

    def _remove_duplicates(self, df: pd.DataFrame) -> pd.DataFrame:
        """Remove duplicate rows"""
        initial_len = len(df)
        deduped_df = df.drop_duplicates()
        removed = initial_len - len(deduped_df)
        if removed > 0:
            self._record_issue("duplicates", f"Removed {removed} duplicate rows")
            self._record_step("Removed duplicate rows")
            self._increment_metric("duplicates_removed", removed)
        return deduped_df

    def _standardize_text(self, df: pd.DataFrame) -> pd.DataFrame:
        """Trim whitespace in text columns"""
        text_columns = df.select_dtypes(include=["object"]).columns
        for col in text_columns:
            series = df[col]
            trimmed_series = series.apply(lambda value: value.strip() if isinstance(value, str) else value)
            changes = int((series.fillna("__nan__") != trimmed_series.fillna("__nan__")).sum())
            if changes > 0:
                df[col] = trimmed_series
                self._record_step(f"Trimmed text values in '{col}' ({changes} cells updated)")
                self._increment_metric("text_standardized", changes)
        return df


# Global instance for easy import
data_cleaner = DataCleaner()
