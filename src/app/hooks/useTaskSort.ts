import { useState, useMemo } from "react";
import { type Task } from "../components/data";

interface UseTaskSortOptions {
  cycleMode?: "2state" | "3state";
}

type SortField = "none" | "title" | "status" | "priority" | "dueDate" | "assignee" | "created";

export function useTaskSort(
  tasks: Task[],
  options: UseTaskSortOptions = {}
) {
  const [sortField, setSortField] = useState<SortField>("none");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const { cycleMode = "3state" } = options;

  const sortedTasks = useMemo(() => {
    if (sortField === "none") {
      return tasks;
    }

    return [...tasks].sort((a, b) => {
      let cmp = 0;

      switch (sortField) {
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "priority": {
          const order: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
          cmp = order[a.priority] - order[b.priority];
          break;
        }
        case "dueDate":
          cmp = (a.dueDate || "z").localeCompare(b.dueDate || "z");
          break;
        case "assignee":
          cmp = (a.assignee?.name || "zzz").localeCompare(
            b.assignee?.name || "zzz"
          );
          break;
        case "created":
          cmp = a.createdAt.localeCompare(b.createdAt);
          break;
        default:
          cmp = 0;
      }

      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [tasks, sortField, sortDir]);

  const toggleSort = (field: string) => {
    const newField = field as SortField;

    if (cycleMode === "3state") {
      // 3-state cycle: none → asc → desc → none
      if (sortField === newField) {
        if (sortDir === "asc") {
          setSortDir("desc");
        } else {
          setSortField("none");
          setSortDir("asc");
        }
      } else {
        setSortField(newField);
        setSortDir("asc");
      }
    } else {
      // 2-state cycle: asc ↔ desc
      if (sortField === newField) {
        setSortDir(sortDir === "asc" ? "desc" : "asc");
      } else {
        setSortField(newField);
        setSortDir("asc");
      }
    }
  };

  const setSortDirect = (field: string, dir: "asc" | "desc") => {
    setSortField(field as SortField);
    setSortDir(dir);
  };

  return {
    sortedTasks,
    sortField,
    sortDir,
    toggleSort,
    setSortDirect,
  };
}
