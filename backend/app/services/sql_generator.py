"""
SQL generation service using AI for converting natural language to SQL queries
"""

import re
import json
from typing import Dict, Optional, List
import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv()


class SQLGenerator:
    """Service for generating SQL queries from natural language using Gemini AI"""

    def __init__(self):
        self.model = None
        self._configured = False

    def generate_query(self, nl_query: str, schema: Dict[str, str], table_name: str, context: Optional[str] = None) -> str:
        """
        Generate a SQL query from natural language

        Args:
            nl_query: Natural language query
            schema: Dictionary mapping column names to their SQL types
            table_name: Name of the table to query
            context: Optional context from previous interactions

        Returns:
            Generated SQL query string
        """
        # Initialize model if not done
        if not self._configured:
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("GEMINI_API_KEY environment variable is required")
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-2.0-flash')
            self._configured = True

        # Create schema description
        schema_desc = "\n".join([f"- {col}: {dtype}" for col, dtype in schema.items()])

        # Build prompt
        prompt = f"""
You are an expert SQL query generator. Convert the following natural language query into a safe SQL SELECT statement.

Database Schema:
{schema_desc}

Natural Language Query: {nl_query}

{context or ""}

Instructions:
- Generate ONLY a SELECT statement (no INSERT, UPDATE, DELETE, DROP, etc.)
- Use proper SQL syntax with table name '{table_name}'
- Handle aggregations, filtering, grouping, ordering as needed
- For vague queries like "top products", infer reasonable aggregations (e.g., ORDER BY sales DESC LIMIT 100)
- For time-based queries like "last quarter", use appropriate date filters
- Always include LIMIT 100 for safety to prevent large result sets
- Ensure the query is safe and cannot modify data
- Return only the SQL query, no explanations

SQL Query:
"""

        try:
            response = self.model.generate_content(prompt)
            sql_query = response.text.strip()

            # Clean up the response (remove markdown if present)
            sql_query = sql_query.replace('```sql', '').replace('```', '').strip()

            # Validate the query is safe
            if self._validate_sql(sql_query):
                return sql_query
            else:
                return f"SELECT * FROM {table_name} LIMIT 10;"  # Fallback safe query

        except Exception as e:
            print(f"Error generating SQL: {e}")
            return f"SELECT * FROM {table_name} LIMIT 10;"  # Fallback

    def _validate_sql(self, sql: str) -> bool:
        """Basic validation to ensure query is safe SELECT only"""
        sql_upper = sql.upper().strip()

        # Must start with SELECT
        if not sql_upper.startswith('SELECT'):
            return False

        # Must not contain dangerous keywords
        dangerous_keywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'TRUNCATE']
        for keyword in dangerous_keywords:
            if keyword in sql_upper:
                return False

        return True

    def generate_visualizations(self, nl_query: str, sql_result: Dict[str, any], schema: Dict[str, str]) -> List[Dict[str, any]]:
        """
        Generate up to 3 visualization configurations using Gemini AI

        Args:
            nl_query: Original natural language query
            sql_result: Results from SQL execution
            schema: Table schema

        Returns:
            List of visualization configurations (max 3)
        """
        # Initialize model if not done
        if not self._configured:
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("GEMINI_API_KEY environment variable is required")
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-2.0-flash')
            self._configured = True

        columns = sql_result.get('columns', [])
        data = sql_result.get('data', [])

        if not columns or not data:
            return [{'type': 'table', 'data': data, 'columns': columns, 'title': 'Query Results'}]

        # Create viz generation prompt
        schema_desc = "\n".join([f"- {col}: {dtype}" for col, dtype in schema.items()])

        viz_prompt = f"""
Based on this query and results, suggest up to 3 appropriate visualizations.

Query: {nl_query}
Schema: {schema_desc}
Columns: {', '.join([col['name'] for col in columns])}
Data sample: {data[:5] if data else 'No data'}

Return JSON array of visualization configs. Each config should have:
- type: "bar", "line", "pie", "scatter", "table"
- xAxis: column name for x-axis (if applicable)
- yAxis: column name for y-axis (if applicable)
- data: the data array
- title: descriptive title
- columns: column definitions (for table)

Limit to maximum 3 visualizations. Focus on most insightful ones.
"""

        try:
            response = self.model.generate_content(viz_prompt)
            viz_configs = json.loads(response.text.strip())
            return viz_configs[:3] if isinstance(viz_configs, list) else [viz_configs]
        except:
            # Fallback to heuristic
            return [self.generate_visualization_config(nl_query, sql_result)]

    def generate_visualization_config(self, nl_query: str, sql_result: Dict[str, any]) -> Dict[str, any]:
        """
        Generate single visualization configuration based on query and results (heuristic fallback)

        Args:
            nl_query: Original natural language query
            sql_result: Results from SQL execution

        Returns:
            Visualization configuration
        """
        # Simple heuristic-based viz generation
        columns = sql_result.get('columns', [])
        data = sql_result.get('data', [])

        if not columns or not data:
            return {'type': 'table', 'data': data, 'columns': columns, 'title': 'Query Results'}

        # Check for numeric columns
        numeric_cols = [col for col in columns if col.get('type') in ['INTEGER', 'FLOAT']]

        if len(numeric_cols) >= 2:
            # Scatter plot for two numeric columns
            return {
                'type': 'scatter',
                'xAxis': numeric_cols[0]['name'],
                'yAxis': numeric_cols[1]['name'],
                'data': data,
                'title': f"{numeric_cols[0]['name']} vs {numeric_cols[1]['name']}"
            }
        elif len(numeric_cols) == 1 and len(columns) > 1:
            # Bar chart for category + numeric
            category_col = next((col for col in columns if col['name'] != numeric_cols[0]['name']), columns[0])
            return {
                'type': 'bar',
                'xAxis': category_col['name'],
                'yAxis': numeric_cols[0]['name'],
                'data': data,
                'title': f"{numeric_cols[0]['name']} by {category_col['name']}"
            }
        else:
            # Default to table
            return {
                'type': 'table',
                'data': data,
                'columns': columns,
                'title': 'Query Results'
            }


# Global instance
sql_generator = SQLGenerator()
