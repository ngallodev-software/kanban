import { createUniqueTaskId } from "./task-id";
import { resolveTaskTitle } from "./task-title";
function normalizeTaskAutoReviewMode(value) {
    if (value === "pr" || value === "move_to_trash") {
        return value;
    }
    return "commit";
}
// Copy image metadata so board tasks do not retain caller-owned array or object references.
function cloneTaskImages(images) {
    return images && images.length > 0 ? images.map((image) => ({ ...image })) : undefined;
}
function cloneTaskClineSettings(settings) {
    if (settings === undefined || settings === null) {
        return undefined;
    }
    const providerId = settings.providerId?.trim();
    const modelId = settings.modelId?.trim();
    return {
        ...(providerId ? { providerId } : {}),
        ...(modelId ? { modelId } : {}),
        ...(settings.reasoningEffort ? { reasoningEffort: settings.reasoningEffort } : {}),
    };
}
function collectExistingTaskIds(board) {
    const existingIds = new Set();
    for (const column of board.columns) {
        for (const card of column.cards) {
            existingIds.add(card.id);
        }
    }
    return existingIds;
}
function collectTaskIds(board) {
    const taskIds = new Set();
    for (const column of board.columns) {
        for (const card of column.cards) {
            taskIds.add(card.id);
        }
    }
    return taskIds;
}
function createDependencyId() {
    return crypto.randomUUID().replaceAll("-", "").slice(0, 8);
}
function createDependencyPairKey(backlogTaskId, linkedTaskId) {
    return `${backlogTaskId}::${linkedTaskId}`;
}
function hasDependencyPair(board, backlogTaskId, linkedTaskId) {
    const pairKey = createDependencyPairKey(backlogTaskId, linkedTaskId);
    for (const dependency of board.dependencies) {
        const existing = resolveDependencyEndpoints(board, dependency.fromTaskId, dependency.toTaskId);
        if ("reason" in existing) {
            continue;
        }
        if (createDependencyPairKey(existing.backlogTaskId, existing.linkedTaskId) === pairKey) {
            return true;
        }
    }
    return false;
}
function findTaskLocation(board, taskId) {
    for (const [columnIndex, column] of board.columns.entries()) {
        const taskIndex = column.cards.findIndex((card) => card.id === taskId);
        if (taskIndex === -1) {
            continue;
        }
        const task = column.cards[taskIndex];
        if (!task) {
            continue;
        }
        return {
            columnIndex,
            taskIndex,
            columnId: column.id,
            task,
        };
    }
    return null;
}
function resolveDependencyEndpoints(board, firstTaskId, secondTaskId) {
    const firstColumnId = getTaskColumnId(board, firstTaskId);
    const secondColumnId = getTaskColumnId(board, secondTaskId);
    if (!firstColumnId || !secondColumnId) {
        return { reason: "missing_task" };
    }
    if (firstColumnId === "trash" || secondColumnId === "trash") {
        return { reason: "trash_task" };
    }
    const firstIsBacklog = firstColumnId === "backlog";
    const secondIsBacklog = secondColumnId === "backlog";
    if (firstIsBacklog && secondIsBacklog) {
        return {
            backlogTaskId: firstTaskId,
            linkedTaskId: secondTaskId,
        };
    }
    if (!firstIsBacklog && !secondIsBacklog) {
        return { reason: "non_backlog" };
    }
    return firstIsBacklog
        ? { backlogTaskId: firstTaskId, linkedTaskId: secondTaskId }
        : { backlogTaskId: secondTaskId, linkedTaskId: firstTaskId };
}
function getLinkedBacklogTaskIdsReadyAfterTaskTrashed(board, taskId, fromColumnId) {
    if (!taskId || board.dependencies.length === 0 || fromColumnId !== "review") {
        return [];
    }
    const readyTaskIds = new Set();
    for (const dependency of board.dependencies) {
        if (dependency.toTaskId !== taskId) {
            continue;
        }
        if (getTaskColumnId(board, dependency.fromTaskId) !== "backlog") {
            continue;
        }
        readyTaskIds.add(dependency.fromTaskId);
    }
    return [...readyTaskIds];
}
export function updateTaskDependencies(board) {
    if (board.dependencies.length === 0) {
        return board;
    }
    const taskIds = collectTaskIds(board);
    const dependencies = [];
    const existingPairs = new Set();
    for (const dependency of board.dependencies) {
        const firstTaskId = dependency.fromTaskId.trim();
        const secondTaskId = dependency.toTaskId.trim();
        if (!firstTaskId || !secondTaskId || firstTaskId === secondTaskId) {
            continue;
        }
        if (!taskIds.has(firstTaskId) || !taskIds.has(secondTaskId)) {
            continue;
        }
        const resolved = resolveDependencyEndpoints(board, firstTaskId, secondTaskId);
        if ("reason" in resolved) {
            continue;
        }
        const pairKey = createDependencyPairKey(resolved.backlogTaskId, resolved.linkedTaskId);
        if (existingPairs.has(pairKey)) {
            continue;
        }
        existingPairs.add(pairKey);
        dependencies.push({
            id: dependency.id,
            fromTaskId: resolved.backlogTaskId,
            toTaskId: resolved.linkedTaskId,
            createdAt: dependency.createdAt,
        });
    }
    if (dependencies.length === board.dependencies.length &&
        dependencies.every((dependency, index) => {
            const current = board.dependencies[index];
            return (current &&
                current.id === dependency.id &&
                current.fromTaskId === dependency.fromTaskId &&
                current.toTaskId === dependency.toTaskId &&
                current.createdAt === dependency.createdAt);
        })) {
        return board;
    }
    return {
        ...board,
        dependencies,
    };
}
export function addTaskToColumn(board, columnId, input, randomUuid, now = Date.now()) {
    const prompt = input.prompt.trim();
    if (!prompt) {
        throw new Error("Task prompt is required.");
    }
    const baseRef = input.baseRef.trim();
    if (!baseRef) {
        throw new Error("Task baseRef is required.");
    }
    const existingIds = collectExistingTaskIds(board);
    const explicitTaskId = input.taskId?.trim();
    if (explicitTaskId && existingIds.has(explicitTaskId)) {
        throw new Error(`Task "${explicitTaskId}" already exists.`);
    }
    const task = {
        id: explicitTaskId || createUniqueTaskId(existingIds, randomUuid),
        ...(input.externalTaskKey ? { externalTaskKey: input.externalTaskKey.trim() } : {}),
        title: resolveTaskTitle(input.title, prompt),
        prompt,
        startInPlanMode: Boolean(input.startInPlanMode),
        autoReviewEnabled: Boolean(input.autoReviewEnabled),
        autoReviewMode: normalizeTaskAutoReviewMode(input.autoReviewMode),
        images: cloneTaskImages(input.images),
        ...(input.agentId ? { agentId: input.agentId } : {}),
        ...(input.clineSettings !== undefined ? { clineSettings: cloneTaskClineSettings(input.clineSettings) } : {}),
        baseRef,
        createdAt: now,
        updatedAt: now,
    };
    const targetColumnIndex = board.columns.findIndex((column) => column.id === columnId);
    if (targetColumnIndex === -1) {
        throw new Error(`Column ${columnId} not found.`);
    }
    const columns = board.columns.map((column, index) => {
        if (index !== targetColumnIndex) {
            return column;
        }
        return {
            ...column,
            cards: [task, ...column.cards],
        };
    });
    return {
        board: {
            ...board,
            columns,
        },
        task,
    };
}
export function getTaskColumnId(board, taskId) {
    const normalizedTaskId = taskId.trim();
    if (!normalizedTaskId) {
        return null;
    }
    const found = findTaskLocation(board, normalizedTaskId);
    return found ? found.columnId : null;
}
export function addTaskDependency(board, firstTaskId, secondTaskId) {
    const normalizedFirstTaskId = firstTaskId.trim();
    const normalizedSecondTaskId = secondTaskId.trim();
    if (!normalizedFirstTaskId || !normalizedSecondTaskId) {
        return { board, added: false, reason: "missing_task" };
    }
    if (normalizedFirstTaskId === normalizedSecondTaskId) {
        return { board, added: false, reason: "same_task" };
    }
    const resolved = resolveDependencyEndpoints(board, normalizedFirstTaskId, normalizedSecondTaskId);
    if ("reason" in resolved) {
        return { board, added: false, reason: resolved.reason };
    }
    if (hasDependencyPair(board, resolved.backlogTaskId, resolved.linkedTaskId)) {
        return { board, added: false, reason: "duplicate" };
    }
    const dependency = {
        id: createDependencyId(),
        fromTaskId: resolved.backlogTaskId,
        toTaskId: resolved.linkedTaskId,
        createdAt: Date.now(),
    };
    return {
        board: {
            ...board,
            dependencies: [...board.dependencies, dependency],
        },
        added: true,
        dependency,
    };
}
export function canAddTaskDependency(board, firstTaskId, secondTaskId) {
    const normalizedFirstTaskId = firstTaskId.trim();
    const normalizedSecondTaskId = secondTaskId.trim();
    if (!normalizedFirstTaskId || !normalizedSecondTaskId || normalizedFirstTaskId === normalizedSecondTaskId) {
        return false;
    }
    const resolved = resolveDependencyEndpoints(board, normalizedFirstTaskId, normalizedSecondTaskId);
    if ("reason" in resolved) {
        return false;
    }
    return !hasDependencyPair(board, resolved.backlogTaskId, resolved.linkedTaskId);
}
export function removeTaskDependency(board, dependencyId) {
    const dependencies = board.dependencies.filter((dependency) => dependency.id !== dependencyId);
    if (dependencies.length === board.dependencies.length) {
        return { board, removed: false };
    }
    return {
        board: {
            ...board,
            dependencies,
        },
        removed: true,
    };
}
export function getReadyLinkedTaskIdsForTaskInTrash(board, taskId) {
    return getLinkedBacklogTaskIdsReadyAfterTaskTrashed(board, taskId, getTaskColumnId(board, taskId));
}
export function trashTaskAndGetReadyLinkedTaskIds(board, taskId, now = Date.now()) {
    const fromColumnId = getTaskColumnId(board, taskId);
    const readyTaskIds = getLinkedBacklogTaskIdsReadyAfterTaskTrashed(board, taskId, fromColumnId);
    const movedToTrash = moveTaskToColumn(board, taskId, "trash", now);
    return {
        ...movedToTrash,
        readyTaskIds: movedToTrash.moved ? readyTaskIds : [],
    };
}
export function deleteTasksFromBoard(board, taskIds) {
    const normalizedTaskIds = new Set(Array.from(taskIds, (taskId) => taskId.trim()).filter((taskId) => taskId.length > 0));
    if (normalizedTaskIds.size === 0) {
        return {
            board,
            deleted: false,
            deletedTaskIds: [],
        };
    }
    const deletedTaskIds = [];
    const columns = board.columns.map((column) => {
        const remainingCards = column.cards.filter((card) => {
            if (!normalizedTaskIds.has(card.id)) {
                return true;
            }
            deletedTaskIds.push(card.id);
            return false;
        });
        return remainingCards.length === column.cards.length ? column : { ...column, cards: remainingCards };
    });
    if (deletedTaskIds.length === 0) {
        return {
            board,
            deleted: false,
            deletedTaskIds: [],
        };
    }
    const deletedTaskIdSet = new Set(deletedTaskIds);
    const dependencies = board.dependencies.filter((dependency) => !deletedTaskIdSet.has(dependency.fromTaskId) && !deletedTaskIdSet.has(dependency.toTaskId));
    return {
        board: {
            ...board,
            columns,
            dependencies,
        },
        deleted: true,
        deletedTaskIds,
    };
}
export function moveTaskToColumn(board, taskId, targetColumnId, now = Date.now()) {
    const normalizedTaskId = taskId.trim();
    if (!normalizedTaskId) {
        return {
            moved: false,
            board,
            task: null,
            fromColumnId: null,
        };
    }
    const found = findTaskLocation(board, normalizedTaskId);
    if (!found) {
        return {
            moved: false,
            board,
            task: null,
            fromColumnId: null,
        };
    }
    if (found.columnId === targetColumnId) {
        return {
            moved: false,
            board,
            task: found.task,
            fromColumnId: found.columnId,
        };
    }
    const targetColumnIndex = board.columns.findIndex((column) => column.id === targetColumnId);
    if (targetColumnIndex === -1) {
        return {
            moved: false,
            board,
            task: found.task,
            fromColumnId: found.columnId,
        };
    }
    const sourceColumn = board.columns[found.columnIndex];
    const targetColumn = board.columns[targetColumnIndex];
    if (!sourceColumn || !targetColumn) {
        return {
            moved: false,
            board,
            task: found.task,
            fromColumnId: found.columnId,
        };
    }
    const sourceCards = [...sourceColumn.cards];
    const [task] = sourceCards.splice(found.taskIndex, 1);
    if (!task) {
        return {
            moved: false,
            board,
            task: found.task,
            fromColumnId: found.columnId,
        };
    }
    const movedTask = {
        ...task,
        updatedAt: now,
    };
    const targetCards = targetColumnId === "trash" ? [movedTask, ...targetColumn.cards] : [...targetColumn.cards, movedTask];
    const columns = board.columns.map((column, index) => {
        if (index === found.columnIndex) {
            return {
                ...column,
                cards: sourceCards,
            };
        }
        if (index === targetColumnIndex) {
            return {
                ...column,
                cards: targetCards,
            };
        }
        return column;
    });
    return {
        moved: true,
        board: updateTaskDependencies({
            ...board,
            columns,
        }),
        task: movedTask,
        fromColumnId: found.columnId,
    };
}
export function updateTask(board, taskId, input, now = Date.now()) {
    const normalizedTaskId = taskId.trim();
    if (!normalizedTaskId) {
        return {
            board,
            task: null,
            updated: false,
        };
    }
    const prompt = input.prompt.trim();
    if (!prompt) {
        return {
            board,
            task: null,
            updated: false,
        };
    }
    const baseRef = input.baseRef.trim();
    if (!baseRef) {
        return {
            board,
            task: null,
            updated: false,
        };
    }
    let updatedTask = null;
    const columns = board.columns.map((column) => {
        let columnUpdated = false;
        const cards = column.cards.map((card) => {
            if (card.id !== normalizedTaskId) {
                return card;
            }
            columnUpdated = true;
            updatedTask = {
                ...card,
                title: resolveTaskTitle(input.title, prompt),
                prompt,
                startInPlanMode: Boolean(input.startInPlanMode),
                autoReviewEnabled: Boolean(input.autoReviewEnabled),
                autoReviewMode: normalizeTaskAutoReviewMode(input.autoReviewMode),
                images: input.images === undefined ? card.images : cloneTaskImages(input.images),
                agentId: input.agentId === undefined ? card.agentId : (input.agentId ?? undefined),
                clineSettings: input.clineSettings === undefined
                    ? cloneTaskClineSettings(card.clineSettings)
                    : input.clineSettings === null
                        ? undefined
                        : cloneTaskClineSettings(input.clineSettings),
                baseRef,
                updatedAt: now,
            };
            return updatedTask;
        });
        return columnUpdated ? { ...column, cards } : column;
    });
    if (!updatedTask) {
        return {
            board,
            task: null,
            updated: false,
        };
    }
    return {
        board: {
            ...board,
            columns,
        },
        task: updatedTask,
        updated: true,
    };
}
