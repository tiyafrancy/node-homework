const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

const taskCounter = (() => {
    let lastTaskNumber = 0;
    return () => {
        lastTaskNumber += 1;
        return lastTaskNumber;
    };
})();

exports.create = async (req, res) => {
    if (!req.body) req.body = {};

    const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: error.message });
    }

    const newTask = {
        id: taskCounter(),
        userId: global.user_id.email,
        ...value,
    };

    global.tasks.push(newTask);

    const { userId, ...sanitizedTask } = newTask;
    return res.status(201).json(sanitizedTask);
};

exports.index = async (req, res) => {
    const userTasks = global.tasks.filter(
        (task) => task.userId === global.user_id.email
    );

    if (userTasks.length === 0) {
        return res.status(404).json({ message: "No tasks found for this user." });
    }

    const sanitizedTasks = userTasks.map(({ userId, ...task }) => task);
    return res.status(200).json(sanitizedTasks);
};

exports.show = async (req, res) => {
    const taskId = parseInt(req.params?.id);
    if (!taskId) {
        return res.status(400).json({ message: "The task ID passed is not valid." });
    }

    const task = global.tasks.find(
        (t) => t.id === taskId && t.userId === global.user_id.email
    );

    if (!task) {
        return res.status(404).json({ message: "Task not found." });
    }

    const { userId, ...sanitizedTask } = task;
    return res.status(200).json(sanitizedTask);
};

exports.update = async (req, res) => {
    const taskId = parseInt(req.params?.id);
    if (!taskId) {
        return res.status(400).json({ message: "The task ID passed is not valid." });
    }

    if (!req.body) req.body = {};
    const { error, value } = patchTaskSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ message: error.message });
    }

    const task = global.tasks.find(
        (t) => t.id === taskId && t.userId === global.user_id.email
    );

    if (!task) {
        return res.status(404).json({ message: "Task not found." });
    }

    Object.assign(task, value);

    const { userId, ...sanitizedTask } = task;
    return res.status(200).json(sanitizedTask);
};

exports.deleteTask = async (req, res) => {
    const taskId = parseInt(req.params?.id);
    if (!taskId) {
        return res.status(400).json({ message: "The task ID passed is not valid." });
    }

    const taskIndex = global.tasks.findIndex(
        (t) => t.id === taskId && t.userId === global.user_id.email
    );

    if (taskIndex === -1) {
        return res.status(404).json({ message: "Task not found." });
    }

    const [deletedTask] = global.tasks.splice(taskIndex, 1);

    const { userId, ...sanitizedTask } = deletedTask;
    return res.status(200).json(sanitizedTask);
};