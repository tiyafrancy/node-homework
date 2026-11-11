const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const prisma = require("../db/prisma");

exports.create = async (req, res, next) => {
    if (!req.body) req.body = {};

    const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: error.message });
    }

    try {
        const task = await prisma.task.create({
            data: {
                title: value.title,
                isCompleted: value.isCompleted,
                userId: global.user_id,
            },
            select: {
                id: true,
                title: true,
                isCompleted: true,
            },
        });

        return res.status(201).json({
            id: task.id,
            title: task.title,
            isCompleted: task.isCompleted,
        });
    } catch (err) {
        return next(err);
    }
};

exports.index = async (req, res, next) => {
    try {
        const tasks = await prisma.task.findMany({
            where: {
                userId: global.user_id,
            },
        });

        if (tasks.length === 0) {
            return res.status(404).json({ message: "No tasks found" });
        }

        return res.status(200).json(tasks);
    } catch (err) {
    return next(err);
    }
};

exports.show = async (req, res, next) => {
    const taskId = parseInt(req.params?.id);
    if (!taskId) {
        return res.status(400).json({ message: "The task ID passed is not valid." });
    }

    try {
        const task = await prisma.task.findUnique({
            where: {
                id: taskId,
                userId: global.user_id,
            },
            select: {
                id: true,
                title: true,
                isCompleted: true,
            },
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found." });
        }

        return res.status(200).json(task);
    } catch (err) {
        return next(err);
    }
};

exports.update = async (req, res, next) => {
    const taskId = parseInt(req.params?.id);
    if (!taskId) {
        return res.status(400).json({ message: "The task ID passed is not valid." });
    }

    if (!req.body) req.body = {};
    const { error, value: taskChange } = patchTaskSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: error.message });
    }

    if (Object.keys(taskChange).length === 0) {
        return res.status(400).json({ message: "No update fields provided." });
    }

    try {
        const task = await prisma.task.update({
            data: taskChange,
            where: {
                id: taskId,
                userId: global.user_id,
            },
            select: {
                id: true,
                title: true,
                isCompleted: true,
            },
        });

        return res.status(200).json(task);
    } catch (err) {
        if (err.code === "P2025") {
            return res.status(404).json({ message: "Task not found." });
        }
        return next(err);
    }
};

exports.deleteTask = async (req, res, next) => {
    const taskId = parseInt(req.params?.id);
    if (!taskId) {
        return res.status(400).json({ message: "The task ID passed is not valid." });
    }

    try {
        const task = await prisma.task.delete({
            where: {
                id: taskId,
                userId: global.user_id,
            },
            select: {
                id: true,
                title: true,
                isCompleted: true,
            },
        });

        return res.status(200).json(task);
    } catch (err) {
        if (err.code === "P2025") {
            return res.status(404).json({ message: "Task not found." });
        }
        return next(err);
    }
};