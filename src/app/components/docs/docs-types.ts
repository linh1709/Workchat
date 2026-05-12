export interface DocFolder {
  id: string;
  name: string;
  color: string;
  parentId: string | null;
}

export interface Doc {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  category: string;
  author: string;
  authorColor: string;
  authorInitial: string;
  created: string;
  updated: string;
  updatedTimestamp: number;
  pages: number;
  shared: number;
  sharedWith: { name: string; initials: string; color: string; role: string }[];
  tags: string[];
  starred: boolean;
  locked: boolean;
  color: string;
  bg: string;
  icon: string;
  versions: { id: number; date: string; author: string; summary: string }[];
  comments: { id: number; author: string; initials: string; color: string; text: string; time: string }[];
  collaborators: { name: string; initials: string; color: string; online: boolean; cursor?: string }[];
  archived: boolean;
  deleted: boolean;
}

export type ViewMode = "grid" | "list";
export type SortBy = "updated" | "title" | "created" | "author";
export type SidebarSection = "all" | "recent" | "shared" | "starred" | "archived" | "trash";
export type EditorMode = "edit" | "preview" | "split";
