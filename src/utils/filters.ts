import type { FiltersState, Task } from '../types';

export function applyTaskFilters(tasks: Task[], filters: FiltersState) {
  return tasks.filter((task) => {
    if (filters.query) {
      const haystack = `${task.title} ${task.description ?? ''}`.toLowerCase();
      if (!haystack.includes(filters.query.toLowerCase())) {
        return false;
      }
    }
    if (filters.priority !== 'all' && task.priority !== filters.priority) {
      return false;
    }
    if (filters.status === 'active' && task.done) {
      return false;
    }
    if (filters.status === 'done' && !task.done) {
      return false;
    }
    return true;
  });
}
