const API_BASE_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:8000`;

export interface UploadResponse {
  message: string;
  file_id: number;
  filename: string;
  unique_filename: string;
  size: number;
  file_hash: string;
  validation: {
    is_valid: boolean;
    row_count: number;
    column_count: number;
    columns: string[];
    file_size: number;
  };
  processing_time_seconds: number;
  status: string;
  sheet_names: string[];
  sheet_summaries: SheetSummary[];
  processed_data?: ProcessedDataPreview;
  dynamic_table_name?: string;
  cleaning_metadata?: Record<string, CleaningMetadata>;
  error?: string;
}

export interface FileInfo {
  id: number;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  file_hash: string;
  mime_type: string;
  status: string;
  total_rows: number;
  total_columns: number;
  total_sheets?: number;
  sheet_names?: string[];
  created_at: string | null;
  processed_at: string | null;
  processing_time_seconds: number | null;
  error_message?: string | null;
}

export interface ProcessedDataPreview {
  dataframe_info: any;
  numeric_stats: any;
  column_analysis: any;
  preview_columns?: string[];
  preview_rows?: any[];
  schema?: Record<string, string>;
}

export interface CleaningMetadata {
  original_row_count: number;
  original_column_count?: number;
  cleaned_row_count: number;
  cleaned_column_count?: number;
  rows_removed: number;
  quality_score: number;
  issues?: string[];
  issue_summary?: Record<string, number>;
  cleaning_steps?: string[];
  metrics?: Record<string, number>;
  columns_renamed?: Record<string, string>;
  dataframe_info?: any;
  numeric_stats?: any;
  column_analysis?: any;
}

export interface SheetSummary {
  sheet_id: number;
  sheet_name: string;
  table_name: string;
  row_count: number;
  column_count: number;
  cleaning_metadata: CleaningMetadata;
  dataframe_info: any;
  numeric_stats: any;
  column_analysis: any;
}

export interface SheetListResponse {
  file_id: number;
  sheets: SheetMetadata[];
}

export interface SheetMetadata {
  sheet_id: number;
  sheet_name: string;
  table_name: string;
  row_count: number;
  column_count: number;
  has_headers: boolean;
  data_quality_score: number | null;
  status: string;
  processed_at: string | null;
}

export interface ColumnMetadata {
  column_id: number;
  sheet_id: number;
  file_id: number;
  column_name: string;
  original_column_name?: string | null;
  column_index: number;
  detected_data_type: string;
  confidence_score?: number | null;
  is_nullable: boolean;
  unique_values_count: number;
  null_values_count: number;
  max_length?: number | null;
  avg_length?: number | null;
  min_value?: number | null;
  max_value?: number | null;
  avg_value?: number | null;
  std_deviation?: number | null;
  earliest_date?: string | null;
  latest_date?: string | null;
  has_inconsistent_types: boolean;
  has_outliers: boolean;
  needs_cleaning: boolean;
  cleaning_applied?: string[] | null;
}

export interface DataQualityIssue {
  issue_id: number;
  issue_type: string;
  severity: string;
  description: string;
  resolved: boolean;
  detected_at: string | null;
}

export interface SheetDetailResponse {
  sheet: SheetMetadata;
  columns: ColumnMetadata[];
  quality_issues: DataQualityIssue[];
}

export interface FileDetail extends FileInfo {
  cleaning_metadata?: Record<string, CleaningMetadata>;
  dynamic_table_name?: string | null;
  sheets?: (SheetDetailResponse['sheet'] & { columns: ColumnMetadata[]; cleaning_metadata?: CleaningMetadata })[];
  processed_data?: ProcessedDataPreview;
}



const normalizeHeaders = (headers?: HeadersInit): Record<string, string> => {
  if (!headers) {
    return {};
  }

  if (headers instanceof Headers) {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  if (Array.isArray(headers)) {
    return headers.reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  }

  return headers;
};

export interface FilesResponse {
  files: FileInfo[];
  total: number;
  skip: number;
  limit: number;
}

export interface PreviewResponse {
  file_id: number;
  sheet_id: number;
  sheet_name: string;
  preview_rows: number;
  columns: string[];
  data: any[];
}

export interface AIQueryRequest {
  query: string;
  file_id: number;
  context?: string;
  session_id?: number;
  session_title?: string;
}

export interface ExecutedResults {
  data: any[];
  columns: { name: string; type: string }[];
  row_count: number;
}

export interface VisualizationConfig {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'table' | string;
  xAxis?: string;
  yAxis?: string;
  data: any[];
  title: string;
  disclaimer?: string;
  columns?: any[];
}

export interface AIQueryResponse {
  status: string;
  query: string;
  sql_query?: string;
  executed_results?: ExecutedResults;
  visualizations?: VisualizationConfig[];
  explanation?: string;
  data_quality_disclaimer?: string;
  error?: string;
  query_id?: number;
  session_id?: number;
  created_session?: ChatSessionSummary;
  session_title?: string;
  messages?: ChatMessageResponse[];
}

export interface ChatSessionSummary {
  id: number;
  title: string;
  summary?: string | null;
  file_id?: number | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  last_interaction_at?: string | null;
  message_count: number;
  assistant_preview?: string | null;
}

export interface ChatMessageResponse {
  id: number;
  session_id: number;
  user_id?: number | null;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sql_query?: string | null;
  payload?: Record<string, any> | null;
  created_at: string;
}

export interface ChatSessionListResponse {
  sessions: ChatSessionSummary[];
}

export interface ChatSessionResponse {
  session: ChatSessionSummary;
}

export interface ChatSessionCreateRequest {
  title?: string;
  file_id?: number;
}

export interface ChatMessageListResponse {
  session_id: number;
  messages: ChatMessageResponse[];
}

export interface QueryHistoryEntry {
  query_id: number;
  query: string;
  sql_query?: string;
  response?: string;
  visualization_type?: string | null;
  visualization_config?: VisualizationConfig[] | null;
  rows_returned?: number | null;
  execution_time_ms?: number | null;
  status: string;
  created_at: string | null;
}

export interface QueryHistoryResponse {
  file_id: number;
  history: QueryHistoryEntry[];
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const { headers: extraHeaders, ...restOptions } = options || {};

    const mergedHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...normalizeHeaders(extraHeaders),
    };

    const config: RequestInit = {
      headers: mergedHeaders,
      ...restOptions,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Network error' }));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async uploadFile(file: File, onProgress?: (event: ProgressEvent<EventTarget>) => void): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/upload`);

      xhr.upload.onprogress = (event) => {
        if (onProgress) {
          onProgress(event);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (parseError) {
            reject(new Error('Failed to parse upload response'));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new Error(errorData.detail || 'Upload failed'));
          } catch (error) {
            reject(new Error('Upload failed'));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during upload'));
      };

      xhr.send(formData);
    });
  }

  async getFiles(skip: number = 0, limit: number = 100): Promise<FilesResponse> {
    return this.request<FilesResponse>(`/files?skip=${skip}&limit=${limit}`);
  }

  async getFile(fileId: number): Promise<FileDetail> {
    return this.request<FileDetail>(`/files/${fileId}`);
  }

  async getFileMetadata(fileId: number): Promise<{
    file_id: number;
    sheet_names: string[];
    cleaning_metadata: Record<string, CleaningMetadata>;
    total_sheets: number;
    total_rows: number;
  }> {
    return this.request(`/files/${fileId}/metadata`);
  }

  async getFileSheets(fileId: number): Promise<SheetListResponse> {
    return this.request<SheetListResponse>(`/files/${fileId}/sheets`);
  }

  async getSheetDetail(fileId: number, sheetId: number): Promise<SheetDetailResponse> {
    return this.request<SheetDetailResponse>(`/files/${fileId}/sheets/${sheetId}`);
  }

  async getFilePreview(
    fileId: number,
    options: { rows?: number; sheetId?: number; sheetName?: string } = {},
  ): Promise<PreviewResponse> {
    const params = new URLSearchParams();
    params.append('rows', String(options.rows ?? 10));
    if (options.sheetId !== undefined) {
      params.append('sheet_id', String(options.sheetId));
    }
    if (options.sheetName !== undefined) {
      params.append('sheet_name', options.sheetName);
    }

    return this.request<PreviewResponse>(`/files/${fileId}/preview?${params.toString()}`);
  }

  async deleteFile(fileId: number): Promise<{ message: string; file_id: number; filename: string }> {
    return this.request<{ message: string; file_id: number; filename: string }>(`/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  async generateSQL(request: AIQueryRequest): Promise<AIQueryResponse> {
    return this.request<AIQueryResponse>('/ai/generate-sql', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async executeSQL(fileId: number, sqlQuery: string): Promise<{
    status: string;
    data: any[];
    columns: { name: string; type: string }[];
    row_count: number;
  }> {
    return this.request<{
      status: string;
      data: any[];
      columns: { name: string; type: string }[];
      row_count: number;
    }>('/ai/execute-sql', {
      method: 'POST',
      body: JSON.stringify({
        file_id: fileId,
        sql_query: sqlQuery,
      }),
    });
  }

  async runAIQuery(request: AIQueryRequest): Promise<AIQueryResponse> {
    return this.request<AIQueryResponse>('/chat/send-message', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async listChatSessions(includeArchived = false): Promise<ChatSessionListResponse> {
    const query = includeArchived ? '?include_archived=true' : '';
    return this.request<ChatSessionListResponse>(`/chat/sessions${query}`);
  }

  async createChatSession(payload: ChatSessionCreateRequest): Promise<ChatSessionResponse> {
    return this.request<ChatSessionResponse>('/chat/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async listChatMessages(sessionId: number, limit = 200, offset = 0): Promise<ChatMessageListResponse> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    return this.request<ChatMessageListResponse>(`/chat/sessions/${sessionId}/messages?${params.toString()}`);
  }

  async getQueryHistory(fileId: number): Promise<QueryHistoryResponse> {
    return this.request<QueryHistoryResponse>(`/files/${fileId}/query-history`);
  }

  async exportFile(fileId: number, format: 'csv' | 'json' | 'excel'): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}/export?format=${format}`);
    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }
    return response.blob();
  }


}

export const apiService = new ApiService();