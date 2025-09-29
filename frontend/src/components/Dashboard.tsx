import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

import ChatInterface from './ChatInterface';
import PlaygroundArea from './PlaygroundArea';
import ToolsPanel from './ToolsPanel';
import HeaderBar from './HeaderBar';

interface DashboardProps {
  selectedFileId: number | null;
  fileName?: string;
  onOpenUploadModal: () => void;
  onFileSelect: (fileId: number) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  selectedFileId,
  fileName,
  onOpenUploadModal,
  onFileSelect,
}) => {
  const minChatSize = 20;
  const defaultChatSize = 30;
  const minPlaygroundSize = 40;
  const minToolsSize = 20;

  const layoutKey = useMemo(() => `layout-${selectedFileId ?? 'default'}`, [selectedFileId]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <HeaderBar />

      <PanelGroup direction="horizontal" autoSaveId={layoutKey}>
        <Panel defaultSize={defaultChatSize} minSize={minChatSize} collapsible>
          <Box sx={{ height: '100%', borderRight: '1px solid', borderColor: 'divider' }}>
            <ChatInterface
              selectedFileId={selectedFileId}
              fileName={fileName}
              onOpenUploadModal={onOpenUploadModal}
            />
          </Box>
        </Panel>

        <PanelResizeHandle className="panel-resize-handle" />

        <Panel minSize={minPlaygroundSize} defaultSize={50}>
          <Box sx={{ height: '100%', borderRight: '1px solid', borderColor: 'divider', px: 2 }}>
            <PlaygroundArea
              selectedFileId={selectedFileId}
              fileName={fileName}
              onOpenUploadModal={onOpenUploadModal}
            />
          </Box>
        </Panel>

        <PanelResizeHandle className="panel-resize-handle" />

        <Panel defaultSize={20} minSize={minToolsSize} collapsible>
          <Box sx={{ height: '100%', px: 2 }}>
            <ToolsPanel
              selectedFileId={selectedFileId}
              fileName={fileName}
              onFileSelect={onFileSelect}
              onOpenUploadModal={onOpenUploadModal}
            />
          </Box>
        </Panel>
      </PanelGroup>
    </Box>
  );
};

export default Dashboard;

