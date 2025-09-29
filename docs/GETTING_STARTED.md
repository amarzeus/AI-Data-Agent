# Getting Started Guide

## 🎯 Your First Steps with AI Data Agent

Welcome to the AI Data Agent! This guide will walk you through your first experience with the platform, from uploading your first file to getting AI-powered insights.

## 📋 What You'll Learn

- ✅ Upload and process your first Excel file
- ✅ Ask natural language questions about your data
- ✅ Create interactive visualizations
- ✅ Export results for reporting
- ✅ Understand the interface and features

## 🚀 Step 1: Quick Setup

### If you haven't installed yet:
```bash
git clone <repository-url>
cd ai-data-agent
./setup.sh
```

### Start the application:
```bash
./start.sh
```

Visit **http://localhost:3000** in your browser.

---

## 📊 Step 2: Upload Your Data

### The Upload Interface

When you first open the application, you'll see:

**Left Panel**: AI Chat Interface - Where you'll ask questions
**Right Panel**: Data Playground - Where you'll see results and visualizations

### Uploading Files

1. **Drag and Drop**
   - Locate your Excel file (.xlsx or .xls)
   - Drag it into the upload area in the right panel
   - Or click "Browse" to select files

2. **Supported File Types**
   - ✅ Excel 2007+ (.xlsx)
   - ✅ Excel 97-2003 (.xls)
   - ✅ Maximum file size: 50MB
   - ✅ Multiple worksheets supported

3. **Upload Progress**
   - Real-time progress indicator
   - File validation and verification
   - Automatic data quality analysis

### What Happens During Upload

The system automatically:
- 📄 Validates file format and structure
- 🧹 Cleans and processes your data
- 🗄️ Creates database tables
- 📊 Analyzes data quality
- 🎯 Prepares data for AI analysis

**Multi-Sheet Files**: Each worksheet is processed separately, allowing you to query across all sheets or focus on specific ones.

---

## 🤖 Step 3: Ask Your First Question

### The AI Chat Interface

The left panel is your AI assistant. Here's how to use it:

1. **Type Your Question**
   ```
   "What were our top-selling products last quarter?"
   ```

2. **Press Enter** or click the send button

3. **Wait for AI Analysis** (usually 2-5 seconds)

4. **Review the Response**

### Example Questions to Try

#### Sales Analysis
```
"What are our best performing products?"
"Show me monthly sales trends"
"Which region has the highest growth rate?"
```

#### Customer Analysis
```
"Who are our most valuable customers?"
"What is the average order value by segment?"
"Show customer acquisition trends"
```

#### Financial Analysis
```
"What are our top revenue generating products?"
"Show profit margins by category"
"Analyze cost trends over time"
```

### Understanding AI Responses

The AI provides:

**📈 Statistical Insights**: Key numbers and trends
**🔍 Trend Identification**: What's going up or down
**🎯 Recommendations**: Actionable suggestions
**📊 Suggested Visualizations**: Chart recommendations

---

## 🎨 Step 4: Create Visualizations

### The Data Playground (Right Panel)

This is where your data comes to life with interactive charts and tables.

### Creating Your First Chart

1. **AI Suggests Visualizations**
   - Based on your question, the AI suggests the best chart type
   - Common suggestions: Bar charts, Line charts, Pie charts

2. **Click "Create Visualization"**
   - Located in the AI response area
   - Opens the visualization builder

3. **Customize Your Chart**
   - **Chart Type**: Bar, Line, Area, Pie, Scatter, Histogram
   - **X-Axis**: Choose your categories (e.g., Product Names)
   - **Y-Axis**: Choose your values (e.g., Sales Amount)
   - **Aggregation**: Sum, Average, Count, etc.

4. **Interactive Features**
   - Hover for detailed values
   - Zoom and pan capabilities
   - Toggle legends and grid lines
   - Export options

### Chart Type Guide

| Chart Type | Best For | Example Use Case |
|------------|----------|------------------|
| **Bar Chart** | Comparing values | Sales by product, Revenue by region |
| **Line Chart** | Trends over time | Monthly sales, Growth trends |
| **Pie Chart** | Proportions | Market share, Category breakdown |
| **Scatter Plot** | Relationships | Correlation analysis, Outlier detection |
| **Histogram** | Distributions | Age groups, Price ranges |

