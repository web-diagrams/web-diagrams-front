import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { Connection, NodeChange, applyNodeChanges, addEdge, getConnectedEdges, Node, Edge, XYPosition } from 'reactflow';
import { CommonNodeDataType, FlowState, DocState, CodeNodeData, Language } from '../interfaces/docStateInterfaces';
import { uploadFile } from '../services/uploadFile';
import { stateToHistory, getNewNode, getCurrentPage } from '../docUtils';
import { v1 } from 'uuid';
import { NodeData } from '../constants/constants';
import { cloneDeep } from 'lodash';
import { DocDto } from '@/shared/types/doc';
import { initState } from '../lib/initState';
import { saveFileToDB, updateFileInDB } from '@/shared/lib/indexDb';

const getDoc = (): FlowState => ({
  pages: [
    {
      id: v1(),
      nodes: [],
      edges: [],
      pageName: "New page"
    }
  ],
  currentPageId: '',
  selectedNodes: [],
  isUpdated: false,
  docName: 'Untitled',
});

const getInitialState = () => {
  const docState = getDoc()

  return {
    history: [cloneDeep(docState)],
    currentState: docState,
    step: 0,
    isInited: false,
  }
}

export const docSlice = createSlice({
  name: 'doc',
  initialState: getInitialState(),
  reducers: {
    onInitState: (state, { payload }: PayloadAction<{ id: string, isLocalDoc?: boolean }>) => {
      const { id, isLocalDoc } = payload;
      initState(state, id)
      if (isLocalDoc) {
        saveFileToDB({ pages: state.currentState.pages, name: state.currentState.docName, id })
      }
    },
    onLoadDoc: (state, { payload }: PayloadAction<DocDto>) => {
      state.currentState.docName = payload.name;
      const pageId = payload.pages[0].id;
      state.currentState.currentPageId = pageId;
      state.currentState.pages = payload.pages;
      state.history[0] = cloneDeep(state.currentState);
      state.isInited = true;
    },

    // Работа с нодами
    onAddNode: (state, { payload }: PayloadAction<{ type: NodeData; position: XYPosition }>) => {
      const { type, position } = payload;

      const currentPage = getCurrentPage(state)!;
      const newNode = getNewNode({ type, position });
      currentPage.nodes.push(newNode);

      stateToHistory(state); // запоминаем состояние в истории
    },
    onDeleteNode: (state, action: PayloadAction<string>) => {
      const currentPage = getCurrentPage(state)!;
      const id = action.payload;
      const nodeToDelete = currentPage.nodes.find((node) => node.id === id)!;

      currentPage.nodes = currentPage.nodes.filter((node) => node !== nodeToDelete); // удаляем ноду

      const connectedEdges = getConnectedEdges([nodeToDelete], currentPage.edges);
      currentPage.edges = currentPage.edges.filter((edge) => !connectedEdges.includes(edge)); // удаляем связи

      stateToHistory(state); // запоминаем состояние в истории
    },
    onChangeNodes: (state, { ['payload']: { changes } }: PayloadAction<{ changes: NodeChange[] }>) => {
      const currentPage = getCurrentPage(state)!;
      currentPage.nodes = applyNodeChanges(changes, currentPage.nodes);

      changes.forEach((change) => {
        if ('selected' in change) {
          if (change.selected) {
            state.currentState.selectedNodes.push(change.id)
          } else {
            state.currentState.selectedNodes = state.currentState.selectedNodes.filter(nodeId => nodeId !== change.id)
          }
        }
      })
    },
    onChangeNode: (
      state,
      action: PayloadAction<{
        id: string;
        key: keyof CommonNodeDataType;
        value: unknown;
        saveToHistory: boolean;
      }>,
    ) => {
      const currentPage = getCurrentPage(state)!;
      const { id, value, key, saveToHistory } = action.payload;

      if ((key === 'text' || key === 'color') && typeof value === 'string') {
        const currentNode = currentPage.nodes.find((node) => node.id === id)!;
        if (currentNode.data[key] !== value) {
          currentNode.data[key] = value;
        }
        if (saveToHistory) {
          stateToHistory(state); // запоминаем состояние в истории
        }
      }
    },
    onChangeCodeNode: (
      state,
      action: PayloadAction<{
        id: string;
        key: keyof CodeNodeData;
        value: Language;
      }>,
    ) => {
      const currentPage = getCurrentPage(state)!;
      const { id, value, key } = action.payload;

      const currentNode = currentPage.nodes.find((node) => node.id === id)!;
      if ('language' in currentNode?.data) {
        currentNode.data['language'] = value;
      }
      stateToHistory(state); // запоминаем состояние в истории
    },
    onSetNodes: (state, action: PayloadAction<{ nodes: Node[] }>) => {
      const currentPage = getCurrentPage(state)!;
      currentPage.nodes = action.payload.nodes;
    },
    onSelectNode: (state, action: PayloadAction<string>) => {
      state.currentState.selectedNodes = [action.payload];
    },
    onReleaseNode: (state, action: PayloadAction<string>) => {
      state.currentState.selectedNodes = state.currentState.selectedNodes.filter((nodeId) => nodeId !== action.payload);
    },
    onReleaseNodes: (state) => {
      state.currentState.selectedNodes = [];
    },

    // Работа со связями
    onChangeEdges: (state, action: PayloadAction<Edge[]>) => {
      let isCountOfEdgesWereChagned = false;
      const currentPage = getCurrentPage(state);
      if (currentPage && currentPage.edges.length !== action.payload.length) {
        isCountOfEdgesWereChagned = true;
      }
      if (currentPage) currentPage.edges = action.payload;
      if (isCountOfEdgesWereChagned) stateToHistory(state);
    },
    onConnect: (state, action: PayloadAction<Connection>) => {
      const currentPage = getCurrentPage(state)!;
      currentPage.edges = addEdge(action.payload, currentPage.edges);
      stateToHistory(state);
    },

    // Работа со страницами
    onSelectPage: (state, action: PayloadAction<string>) => {
      if (state.currentState.currentPageId !== action.payload) {
        state.currentState.currentPageId = action.payload;
        stateToHistory(state);
      }
    },
    onAddPage: (state) => {
      const currentState = state.currentState;
      const pageId = v1();
      currentState.pages.push({
        id: pageId,
        nodes: [],
        edges: [],
        pageName: 'New page',
      });
      currentState.currentPageId = pageId;
      stateToHistory(state);
    },
    onDeletePage: (state, action: PayloadAction<{ pageId: string }>) => {
      const { pageId } = action.payload;
      const currentState = state.currentState;
      currentState.pages = currentState.pages.filter((page) => page.id !== pageId);
      if (currentState.currentPageId = pageId) {
        currentState.currentPageId = currentState.pages[0].id;
      }
      stateToHistory(state);
    },
    onChangePageName: (state, action: PayloadAction<{ id: string; name: string }>) => {
      const currentState = state.currentState;
      const { id, name } = action.payload;
      currentState.pages = currentState.pages.map((page) => (page.id === id ? { ...page, pageName: name } : page));
      stateToHistory(state);
    },

    onPasteChanges: (state, action: PayloadAction<{ nodes: Node<CommonNodeDataType>[]; edges: Edge[] }>) => {
      const { nodes, edges } = action.payload;
      const currentPage = getCurrentPage(state)!;
      currentPage.nodes.forEach((node) => {
        node.selected = false; // снимаем выделение со всех нод
      })
      currentPage.edges.forEach((edge) => {
        edge.selected = false; // снимаем выделение со всех связей
      })
      currentPage.nodes.push(...nodes);
      currentPage.edges.push(...edges);
      state.currentState.selectedNodes = [...nodes.map(node => node.id)]; // выделяем вставленные ноды
      stateToHistory(state);
    },

    // работа с документом
    onChangeDocName: (state, action: PayloadAction<string>) => {
      state.currentState.docName = action.payload;
      stateToHistory(state);
    },

    // работа с инфраструктурой
    onSave: (state, action: PayloadAction<{ id: string }>) => {
      const { id } = action.payload;
      const currentState = state.currentState;
      currentState.isUpdated = false;
      updateFileInDB({ pages: currentState.pages, name: currentState.docName, id })
    },
    undo: (state) => {
      if (state.step === 0) return; // если шаг 0, то не делаем ничего
      state.step -= 1;
      state.currentState = state.history[state.step];
    },
    redo: (state) => {
      state.step += 1;
      state.currentState = state.history[state.step];
    },
    onStateToHistory: (state) => {
      stateToHistory(state); // запоминаем состояние в истории
    },

    onResetState: (state) => {
      const docState = getDoc()

      state.currentState = docState;
      state.history = [cloneDeep(docState)];
      state.step = 0;
      state.isInited = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadFile.fulfilled, (state, action) => {
        const { pages, docName, id } = action.payload
        initState(state, pages[0].id, docName, pages)
        saveFileToDB({ pages, name: docName, id })
      })
      .addCase(uploadFile.rejected, () => {
      });
  },
});

export const { actions: docActions, reducer: docReducer } = docSlice;
