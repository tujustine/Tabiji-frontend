/**
 * Composant liste de tâches avec drag and drop
 * Permet d'ajouter, supprimer, compléter et réorganiser les tâches
 */

"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IoMdAdd, IoMdTrash, IoMdCheckmark } from "react-icons/io";
import { MdDragIndicator } from "react-icons/md";
import type { TodoItem } from "@/types";

interface TodoListProps {
  todos: TodoItem[];
  canEdit?: boolean;
  onAddTodo: (todo: TodoItem) => void;
  onRemoveTodo: (id: string) => void;
  onToggleTodo: (id: string) => void;
  onReorderTodos: (todos: TodoItem[]) => void;
}

// Composant pour un item triable
function SortableTodoItem({
  todo,
  canEdit = true,
  onToggle,
  onRemove,
}: Readonly<{
  todo: TodoItem;
  canEdit?: boolean;
  onToggle: () => void;
  onRemove: () => void;
}>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: todo.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-white p-3 rounded-md border border-gray-200 hover:border-[#7a8450] transition-colors"
    >
      {/* Poignée de drag */}
      {canEdit && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <MdDragIndicator size={20} />
        </button>
      )}

      {/* Checkbox */}
      <button
        type="button"
        onClick={onToggle}
        disabled={!canEdit}
        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          todo.completed
            ? "bg-[#7a8450] border-[#7a8450]"
            : "border-gray-300 hover:border-[#7a8450]"
        } ${canEdit ? "" : "cursor-not-allowed opacity-50"}`}
      >
        {todo.completed && <IoMdCheckmark className="text-white" size={16} />}
      </button>

      {/* Texte */}
      <span
        className={`flex-1 ${
          todo.completed ? "line-through text-gray-400" : "text-gray-800"
        }`}
      >
        {todo.text}
      </span>

      {/* Bouton supprimer */}
      {canEdit && (
        <button
          type="button"
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 transition-colors"
          aria-label="Supprimer"
        >
          <IoMdTrash size={18} />
        </button>
      )}
    </div>
  );
}

export default function TodoList({
  todos,
  canEdit = true,
  onAddTodo,
  onRemoveTodo,
  onToggleTodo,
  onReorderTodos,
}: Readonly<TodoListProps>) {
  const [newTodoText, setNewTodoText] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddTodo = () => {
    if (!newTodoText.trim()) return;

    const newTodo: TodoItem = {
      id: Date.now().toString(),
      text: newTodoText,
      completed: false,
      order: todos.length,
    };

    onAddTodo(newTodo);
    setNewTodoText("");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = todos.findIndex((t) => t.id === active.id);
      const newIndex = todos.findIndex((t) => t.id === over.id);

      const reordered = arrayMove(todos, oldIndex, newIndex).map(
        (todo, index) => ({
          ...todo,
          order: index,
        })
      );

      onReorderTodos(reordered);
    }
  };

  return (
    <div className="space-y-4">
      {/* Formulaire d'ajout - Desktop */}
      {canEdit && (
        <>
          <div className="hidden md:flex gap-2">
            <input
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
              placeholder="Nouvelle tâche..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7a8450]"
            />
            <button
              type="button"
              onClick={handleAddTodo}
              className="bg-[#7a8450] hover:bg-[#6a7445] text-white px-3 py-2 rounded-md flex items-center gap-2 transition-colors flex-shrink-0"
              title="Ajouter une tâche"
            >
              <IoMdAdd size={20} />
            </button>
          </div>

          {/* Formulaire d'ajout - Mobile */}
          <div className="md:hidden flex gap-2">
            <input
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
              placeholder="Nouvelle tâche..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7a8450]"
            />
            <button
              type="button"
              onClick={handleAddTodo}
              className="bg-[#7a8450] hover:bg-[#6a7445] text-white p-2 rounded-md flex items-center justify-center w-12 h-10 transition-colors"
              title="Ajouter la tâche"
            >
              <IoMdAdd size={20} />
            </button>
          </div>
        </>
      )}

      {/* Liste des tâches */}
      {todos.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          Aucune tâche pour le moment
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={todos.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {todos
                .toSorted((a, b) => a.order - b.order)
                .map((todo) => (
                  <SortableTodoItem
                    key={todo.id}
                    todo={todo}
                    canEdit={canEdit}
                    onToggle={() => onToggleTodo(todo.id)}
                    onRemove={() => onRemoveTodo(todo.id)}
                  />
                ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
