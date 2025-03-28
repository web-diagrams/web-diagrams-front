import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { Connection, NodeChange, applyNodeChanges, addEdge, getConnectedEdges, Edge, Node, XYPosition } from 'reactflow';
import { CommonNodeDataType, FlowState, DocState } from '../interfaces/docStateInterfaces';
import { uploadFile } from '../services/uploadFile';
import { stateToHistory, getNewNode, getCurrentPage } from '../docUtils';
import { v1 } from 'uuid';
import { NodeData } from '../constants/constants';
import { cloneDeep } from 'lodash';
import { DocDto } from '@/shared/types/doc';
import { initState } from '../lib/initState';
import { saveFileToDB, updateFileInDB } from '@/shared/lib/indexDb';

const getDefaultState = (): FlowState => ({
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
});

const initialState: DocState = {
  history: [getDefaultState()],
  currentState: getDefaultState(),
  step: 0,
  isInited: false,
  docName: 'Untitled',
};

export const docSlice = createSlice({
  name: 'doc',
  initialState,
  reducers: {
    onInitState: (state, { payload }: PayloadAction<{ id: string, isLocalDoc?: boolean }>) => {
      const { id, isLocalDoc } = payload;
      initState(state, id)
      if (isLocalDoc) {
        saveFileToDB({ pages: state.currentState.pages, name: state.docName }, payload.id)
      }
    },
    onLoadDoc: (state, { payload }: PayloadAction<DocDto>) => {
      state.docName = payload.name;
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

      state.currentState.isUpdated = true;
      stateToHistory(state); // запоминаем состояние в истории
    },
    onDeleteNode: (state, action: PayloadAction<string>) => {
      const currentPage = getCurrentPage(state)!;
      const id = action.payload;
      const nodeToDelete = currentPage.nodes.find((node) => node.id === id)!;

      currentPage.nodes = currentPage.nodes.filter((node) => node !== nodeToDelete); // удялем ноуду

      const connectedEdges = getConnectedEdges([nodeToDelete], currentPage.edges);
      currentPage.edges = currentPage.edges.filter((edge) => !connectedEdges.includes(edge)); // удялем связи

      state.currentState.isUpdated = true;
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

      state.currentState.isUpdated = true;
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
          state.currentState.isUpdated = true;
        }
        if (saveToHistory) {
          stateToHistory(state); // запоминаем состояние в истории
        }
      }
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
      state.currentState.isUpdated = true;
      if (isCountOfEdgesWereChagned) stateToHistory(state);
    },
    onConnect: (state, action: PayloadAction<Connection>) => {
      const currentPage = getCurrentPage(state)!;
      currentPage.edges = addEdge(action.payload, currentPage.edges);
      state.currentState.isUpdated = true;
      stateToHistory(state);
    },
    updateNodesAndEdges: (state, action: PayloadAction<{edges: Edge[], nodes: Node<CommonNodeDataType>[]}>) => {
      const currentPage = getCurrentPage(state)!;
      currentPage.nodes = action.payload.nodes;
      currentPage.edges = action.payload.edges;
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
      currentState.isUpdated = true;
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
      currentState.isUpdated = true;
      stateToHistory(state);
    },

    // работа с инфраструктурой
    onSave: (state, action: PayloadAction<{ id: string }>) => {
      state.currentState.isUpdated = false;
      updateFileInDB({ pages: state.currentState.pages, name: state.docName }, action.payload.id)
    },
    undo: (state) => {
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
      state = cloneDeep(initialState);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadFile.fulfilled, (state, action) => {
        const { pages, docName, id } = action.payload
        initState(state, pages[0].id, docName, pages)
        saveFileToDB({ pages, name: docName }, id)
      })
      .addCase(uploadFile.rejected, (state, action) => {
        console.log(action.payload);
      });
  },
});

export const { actions: docActions, reducer: docReducer } = docSlice;
