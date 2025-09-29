Create an **AI Data Agent** platform. This dashboard will allow users to upload any Excel file and then use natural language to ask complex business questions about their data. The platform should analyze the data and provide answers, along with relevant charts and tables.

### 🎯 Core Functionality:

- **Frontend (React):**
  - Design a two-panel dashboard layout (A: AI Chat Box & B: Dashboard Playground with 30:70 screen ratio, also with draggable and adjustable screen size).
  - The left panel (30%) will be a chat interface for users to input their natural language queries.
  - The right panel (70%) will serve as the "Playground," displaying the generated charts, tables, and analytical results.
  - A header with collapsible tools panel for additional user controls and information.
  - Implement a robust **file upload system** that specifically accepts Excel files (.xls, .xlsx). This system must be intuitive, perhaps with drag-and-drop functionality, and provide real-time feedback on the upload status.

- **Backend (Python):**
  - Develop a Python backend to handle file processing and AI logic.
  - Upon file upload, the backend must ingest the Excel data. Use libraries like **Pandas** and **OpenPyXL** to read various Excel formats and handle multiple sheets.
  - Design a **SQL database** schema that can dynamically accommodate the structure of any uploaded Excel file. The system must be able to create or alter tables on the fly to match the columns and data types of the user's data.

### 🧠 AI Agent Capabilities:

- The AI agent must be capable of processing a wide range of **natural language queries** about the uploaded data.
- It should be able to handle **vague questions** and infer the user's intent to perform calculations, aggregations, and comparisons (e.g., "What were our top-selling products last quarter?").
- The agent's core challenge is to manage **dirty, inconsistent, or incomplete data**. This includes:
  - Automatically identifying and handling unnamed columns and sheets.
  - Implementing data cleaning routines to address inconsistent formatting and missing values (e.g., converting date formats, standardizing text).
  - The AI should provide an explanation or a disclaimer when the data quality affects the accuracy of its analysis.

### 📊 Data Visualization:

- Based on the AI's analysis, the backend should generate appropriate data visualizations (e.g., bar charts, line graphs, pivot tables).
- These visualizations should be dynamically rendered on the frontend to provide a clear and insightful representation of the query results.
- The system should intelligently choose the best chart type for the data being presented.