---

## 📤 Step 5: Export Your Results

### Export Options

#### Charts and Visualizations
- **PNG**: High-quality images for presentations
- **SVG**: Scalable vector graphics for reports
- **PDF**: Complete reports with charts and data

#### Data Tables
- **CSV**: Raw data for further analysis
- **Excel**: Formatted spreadsheets
- **JSON**: Structured data for APIs

### How to Export

1. **In the Visualization Panel**
   - Click the export button (usually top-right)
   - Choose your format
   - Customize options (size, colors, etc.)

2. **From Data Tables**
   - Select the data you want to export
   - Click "Export" button
   - Choose format and destination

---

## 🔧 Step 6: Advanced Features

### Multi-Sheet Analysis

If your Excel file has multiple worksheets:

1. **Query Across Sheets**
   ```
   "Compare sales data across all worksheets"
   ```

2. **Sheet-Specific Queries**
   ```
   "Show me data from the 'Q4_Sales' sheet"
   ```

3. **Combined Visualizations**
   - Create charts that combine data from multiple sheets
   - Compare trends across different time periods

### Data Quality Analysis

The system automatically analyzes your data for:

- **Missing Values**: Identifies gaps in your data
- **Data Types**: Validates column formats
- **Outliers**: Highlights unusual values
- **Duplicates**: Finds repeated records

### Advanced Queries

#### Complex Analysis
```
"Calculate the year-over-year growth rate for each product category"
"Identify customers who haven't purchased in the last 6 months"
"Show me the correlation between marketing spend and sales"
```

#### Comparative Analysis
```
"Compare this quarter's performance with the same quarter last year"
"How do our sales compare to industry benchmarks?"
"Which products have the highest profit margins?"
```

---

## 🎯 Step 7: Tips for Success

### Best Practices for Questions

#### Be Specific
Instead of: "How's business?"
Try: "What were our total sales and growth rate last month?"

#### Use Context
Include time periods, regions, or product categories:
```
"Show me sales trends for electronics in North America for 2024"
```

#### Ask Follow-up Questions
Based on AI responses:
```
"Tell me more about why Product A performed so well"
"What should we do to improve Product C's sales?"
```

### Working with Large Files

#### File Size Optimization
- Remove unnecessary columns before upload
- Split very large files into smaller chunks
- Use data sampling for initial exploration

#### Performance Tips
- Start with smaller datasets for testing
- Use specific date ranges in queries
- Create summary tables for faster analysis

### Troubleshooting Common Issues

#### "AI doesn't understand my question"
- Be more specific about what you want
- Include column names or sheet names
- Break complex questions into simpler parts

#### "Chart looks wrong"
- Check if you're using the right chart type
- Verify your axis selections
- Ensure data types are correct (numbers vs text)

#### "File upload fails"
- Check file size (max 50MB)
- Ensure proper Excel format (.xlsx or .xls)
- Try a smaller sample file first

---

## 📚 Step 8: Learning Resources

### Documentation
- **[Complete User Guide](./USER_GUIDE.md)** - Detailed feature documentation
- **[API Reference](./API.md)** - For developers and integrations
- **[Troubleshooting Guide](./README.md#troubleshooting)** - Common solutions

### Video Tutorials (Coming Soon)
- Getting Started video series
- Advanced features walkthrough
- Best practices guide

### Community
- Join our Discord community for questions
- Share your success stories
- Get help from other users

---

## 🎉 Congratulations!

You've successfully:

- ✅ Uploaded your first Excel file
- ✅ Asked AI-powered questions
- ✅ Created interactive visualizations
- ✅ Exported results for sharing

### What's Next?

**Explore More Features:**
- Try different types of visualizations
- Upload multiple files and compare datasets
- Experiment with complex queries

**Customize Your Experience:**
- Adjust chart colors and styling
- Save frequently used queries
- Set up data refresh schedules

**Share Your Insights:**
- Export charts for presentations
- Share datasets with your team
- Create automated reports

### Need Help?

- **📖 Documentation**: Check the complete guides in the `/docs` folder
- **🔧 Troubleshooting**: See common solutions in the main README
- **💬 Community**: Join discussions for user support

---

**Ready to transform your data analysis workflow? Start exploring your data with AI-powered insights today! 🚀**
