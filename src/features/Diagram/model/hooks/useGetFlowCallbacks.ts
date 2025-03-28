import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { CommonNodeDataType, Page } from '@/redux/doc/interfaces/docStateInterfaces';
import { docActions } from '@/redux/doc/slice/docSlice';
import { useCallback, useRef } from 'react';
import { applyEdgeChanges, Connection, Edge, Node, EdgeChange, NodeChange, reconnectEdge } from 'reactflow';

interface Props {
  currentPage: Page;
  nodes: Node<CommonNodeDataType>[];
  edges: Edge[];
}

export const useGetFlowCallbacks = ({
  currentPage, nodes, edges,
}: Props) => {
  const { history, step } = useAppSelector((state) => state.doc);
  const dispatch = useAppDispatch();
  const edgeUpdateSuccessful = useRef(true);

  const onNodeChange = useCallback(
    (changes: NodeChange[]) => {
      dispatch(docActions.onChangeNodes({ changes }));
    },
    [dispatch],
  );

  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    if (history[step] && !history[step].pages) {
      const prevNode = history[step].pages
        .find((page) => page.id === currentPage.id).nodes
        .find((nodeItem) => nodeItem.id === node.id)
      if (prevNode.position.x !== node.position.x || prevNode.position.y !== node.position.y) {
        dispatch(docActions.onStateToHistory());
      }
    };

  }, [currentPage?.id, dispatch, history, step]);

  const onEdgeUpdateStart = useCallback(() => {
    edgeUpdateSuccessful.current = false;
  }, []);

  const onEdgeUpdate = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      edgeUpdateSuccessful.current = true;
      dispatch(docActions.onChangeEdges(reconnectEdge(oldEdge, newConnection, currentPage?.edges)));
    },
    [currentPage?.edges, dispatch],
  );

  const onEdgeUpdateEnd = useCallback(
    (_: MouseEvent | TouchEvent, edge: Edge) => {
      if (!edgeUpdateSuccessful.current && currentPage?.edges) {
        dispatch(docActions.onChangeEdges(currentPage.edges.filter((e) => e.id !== edge.id)));
      }

      edgeUpdateSuccessful.current = true;
    },
    [currentPage?.edges, dispatch],
  );

  const onUndo = useCallback(() => {
    dispatch(docActions.undo());
  }, [dispatch]);

  const onRedo = useCallback(() => {
    dispatch(docActions.redo());
  }, [dispatch]);

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => dispatch(docActions.onChangeEdges(applyEdgeChanges(changes, currentPage?.edges))),
    [currentPage?.edges, dispatch],
  );

  const onUpdateState = useCallback(() => {
    dispatch(docActions.updateNodesAndEdges({nodes, edges}));
  }, [])

  return {
    onNodeChange,
    onEdgeUpdateStart,
    onEdgeUpdate,
    onEdgeUpdateEnd,
    onUndo,
    onRedo,
    onEdgesChange,
    onNodeDragStop,
    onUpdateState,
  };
};
