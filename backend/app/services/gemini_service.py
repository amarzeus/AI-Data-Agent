"""
Google Gemini AI Service for Natural Language Query Processing
"""

import os
import json
import pandas as pd
import google.generativeai as genai
from typing import Dict, Any, Optional
from dotenv import load_dotenv
import logging
from ..utils.database import execute_sql, get_table_schema
from .sql_generator import sql_generator

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

class GeminiService:
    """Service for processing natural language queries using Google Gemini AI"""

    def __init__(self):
        """Initialize the Gemini service with API key and configuration"""
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")

        # Configure Gemini AI
        genai.configure(api_key=self.api_key)

        # Initialize the model
        self.model = genai.GenerativeModel('gemini-2.0-flash')

        # Generation config for consistent responses
        self.generation_config = genai.types.GenerationConfig(
            temperature=0.1,
            top_p=1,
            max_output_tokens=2048,
        )

    def execute_ai_query(self, request: Dict[str, Any], table_name: str, engine) -> Dict[str, Any]:
        """
        Execute AI-powered query on dynamic table

        Args:
            request: Query request with query_text, file_id, context
            table_name: Name of the dynamic table
            engine: Database engine

        Returns:
            Dictionary containing SQL query, results, and visualizations
        """
        try:
            query_text = request.get("query", "")
            context = request.get("context", "")
            cleaning_metadata = request.get("cleaning_metadata")

            schema = get_table_schema(table_name, engine)
            sql_query = sql_generator.generate_query(query_text, schema, table_name, context)
            result_df = execute_sql(table_name, sql_query, engine)

            viz_configs = sql_generator.generate_visualizations(
                query_text,
                {
                    "columns": [{"name": col, "type": str(result_df[col].dtype)} for col in result_df.columns],
                    "data": result_df.to_dict("records"),
                },
                schema,
            )

            explanation = self._generate_explanation(query_text, result_df, sql_query)

            return {
                "status": "completed",
                "query": query_text,
                "sql_query": sql_query,
                "executed_results": {
                    "data": result_df.to_dict("records"),
                    "columns": [{"name": col, "type": str(result_df[col].dtype)} for col in result_df.columns],
                    "row_count": len(result_df),
                },
                "visualizations": viz_configs,
                "explanation": explanation,
                "data_quality_disclaimer": self._check_data_quality(result_df, cleaning_metadata),
            }

        except Exception as e:
            logger.error(f"Error executing AI query: {str(e)}")
            return {
                "status": "error",
                "query": query_text,
                "error": str(e)
            }

    def _generate_explanation(self, query: str, result_df: pd.DataFrame, sql_query: str) -> str:
        """Generate human-readable explanation of query results"""
        try:
            context = f"""
Explain the results of this SQL query in simple terms:

Query: {query}
SQL: {sql_query}
Results: {len(result_df)} rows returned
Columns: {', '.join(result_df.columns)}

Provide a brief, clear explanation of what the data shows.
"""
            response = self.model.generate_content(context, generation_config=self.generation_config)
            return response.text.strip()
        except:
            return f"Query returned {len(result_df)} results with columns: {', '.join(result_df.columns)}"

    def _check_data_quality(self, df: pd.DataFrame, cleaning_metadata: Optional[Dict] = None) -> Optional[str]:
        """Check for data quality issues and return disclaimer if needed"""
        issues = []
        if df.isnull().sum().sum() > 0:
            issues.append("contains missing values")
        if len(df) == 0:
            issues.append("returned no data")
        if len(df.columns) == 0:
            issues.append("has no columns")

        # Check cleaning metadata for quality scores
        if cleaning_metadata:
            for sheet, meta in cleaning_metadata.items():
                if meta.get('quality_score', 1.0) < 0.8:
                    issues.append(f"sheet '{sheet}' has low data quality ({meta.get('quality_score', 0):.2f})")
                if meta.get('issues'):
                    issues.extend([f"sheet '{sheet}': {issue}" for issue in meta['issues']])

        if issues:
            return f"Note: The data {', '.join(issues)}. Results may be incomplete."
        return None

    def _get_dataframe_info(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Get comprehensive information about the dataframe"""
        return {
            "shape": df.shape,
            "columns": df.columns.tolist(),
            "dtypes": df.dtypes.astype(str).to_dict(),
            "null_counts": df.isnull().sum().to_dict(),
            "sample_data": df.head(5).to_dict('records'),
            "numeric_columns": df.select_dtypes(include=['number']).columns.tolist(),
            "categorical_columns": df.select_dtypes(include=['object', 'category']).columns.tolist(),
            "datetime_columns": df.select_dtypes(include=['datetime']).columns.tolist()
        }

    def _create_analysis_context(self, df: pd.DataFrame, df_info: Dict[str, Any], query: str) -> str:
        """Create context prompt for the AI model"""
        context = f"""
You are a data analysis expert. I need you to analyze an Excel dataset and respond to this query: "{query}"

Dataset Information:
- Shape: {df_info['shape'][0]} rows × {df_info['shape'][1]} columns
- Columns: {', '.join(df_info['columns'])}
- Data Types: {json.dumps(df_info['dtypes'], indent=2)}

Sample Data (first 5 rows):
{json.dumps(df_info['sample_data'], indent=2)}

Please provide a comprehensive analysis that includes:
1. Understanding what the user is asking for
2. Key insights and findings
3. Statistical summaries where relevant
4. Trends or patterns you observe
5. Recommendations or next steps

Format your response as JSON with the following structure:
{{
    "understanding": "Brief explanation of what the query is asking",
    "key_insights": ["List of main findings"],
    "statistical_summary": {{"column_name": "summary", ...}},
    "trends_patterns": ["List of observed trends"],
    "recommendations": ["List of actionable recommendations"],
    "suggested_visualizations": ["List of chart types that would help visualize this data"]
}}

Be specific and actionable in your analysis. Focus on the most relevant information for the user's query.
"""
        return context

    def _parse_ai_response(self, response_text: str, df: pd.DataFrame, query: str) -> Dict[str, Any]:
        """Parse and structure the AI response"""
        try:
            # Try to extract JSON from the response
            # Look for JSON-like content in the response
            import re
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)

            if json_match:
                json_str = json_match.group()
                parsed_response = json.loads(json_str)
                return parsed_response
            else:
                # If no JSON found, create a structured response from the text
                return {
                    "understanding": f"Analysis of query: {query}",
                    "key_insights": [line.strip() for line in response_text.split('\n') if line.strip()][:5],
                    "statistical_summary": self._generate_basic_stats(df),
                    "trends_patterns": ["Pattern analysis would require more specific query"],
                    "recommendations": ["Consider refining your query for more targeted analysis"],
                    "suggested_visualizations": ["bar", "line", "scatter"]
                }

        except json.JSONDecodeError:
            # If JSON parsing fails, create a basic structured response
            return {
                "understanding": f"Analysis of query: {query}",
                "key_insights": [response_text[:200] + "..."],
                "statistical_summary": self._generate_basic_stats(df),
                "trends_patterns": ["Unable to extract specific patterns from response"],
                "recommendations": ["Try rephrasing your query for better results"],
                "suggested_visualizations": ["bar", "line", "histogram"]
            }

    def _generate_basic_stats(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate basic statistical summaries for numeric columns"""
        stats = {}
        numeric_cols = df.select_dtypes(include=['number']).columns

        for col in numeric_cols[:5]:  # Limit to first 5 numeric columns
            if col in df.columns:
                stats[col] = {
                    "mean": round(df[col].mean(), 2),
                    "median": round(df[col].median(), 2),
                    "std": round(df[col].std(), 2),
                    "min": round(df[col].min(), 2),
                    "max": round(df[col].max(), 2)
                }

        return stats

    def generate_sql_query(self, df: pd.DataFrame, natural_language_query: str) -> Dict[str, Any]:
        """
        Convert natural language query to SQL-like operations on the dataframe

        Args:
            df: Pandas DataFrame
            natural_language_query: Natural language query

        Returns:
            Dictionary containing generated query and results
        """
        try:
            # Create SQL generation context
            sql_context = f"""
Convert this natural language query to pandas operations: "{natural_language_query}"

Available columns: {', '.join(df.columns.tolist())}
Data types: {df.dtypes.astype(str).to_dict()}

Provide the response as JSON:
{{
    "pandas_code": "Python pandas code to execute",
    "explanation": "Explanation of the generated code",
    "expected_output": "Description of what the code will return"
}}
"""
            response = self.model.generate_content(
                sql_context,
                generation_config=self.generation_config
            )

            # Parse the response
            import re
            json_match = re.search(r'\{.*\}', response.text, re.DOTALL)

            if json_match:
                result = json.loads(json_match.group())
                return {
                    "status": "success",
                    "query": natural_language_query,
                    "generated_code": result
                }
            else:
                return {
                    "status": "error",
                    "query": natural_language_query,
                    "error": "Could not generate valid code from query"
                }

        except Exception as e:
            return {
                "status": "error",
                "query": natural_language_query,
                "error": str(e)
            }

# Global service instance
_gemini_service = None

def get_gemini_service() -> GeminiService:
    """Get or create the global Gemini service instance"""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service