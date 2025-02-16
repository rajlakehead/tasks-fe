import React, { createContext, useContext, useReducer, useEffect } from "react";
import axios from "axios";
import TaskList from "./domain/TaskList";
import Task from "./domain/Task";

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

interface AppState {
  taskLists: TaskList[];
  tasks: { [taskListId: string]: Task[] };
}

// Action types
const FETCH_TASKLISTS = "FETCH_TASKLISTS";
const GET_TASKLIST = "GET_TASKLIST";
const CREATE_TASKLIST = "CREATE_TASKLIST";
const UPDATE_TASKLIST = "UPDATE_TASKLIST";
const DELETE_TASKLIST = "DELETE_TASKLIST";
const FETCH_TASKS = "FETCH_TASKS";
const CREATE_TASK = "CREATE_TASK";
const GET_TASK = "GET_TASK";
const UPDATE_TASK = "UPDATE_TASK";
const DELETE_TASK = "DELETE_TASK";

type Action =
  | { type: typeof FETCH_TASKLISTS; payload: TaskList[] }
  | { type: typeof GET_TASKLIST; payload: TaskList }
  | { type: typeof CREATE_TASKLIST; payload: TaskList }
  | { type: typeof UPDATE_TASKLIST; payload: TaskList }
  | { type: typeof DELETE_TASKLIST; payload: string }
  | { type: typeof FETCH_TASKS; payload: { taskListId: string; tasks: Task[] } }
  | { type: typeof CREATE_TASK; payload: { taskListId: string; task: Task } }
  | { type: typeof GET_TASK; payload: { taskListId: string; task: Task } }
  | { type: typeof UPDATE_TASK; payload: { taskListId: string; taskId: string; task: Task } }
  | { type: typeof DELETE_TASK; payload: { taskListId: string; taskId: string } };

// Reducer
const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case FETCH_TASKLISTS:
      return { ...state, taskLists: action.payload };
    case GET_TASKLIST:
      return {
        ...state,
        taskLists: state.taskLists.some((tl) => tl.id === action.payload.id)
          ? state.taskLists.map((tl) => (tl.id === action.payload.id ? action.payload : tl))
          : [...state.taskLists, action.payload],
      };
    case CREATE_TASKLIST:
      return { ...state, taskLists: [...state.taskLists, action.payload] };
    case UPDATE_TASKLIST:
      return {
        ...state,
        taskLists: state.taskLists.map((tl) => (tl.id === action.payload.id ? action.payload : tl)),
      };
    case DELETE_TASKLIST:
      return { ...state, taskLists: state.taskLists.filter((tl) => tl.id !== action.payload) };
    case FETCH_TASKS:
      return { ...state, tasks: { ...state.tasks, [action.payload.taskListId]: action.payload.tasks } };
    case CREATE_TASK:
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [action.payload.taskListId]: [...(state.tasks[action.payload.taskListId] || []), action.payload.task],
        },
      };
    case GET_TASK:
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [action.payload.taskListId]: state.tasks[action.payload.taskListId]?.map((task) =>
            task.id === action.payload.task.id ? action.payload.task : task
          ) || [action.payload.task],
        },
      };
    case UPDATE_TASK:
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [action.payload.taskListId]: state.tasks[action.payload.taskListId]?.map((task) =>
            task.id === action.payload.taskId ? action.payload.task : task
          ),
        },
      };
    case DELETE_TASK:
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [action.payload.taskListId]: state.tasks[action.payload.taskListId]?.filter((task) => task.id !== action.payload.taskId),
        },
      };
    default:
      return state;
  }
};

// Initial state
const initialState: AppState = {
  taskLists: [],
  tasks: {},
};

// Context
interface AppContextType {
  state: AppState;
  api: {
    fetchTaskLists: () => Promise<void>;
    getTaskList: (id: string) => Promise<void>;
    createTaskList: (taskList: Omit<TaskList, "id">) => Promise<void>;
    updateTaskList: (id: string, taskList: TaskList) => Promise<void>;
    deleteTaskList: (id: string) => Promise<void>;
    fetchTasks: (taskListId: string) => Promise<void>;
    createTask: (taskListId: string, task: Omit<Task, "id">) => Promise<void>;
    updateTask: (taskListId: string, taskId: string, task: Task) => Promise<void>;
    deleteTask: (taskListId: string, taskId: string) => Promise<void>;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const jsonHeaders = { headers: { "Content-Type": "application/json" } };

  // API methods
  const api: AppContextType["api"] = {
    fetchTaskLists: async () => {
      const { data } = await axios.get(`${API_BASE_URL}/task-lists`, jsonHeaders);
      dispatch({ type: FETCH_TASKLISTS, payload: data });
    },
    getTaskList: async (id) => {
      const { data } = await axios.get(`${API_BASE_URL}/task-lists/${id}`, jsonHeaders);
      dispatch({ type: GET_TASKLIST, payload: data });
    },
    createTaskList: async (taskList) => {
      const { data } = await axios.post(`${API_BASE_URL}/task-lists`, taskList, jsonHeaders);
      dispatch({ type: CREATE_TASKLIST, payload: data });
    },
    updateTaskList: async (id, taskList) => {
      const { data } = await axios.put(`${API_BASE_URL}/task-lists/${id}`, taskList, jsonHeaders);
      dispatch({ type: UPDATE_TASKLIST, payload: data });
    },
    deleteTaskList: async (id) => {
      await axios.delete(`${API_BASE_URL}/task-lists/${id}`, jsonHeaders);
      dispatch({ type: DELETE_TASKLIST, payload: id });
    },
    fetchTasks: async (taskListId) => {
      const { data } = await axios.get(`${API_BASE_URL}/task-lists/${taskListId}/tasks`, jsonHeaders);
      dispatch({ type: FETCH_TASKS, payload: { taskListId, tasks: data } });
    },
  };

  useEffect(() => {
    api.fetchTaskLists();
  }, []);

  return <AppContext.Provider value={{ state, api }}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within an AppProvider");
  return context;
};

