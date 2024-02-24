import 'reactflow/dist/style.css';

import ReactFlow, { Controls, Background, NodeChange, EdgeChange, Connection } from 'reactflow';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import Pages from '@/components/Pages/Pages';
import { NodeTypes } from './interface';
import StartWindow from '../StartWindow/StartWindow';
import { useCallback, useRef } from 'react';
import { flowActions } from '@/redux/flow/slice/flowSlice';
import { useCurrentPage } from '@/hooks/useCurrentPage';
import { NodeData } from '@/redux/flow/constants/constants';

function Main() {
  const { pages, currentPageId, selectedNodes } = useAppSelector((state) => state.flow);
  const dispatch = useAppDispatch();

  const currentPage = useCurrentPage(pages, currentPageId);

  const saveToFile = useCallback(() => {
    const fileName = 'random';

    const json = JSON.stringify({ pages: pages }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const href = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = href;
    link.download = fileName + '.json';
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  }, [pages, currentPageId]);

  const divRef = useRef(null);

  const onClickOutSide = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (divRef.current && divRef.current.contains(e.target) && selectedNodes.length) {
        dispatch(flowActions.onReleaseNodes());
      }
    },
    [selectedNodes],
  );

  return (
    <div ref={divRef} style={{ height: '100vh', width: '100vw' }} onClick={onClickOutSide}>
      {currentPage ? (
        <>
          <div style={{ position: 'fixed', top: '15px', left: '15px', zIndex: '111' }}>
            <button onClick={() => dispatch(flowActions.onAddNode({ type: NodeData.STRING_NODE }))}>
              Добавить текстовый инпут
            </button>
            <button onClick={() => dispatch(flowActions.onAddNode({ type: NodeData.CODE_NODE }))}>
              Добавить инпут под код
            </button>
            <button onClick={saveToFile}>Сохранить страницу</button>
          </div>
          <ReactFlow
            nodes={currentPage.nodes}
            edges={currentPage.edges}
            onNodesChange={(changes: NodeChange[]) => dispatch(flowActions.onChangeNodes(changes))}
            onEdgesChange={(changes: EdgeChange[]) => dispatch(flowActions.onChangeEdges(changes))}
            onConnect={(changes: Connection) => dispatch(flowActions.onConnect(changes))}
            onNodesDelete={(e) => console.log(e)}
            fitView
            nodeTypes={NodeTypes}
          >
            <Background />
            <Controls />
          </ReactFlow>
          <Pages />
        </>
      ) : (
        <StartWindow />
      )}
    </div>
  );
}

export default Main;
