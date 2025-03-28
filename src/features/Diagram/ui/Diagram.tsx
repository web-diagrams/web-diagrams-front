import 'reactflow/dist/style.css';
import styles from './Diagram.module.scss';

import ReactFlow, { Background, BackgroundVariant, Connection, Controls, NodeChange, SelectionMode, useEdgesState, useNodesState } from 'reactflow';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useCallback, useEffect } from 'react';
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
  const { docName } = useAppSelector((state) => state.doc);
  const dispatch = useAppDispatch();

  if (!currentPage) {
    return <p>Страница не подготовлена</p>
  }

  // промежуточные данные
  const [nodes, setNodes, onNodesChange] = useNodesState(currentPage.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(currentPage.edges);

  /** Save logic */
  useKey((event) => {
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault();
      onSave();
    }
  });

  const { contextMenuProps, onShowContextMenu, onCloseContextMenu } = useContextMenu();

  const flowCallbacks = useGetFlowCallbacks({currentPage, nodes, edges});

  const onClickOutSide = () => {
    onCloseContextMenu();
    if (selectedNodes.length) {
      dispatch(docActions.onReleaseNodes());
    }
  };

  const onNodesChangesCb = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);
    // if ('dragging' in changes[0] && !changes[0].dragging) {
    //   dispatch(docActions.onChangeNodes({changes}))
    // }
  }, [])

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
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangesCb}
        onEdgesChange={onEdgesChange}

        onNodesDelete={(e) => console.log(e)}
        onNodeDragStop={flowCallbacks.onNodeDragStop}
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
