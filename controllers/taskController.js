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
                priority: value.priority,
                userId: global.user_id,
            },
            select: {
                id: true,
                title: true,
                isCompleted: true,
                priority: true,
                createdAt: true,
            },
        });

        return res.status(201).json({
            id: task.id,
            title: task.title,
            isCompleted: task.isCompleted,
            priority: task.priority,
            createdAt: task.createdAt,
        });
    } catch (err) {
        return next(err);
    }
};

// Bulk create with validation
exports.bulkCreate = async (req, res, next) => {
    const { tasks } = req.body;

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({ 
            error: "Invalid request data. Expected an array of tasks." 
        });
    }

    // Validate all tasks before insertion
    const validTasks = [];
    for (const task of tasks) {
        const { error, value } = taskSchema.validate(task);
        if (error) {
            return res.status(400).json({
                error: "Validation failed",
                details: error.details,
            });
        }
        validTasks.push({
            title: value.title,
            isCompleted: value.isCompleted || false,
            priority: value.priority || 'medium',
            userId: global.user_id
        });
    }

    // Use createMany for batch insertion
    try {
        const result = await prisma.task.createMany({
            data: validTasks,
            skipDuplicates: false
        });

        return res.status(201).json({
            message: "Bulk task creation successful",
            tasksCreated: result.count,
            totalRequested: validTasks.length
        });
    } catch (err) {
        return next(err);
    }
};

exports.index = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, parseInt(req.query.limit) || 10);
        const skip = (page - 1) * limit;

        const whereClause = { userId: global.user_id };
        if (req.query.find) {
            whereClause.title = {
                contains: req.query.find,
                mode: 'insensitive',
            };
        }
     
        const tasks = await prisma.task.findMany({
            where: whereClause,
            select: {
                id: true,
                title: true,
                isCompleted: true,
                priority: true,
                createdAt: true,
                User: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
            skip: skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        });

        const totalTasks = await prisma.task.count({
            where: whereClause,
        });

        if (tasks.length === 0) {
            return res.status(404).json({ message: "No tasks found" });
        }

        const totalPages = Math.ceil(totalTasks / limit);
        const pagination = {
            page: page,
            limit: limit,
            total: totalTasks,
            pages: totalPages,
            hasNext: page * limit < totalTasks,
            hasPrev: page > 1,
        };

        return res.status(200).json({
            tasks,
            pagination,
        });
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
                priority: true,
                createdAt: true,
                User: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
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
                priority: true,
                createdAt: true,
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
                priority: true,
                createdAt: true,
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