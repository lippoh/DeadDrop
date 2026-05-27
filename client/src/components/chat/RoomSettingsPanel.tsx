"use client";

import { useState } from "react";
import { Settings, Trash2, UserMinus, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Room {
  id: string;
  name: string;
  creatorId: string;
}

interface Member {
  id: string;
  username: string;
}

interface RoomSettingsPanelProps {
  room: Room;
  members: Member[];
  currentUserId: string;
  isCreator: boolean;
  onRename: (newName: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onKick: (userId: string) => Promise<void>;
  onClose: () => void;
}

export function RoomSettingsPanel({
  room,
  members,
  currentUserId,
  isCreator,
  onRename,
  onDelete,
  onKick,
  onClose,
}: RoomSettingsPanelProps) {
  const [newName, setNewName] = useState(room.name);
  const [isRenaming, setIsRenaming] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleRename = async () => {
    if (!newName.trim() || newName === room.name) return;
    await onRename(newName.trim());
    setIsRenaming(false);
  };

  return (
    <div className="w-80 rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Settings className="h-5 w-5" />
          Room Settings
        </h3>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
          aria-label="Close settings"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 p-4">
        {/* Room Name */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">
            Room Name
          </label>
          {isRenaming ? (
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
                maxLength={50}
                placeholder="Enter new room name"
                className="h-8 flex-1 rounded-md border border-gray-300 bg-white px-2 text-sm dark:border-gray-600 dark:bg-gray-700"
              />
              <Button size="sm" onClick={handleRename}>Save</Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setIsRenaming(false); setNewName(room.name); }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{room.name}</span>
              <button
                onClick={() => setIsRenaming(true)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                aria-label="Edit room name"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Members List */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-500 dark:text-gray-400">
            Members ({members.length})
          </label>
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                    {member.username[0].toUpperCase()}
                  </div>
                  <span>{member.username}</span>
                  {member.id === room.creatorId && (
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                      Creator
                    </span>
                  )}
                </div>
                {isCreator && member.id !== currentUserId && (
                  <button
                    onClick={() => onKick(member.id)}
                    title={`Kick ${member.username}`}
                    aria-label={`Kick ${member.username}`}
                    className="rounded-md p-1 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Delete Room */}
        {isCreator && (
          <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
            {showDeleteConfirm ? (
              <div className="space-y-2">
                <p className="text-xs text-red-500">
                  This will permanently delete the room and all messages. This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onDelete}
                    className="gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Confirm Delete
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex w-full items-center justify-start gap-2 rounded-md px-2 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
                Delete Room
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}