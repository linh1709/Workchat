import { useState, useMemo } from "react";
import { type Task } from "../components/data";

interface UseTaskFilterOptions {
  searchInTags?: boolean;
  includeStatus?: boolean;
}

export function useTaskFilter(
  tasks: Task[],
  selectedProject: string | null,
  options: UseTaskFilterOptions = {}
) {
  const [searchQ, setSearchQ] = useState("");
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const { searchInTags = false, includeStatus = false } = options;

  const filteredTasks = useMemo(() => {
    let result = selectedProject
      ? tasks.filter(t => t.projectId === selectedProject)
      : tasks;

    // Search filter
    if (searchQ) {
      if (searchInTags) {
        // ListView: search title + tags
        result = result.filter(
          t =>
            t.title.toLowerCase().includes(searchQ.toLowerCase()) ||
            t.tags.some(tag => tag.toLowerCase().includes(searchQ.toLowerCase()))
        );
      } else {
        // Board, Table: search title only
        result = result.filter(t =>
          t.title.toLowerCase().includes(searchQ.toLowerCase())
        );
      }
    }

    // Priority filter
    if (filterPriority) {
      result = result.filter(t => t.priority === filterPriority);
    }

    // Assignee filter
    if (filterAssignee) {
      result = result.filter(t => t.assignee?.id === filterAssignee);
    }

    // Status filter (only if includeStatus option is true)
    if (includeStatus && filterStatus) {
      result = result.filter(t => t.status === filterStatus);
    }

    return result;
  }, [tasks, selectedProject, searchQ, filterPriority, filterAssignee, filterStatus, searchInTags, includeStatus]);

  const hasFilters =
    !!filterPriority || !!filterAssignee || !!searchQ || (includeStatus && !!filterStatus);

  const clearFilters = () => {
    setSearchQ("");
    setFilterPriority(null);
    setFilterAssignee(null);
    setFilterStatus(null);
  };

  return {
    filteredTasks,
    searchQ,
    setSearchQ,
    filterPriority,
    setFilterPriority,
    filterAssignee,
    setFilterAssignee,
    filterStatus,
    setFilterStatus,
    hasFilters,
    clearFilters,
  };
}
