import { create } from 'zustand';
import { taskService } from '../services/api-service';

export const useTaskStore = create((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  loadTasksForDay: async (date) => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await taskService.getTasksForDay(date);
      set({ tasks, isLoading: false });
      return tasks;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load tasks';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  loadAllTasks: async (startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await taskService.getAllTasks(startDate, endDate);
      set({ tasks, isLoading: false });
      return tasks;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load tasks';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  createTask: async (taskData) => {
    set({ isLoading: true, error: null });
    try {
      await taskService.createTask(taskData);
      const tasks = await taskService.getTasksForDay(taskData.task_date);
      set({ tasks, isLoading: false });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create task';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateTask: async (taskId, updates) => {
    set({ isLoading: true, error: null });
    try {
      await taskService.updateTask(taskId, updates);
      const currentTasks = get().tasks;
      const updated = currentTasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      );
      set({ tasks: updated, isLoading: false });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update task';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteTask: async (taskId) => {
    set({ isLoading: true, error: null });
    try {
      await taskService.deleteTask(taskId);
      const currentTasks = get().tasks;
      set({ tasks: currentTasks.filter((t) => t.id !== taskId), isLoading: false });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete task';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  clearDay: async (date) => {
    set({ isLoading: true, error: null });
    try {
      await taskService.clearDay(date);
      set({ tasks: [], isLoading: false });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to clear day';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
