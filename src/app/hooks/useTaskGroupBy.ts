import { useMemo } from "react";
import { type Task, statusConfig, priorityConfig, projects, epics, teamMembers } from "../components/data";

export type GroupBy = "status" | "priority" | "assignee" | "project" | "epic" | "none";

export interface TaskGroup {
  key: string;
  label: string;
  color: string;
  tasks: Task[];
  icon?: string;
}

export function useTaskGroupBy(
  tasks: Task[],
  groupBy: GroupBy
): TaskGroup[] {
  const groups = useMemo(() => {
    const result: TaskGroup[] = [];

    if (groupBy === "status") {
      // Group by status: todo, in_progress, in_review, done
      Object.entries(statusConfig).forEach(([key, val]) => {
        result.push({
          key,
          label: val.label,
          color: val.color,
          tasks: tasks.filter(t => t.status === key),
        });
      });
    } else if (groupBy === "priority") {
      // Group by priority: urgent, high, normal, low
      Object.entries(priorityConfig).forEach(([key, val]) => {
        result.push({
          key,
          label: val.label,
          color: val.color,
          icon: val.icon,
          tasks: tasks.filter(t => t.priority === key),
        });
      });
    } else if (groupBy === "assignee") {
      // Group by assignee
      const assignedMap = new Map<string, { name: string; color: string; tasks: Task[] }>();

      tasks.forEach(t => {
        const assigneeKey = t.assignee?.id || "unassigned";
        const assigneeName = t.assignee?.name || "Unassigned";
        const assigneeColor = t.assignee?.color || "#9ca3af";

        if (!assignedMap.has(assigneeKey)) {
          assignedMap.set(assigneeKey, { name: assigneeName, color: assigneeColor, tasks: [] });
        }
        assignedMap.get(assigneeKey)!.tasks.push(t);
      });

      assignedMap.forEach((val, key) => {
        result.push({
          key,
          label: val.name,
          color: val.color,
          tasks: val.tasks,
        });
      });
    } else if (groupBy === "project") {
      // Group by project
      const projectMap = new Map<string, { name: string; color: string; tasks: Task[] }>();

      tasks.forEach(t => {
        const proj = projects.find(p => p.id === t.projectId);
        const projectKey = proj?.id || "none";
        const projectName = proj?.name || "No Project";
        const projectColor = proj?.color || "#9ca3af";

        if (!projectMap.has(projectKey)) {
          projectMap.set(projectKey, { name: projectName, color: projectColor, tasks: [] });
        }
        projectMap.get(projectKey)!.tasks.push(t);
      });

      projectMap.forEach((val, key) => {
        result.push({
          key,
          label: val.name,
          color: val.color,
          tasks: val.tasks,
        });
      });
    } else if (groupBy === "epic") {
      // Group by epic
      const epicMap = new Map<string, { name: string; color: string; tasks: Task[] }>();

      // Initialize with all epics
      epics.forEach(e => {
        epicMap.set(e.id, { name: e.title, color: e.color, tasks: [] });
      });

      // Add "unassigned" group for tasks without epic
      epicMap.set("__none__", { name: "Unassigned", color: "#94a3b8", tasks: [] });

      // Distribute tasks
      tasks.forEach(t => {
        const epicKey = t.epicId || "__none__";
        if (epicMap.has(epicKey)) {
          epicMap.get(epicKey)!.tasks.push(t);
        } else {
          // Fallback if epic doesn't exist
          epicMap.get("__none__")!.tasks.push(t);
        }
      });

      // Convert to array, exclude empty epic groups (optional - keep all)
      epicMap.forEach((val, key) => {
        result.push({
          key,
          label: val.name,
          color: val.color,
          tasks: val.tasks,
        });
      });
    } else {
      // groupBy === "none"
      result.push({
        key: "all",
        label: "All Tasks",
        color: "#0891b2",
        tasks,
      });
    }

    return result;
  }, [tasks, groupBy]);

  return groups;
}
