import 'reactflow/dist/style.css';

import ReactFlow, {
    Controls,
    Background,
    NodeChange,
    EdgeChange,
    Connection,
} from 'reactflow';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import Lists from "@/components/Lists/Lists";
import { NodeTypes } from './interface';
import StartWindow from '../StartWindow/StartWindow';
import { useCallback } from 'react';
import { flowActions } from '@/redux/flow/slice/flowSlice';

function Main() {
    const { nodes, edges } = useAppSelector((state) => state.flow)
    const { pages, id } = useAppSelector((state) => state.list)
    const dispatch = useAppDispatch()

    const saveToFile = useCallback(() => {
        const fileName = "random";

        /**Обновляем в массиве страниц текущую страницу */
        const pagesToSave = pages.map(page => {
            if (page.id === id) {
                return {
                    ...page,
                    nodes: nodes,
                    edges: edges
                }
            }
            return page
        })

        const json = JSON.stringify({ pages: pagesToSave }, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const href = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = href;
        link.download = fileName + ".json";
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(href);
    }, [pages, nodes, edges])

    return (
        <div style={{ height: '100vh', width: '100vw' }}>

            {nodes ?
                <>
                    <div style={{ position: 'fixed', top: '15px', left: '15px', zIndex: '111' }}>
                        <button onClick={() => dispatch(flowActions.onAddNode({ type: 'stringNode' }))}>Добавить текстовый инпут</button>
                        <button onClick={() => dispatch(flowActions.onAddNode({ type: 'codeNode' }))}>Добавить инпут под код</button>
                        <button onClick={saveToFile}>Сохранить страницу</button>
                    </div>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
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
                    <Lists />
                </> : <StartWindow />
            }
        </div>
    );
}

export default Main;