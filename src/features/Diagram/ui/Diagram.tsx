import 'reactflow/dist/style.css';
import styles from './Diagram.module.scss';

import ReactFlow, { Background, BackgroundVariant, Connection, Controls, SelectionMode } from 'reactflow';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useEffect } from 'react';
import { docActions } from '@/redux/doc/slice/docSlice';
import { useCurrentPage } from '@/hooks/useCurrentPage';
import { CiCircleInfo } from 'react-icons/ci';
import { commonTexts } from '@/shared/consts/texts';
import { useKey } from '@/shared/hooks/useKey';
import { useGetDocState } from '@/redux/doc/hooks/useGetDocState';
import { useGetFlowCallbacks } from '../model/hooks/useGetFlowCallbacks';
import { NodeTypes } from '../model/interface';
import { DiagramButtons } from '@/features/DiagramButtons/DiagramButtons';
import { useContextMenu } from '@/features/NodeContextMenu';
import { NodeContextMenu } from '@/features/NodeContextMenu/ui/NodeContextMenu';

const panOnDrag = [1, 2];

interface DiagramProps {
  onSave: () => void;
}

export const Diagram = ({
  onSave,
}: DiagramProps) => {
  const { pages, currentPageId, selectedNodes, isUpdated } = useGetDocState();
  const currentPage = useCurrentPage(pages, currentPageId);
  const { history, step, docName } = useAppSelector((state) => state.doc);

  if (!currentPage) {
    return <p>Страница не подготовлена</p>
  }

  const dispatch = useAppDispatch();

  /** Save logic */
  useKey((event) => {
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault();
      onSave();
    }
  });

  const { contextMenuProps, onShowContextMenu, onCloseContextMenu } = useContextMenu();

  const flowCallbacks = useGetFlowCallbacks(history, step, currentPage);

  const onClickOutSide = () => {
    onCloseContextMenu();
    if (selectedNodes.length) {
      dispatch(docActions.onReleaseNodes());
    }
  };

  useEffect(() => {
    document.title = docName ?? 'Web diagrams';
  }, [docName]);

  useEffect(() => {
    () => {
      dispatch(docActions.onResetState());
    }
  }, [])

  return (
    <div style={{ height: '100vh', width: '100vw' }} onClick={onClickOutSide}>
      <div>
        {isUpdated && (
          <CiCircleInfo title={commonTexts.unsaved} className={styles.saveIcon} size={35} color="red" />
        )}
      </div>
      <NodeContextMenu state={contextMenuProps} />
      <ReactFlow
        nodes={currentPage.nodes}
        edges={currentPage.edges}
        onNodesChange={flowCallbacks.onNodeChange}
        onNodesDelete={(e) => console.log(e)}
        onNodeDragStop={flowCallbacks.onNodeDragStop}
        onEdgesChange={flowCallbacks.onEdgesChange}
        onConnect={(changes: Connection) => dispatch(docActions.onConnect(changes))}
        onEdgeUpdateStart={flowCallbacks.onEdgeUpdateStart}
        onEdgeUpdate={flowCallbacks.onEdgeUpdate}
        onEdgeUpdateEnd={flowCallbacks.onEdgeUpdateEnd}
        fitView
        nodeTypes={NodeTypes}
        proOptions={{ hideAttribution: true }}
        onContextMenu={onShowContextMenu}
        panOnScroll
        selectionOnDrag
        panOnDrag={panOnDrag}
        selectionMode={SelectionMode.Partial}
      >
        <Background variant={BackgroundVariant.Cross} />
        <Controls position="top-left">
          <DiagramButtons
            onUndo={flowCallbacks.onUndo}
            onRedo={flowCallbacks.onRedo}
            onSave={onSave}
          />
        </Controls>
      </ReactFlow>
    </div>
  );
};
