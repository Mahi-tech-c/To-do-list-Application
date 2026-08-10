const Task = require('../models/Task');

let memoryTasks = [
  {
    id: 'task-001',
    title: 'Plan project sprint',
    description: 'Create a detailed sprint plan for the next iteration.',
    status: 'pending',
    user: 'demo-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'task-002',
    title: 'Design dashboard layout',
    description: 'Create the layout for the project management dashboard.',
    status: 'in-progress',
    user: 'demo-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'task-003',
    title: 'Validate API responses',
    description: 'Verify success and error payloads for all endpoints.',
    status: 'completed',
    user: 'demo-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const getTasks = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const status = req.query.status;
    const sortBy = req.query.sortBy || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;

    let tasks;

    if (process.env.MONGO_URI) {
      const query = { user: req.user._id };

      if (status && status !== 'all') {
        query.status = status;
      }

      const total = await Task.countDocuments(query);

      const data = await Task.find(query)
        .sort({ [sortBy]: order })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      return res.status(200).json({
        success: true,
        data,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          totalItems: total
        }
      });
    }

    tasks = memoryTasks.filter((task) => task.user === req.user._id || task.user === 'demo-user');

    if (status && status !== 'all') {
      tasks = tasks.filter((task) => task.status === status);
    }

    tasks.sort((a, b) => {
      const first = new Date(a[sortBy] || a.createdAt).getTime();
      const second = new Date(b[sortBy] || b.createdAt).getTime();
      return (first - second) * order;
    });

    const startIndex = (page - 1) * limit;
    const paginatedTasks = tasks.slice(startIndex, startIndex + limit);

    res.status(200).json({
      success: true,
      data: paginatedTasks,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(tasks.length / limit),
        totalItems: tasks.length
      }
    });
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const { title, description, status } = req.body;

    if (process.env.MONGO_URI) {
      const task = await Task.create({
        title,
        description,
        status,
        user: req.user._id
      });

      return res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: task
      });
    }

    const newTask = {
      id: `task-${Date.now()}`,
      title,
      description: description || '',
      status: status || 'pending',
      user: req.user._id || 'demo-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    memoryTasks.push(newTask);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: newTask
    });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { title, description, status } = req.body;

    if (process.env.MONGO_URI) {
      const updatedTask = await Task.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        { title, description, status },
        { new: true, runValidators: true }
      );

      if (!updatedTask) {
        return res.status(404).json({
          success: false,
          message: 'Task not found or not authorized.'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        data: updatedTask
      });
    }

    const index = memoryTasks.findIndex((task) => task.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or not authorized.'
      });
    }

    memoryTasks[index] = {
      ...memoryTasks[index],
      title: title || memoryTasks[index].title,
      description: description ?? memoryTasks[index].description,
      status: status || memoryTasks[index].status,
      updatedAt: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: memoryTasks[index]
    });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    if (process.env.MONGO_URI) {
      const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found or not authorized.'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Task deleted successfully'
      });
    }

    const index = memoryTasks.findIndex((task) => task.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or not authorized.'
      });
    }

    const [deletedTask] = memoryTasks.splice(index, 1);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: deletedTask
    });
  } catch (error) {
    next(error);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    if (process.env.MONGO_URI) {
      const task = await Task.findOne({ _id: req.params.id, user: req.user._id }).lean();

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found.'
        });
      }

      return res.status(200).json({
        success: true,
        data: task
      });
    }

    const task = memoryTasks.find((item) => item.id === req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask, getTaskById };
