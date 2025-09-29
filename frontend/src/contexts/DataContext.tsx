import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import type {
  ChatMessageResponse,
  ChatSessionSummary,
  FileDetail,
  QueryHistoryEntry,
  VisualizationConfig,
  UserResponse,
} from '../services/apiService';

interface DataContextType {
  activeFileId: number | null;
  setActiveFileId: (fileId: number | null) => void;
  fileDetail?: FileDetail;
  setFileDetail: (detail?: FileDetail) => void;
  fileMetadata?: any;
  setFileMetadata: (metadata?: any) => void;
  sharedViz: VisualizationConfig[];
  setSharedViz: (viz: VisualizationConfig[]) => void;
  latestResults?: { columns: { name: string; type: string }[]; data: any[]; row_count: number };
  setLatestResults: (results?: { columns: { name: string; type: string }[]; data: any[]; row_count: number }) => void;
  dataQualityDisclaimer?: string;
  setDataQualityDisclaimer: (message?: string) => void;
  queryHistory: QueryHistoryEntry[];
  setQueryHistory: (history: QueryHistoryEntry[]) => void;
  activeSession?: ChatSessionSummary | null;
  setActiveSession: (session: ChatSessionSummary | null) => void;
  chatMessages: ChatMessageResponse[];
  setChatMessages: (messages: ChatMessageResponse[]) => void;
  appendChatMessages: (messages: ChatMessageResponse[]) => void;
  currentUser?: UserResponse | null;
  setCurrentUser: (user: UserResponse | null) => void;
  authLoading: boolean;
  setAuthLoading: (value: boolean) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [activeFileId, setActiveFileId] = useState<number | null>(null);
  const [fileDetail, setFileDetail] = useState<FileDetail | undefined>();
  const [fileMetadata, setFileMetadata] = useState<any | undefined>();
  const [sharedViz, setSharedViz] = useState<VisualizationConfig[]>([]);
  const [latestResults, setLatestResults] = useState<{ columns: { name: string; type: string }[]; data: any[]; row_count: number } | undefined>();
  const [dataQualityDisclaimer, setDataQualityDisclaimer] = useState<string | undefined>();
  const [queryHistory, setQueryHistory] = useState<QueryHistoryEntry[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSessionSummary | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessageResponse[]>([]);
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const appendChatMessages = (messages: ChatMessageResponse[]) => {
    if (messages.length === 0) {
      return;
    }
    setChatMessages((prev) => {
      const merged = [...prev];
      messages.forEach((message) => {
        const existingIndex = merged.findIndex((item) => item.id === message.id);
        if (existingIndex >= 0) {
          merged[existingIndex] = message;
        } else {
          merged.push(message);
        }
      });
      return merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });
  };

  const value = useMemo<DataContextType>(
    () => ({
      activeFileId,
      setActiveFileId,
      fileDetail,
      setFileDetail,
      fileMetadata,
      setFileMetadata,
      sharedViz,
      setSharedViz,
      latestResults,
      setLatestResults,
      dataQualityDisclaimer,
      setDataQualityDisclaimer,
      queryHistory,
      setQueryHistory,
      activeSession,
      setActiveSession,
      chatMessages,
      setChatMessages,
      appendChatMessages,
      currentUser,
      setCurrentUser,
      authLoading,
      setAuthLoading,
    }),
    [
      activeFileId,
      fileDetail,
      fileMetadata,
      sharedViz,
      latestResults,
      dataQualityDisclaimer,
      queryHistory,
      activeSession,
      chatMessages,
      currentUser,
      authLoading,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useDataContext = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within a DataProvider');
  }

  return context;
};
