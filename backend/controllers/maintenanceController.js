const MaintenanceRequest = require('../models/MaintenanceRequest');
const Property = require('../models/Property');
const Booking = require('../models/Booking');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const sendEmail = require('../utils/sendEmail');
const createNotification = require('../utils/createNotification');
const { uploadToCloudinary } = require('../config/cloudinary');
const fs = require('fs');

// @desc    Create maintenance request
// @route   POST /api/maintenance
const createMaintenanceRequest = async (req, res, next) => {
  try {
    const { propertyId, title, description, category, priority } = req.body;

    const property = await Property.findById(propertyId).populate('owner', 'firstName lastName email');
    if (!property) {
      throw ApiError.notFound('Property not found.');
    }

    // Check if user has an active/completed booking for this property
    const booking = await Booking.findOne({
      property: propertyId,
      tenant: req.user._id,
      status: { $in: ['approved', 'completed'] },
    });

    if (!booking) {
      throw ApiError.forbidden('You must have an active booking for this property to raise a maintenance request.');
    }

    // Upload images
    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.path, 'property-management/maintenance');
        images.push(result);
        fs.unlinkSync(file.path);
      }
    }

    const maintenanceRequest = await MaintenanceRequest.create({
      property: propertyId,
      raisedBy: req.user._id,
      owner: property.owner._id,
      title,
      description,
      category,
      priority: priority || 'medium',
      images,
    });

    // Notify owner
    await createNotification({
      user: property.owner._id,
      type: 'maintenance',
      title: 'New Maintenance Request',
      message: `${req.user.firstName} ${req.user.lastName} raised a ${category} issue (${priority || 'medium'} priority) for "${property.title}".`,
      link: `/dashboard/maintenance`,
    });

    // Notify available workers
    const workers = await User.find({ role: 'worker', isActive: true });
    for (const worker of workers) {
      await createNotification({
        user: worker._id,
        type: 'maintenance',
        title: 'New Maintenance Request Available',
        message: `A new ${category} maintenance request has been raised for "${property.title}".`,
        link: `/dashboard/worker`,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Maintenance request submitted successfully.',
      maintenanceRequest,
    });
  } catch (error) {
    if (req.files) {
      for (const file of req.files) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }
    next(error);
  }
};

// @desc    Get my maintenance requests (tenant)
// @route   GET /api/maintenance/my-requests
const getMyRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { raisedBy: req.user._id };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [requests, total] = await Promise.all([
      MaintenanceRequest.find(query)
        .populate('property', 'title slug location')
        .populate('assignedTo', 'firstName lastName phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      MaintenanceRequest.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      requests,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get worker tasks
// @route   GET /api/maintenance/worker-tasks
const getWorkerTasks = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { assignedTo: req.user._id };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [tasks, total] = await Promise.all([
      MaintenanceRequest.find(query)
        .populate('property', 'title slug location')
        .populate('raisedBy', 'firstName lastName phone email')
        .populate('owner', 'firstName lastName phone')
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      MaintenanceRequest.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      tasks,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get owner maintenance requests
// @route   GET /api/maintenance/owner-requests
const getOwnerMaintenanceRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { owner: req.user._id };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [requests, total] = await Promise.all([
      MaintenanceRequest.find(query)
        .populate('property', 'title slug location')
        .populate('raisedBy', 'firstName lastName phone email')
        .populate('assignedTo', 'firstName lastName phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      MaintenanceRequest.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      requests,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign worker to maintenance request
// @route   PATCH /api/maintenance/:id/assign
const assignWorker = async (req, res, next) => {
  try {
    const { workerId } = req.body;

    const request = await MaintenanceRequest.findById(req.params.id)
      .populate('property', 'title');

    if (!request) {
      throw ApiError.notFound('Maintenance request not found.');
    }

    if (request.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw ApiError.forbidden('You can only manage maintenance for your own properties.');
    }

    const worker = await User.findOne({ _id: workerId, role: 'worker', isActive: true });
    if (!worker) {
      throw ApiError.notFound('Worker not found or inactive.');
    }

    request.assignedTo = workerId;
    request.status = 'assigned';
    await request.save();

    await createNotification({
      user: workerId,
      type: 'maintenance',
      title: 'Task Assigned',
      message: `You have been assigned a ${request.category} task for "${request.property.title}".`,
      link: `/dashboard/worker`,
    });

    await sendEmail({
      to: worker.email,
      subject: 'New Task Assigned - Property Manager',
      template: 'maintenanceAssigned',
      data: {
        workerName: worker.firstName,
        propertyTitle: request.property.title,
        title: request.title,
        category: request.category,
        priority: request.priority,
        description: request.description,
        dashboardLink: `${process.env.FRONTEND_URL}/dashboard/worker`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Worker assigned successfully.',
      request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start maintenance (worker)
// @route   PATCH /api/maintenance/:id/start
const startMaintenance = async (req, res, next) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) {
      throw ApiError.notFound('Maintenance request not found.');
    }

    if (!request.assignedTo || request.assignedTo.toString() !== req.user._id.toString()) {
      throw ApiError.forbidden('You are not assigned to this task.');
    }

    if (request.status !== 'assigned') {
      throw ApiError.badRequest('Only assigned tasks can be started.');
    }

    request.status = 'in_progress';
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Maintenance started.',
      request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete maintenance (worker)
// @route   PATCH /api/maintenance/:id/complete
const completeMaintenance = async (req, res, next) => {
  try {
    const { workerNotes } = req.body;

    const request = await MaintenanceRequest.findById(req.params.id)
      .populate('property', 'title')
      .populate('raisedBy', 'firstName lastName email')
      .populate('owner', 'firstName lastName email');

    if (!request) {
      throw ApiError.notFound('Maintenance request not found.');
    }

    if (!request.assignedTo || request.assignedTo.toString() !== req.user._id.toString()) {
      throw ApiError.forbidden('You are not assigned to this task.');
    }

    if (request.status !== 'in_progress') {
      throw ApiError.badRequest('Only in-progress tasks can be completed.');
    }

    request.status = 'completed';
    request.workerNotes = workerNotes || '';
    request.completedAt = new Date();
    await request.save();

    // Notify tenant
    await createNotification({
      user: request.raisedBy._id,
      type: 'maintenance',
      title: 'Maintenance Completed',
      message: `Your maintenance request "${request.title}" has been resolved.`,
      link: `/dashboard/maintenance`,
    });

    await sendEmail({
      to: request.raisedBy.email,
      subject: 'Maintenance Completed - Property Manager',
      template: 'maintenanceCompleted',
      data: {
        tenantName: request.raisedBy.firstName,
        title: request.title,
        workerNotes: request.workerNotes || 'No additional notes.',
        completedAt: new Date().toLocaleDateString(),
      },
    });

    // Notify owner
    await createNotification({
      user: request.owner._id,
      type: 'maintenance',
      title: 'Maintenance Completed',
      message: `Maintenance request "${request.title}" for "${request.property.title}" has been completed.`,
      link: `/dashboard/maintenance`,
    });

    res.status(200).json({
      success: true,
      message: 'Maintenance completed.',
      request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Close maintenance (owner/admin)
// @route   PATCH /api/maintenance/:id/close
const closeMaintenance = async (req, res, next) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) {
      throw ApiError.notFound('Maintenance request not found.');
    }

    if (request.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw ApiError.forbidden('You can only close maintenance for your own properties.');
    }

    request.status = 'closed';
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Maintenance request closed.',
      request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all maintenance requests (admin)
// @route   GET /api/maintenance
const getAllMaintenanceRequests = async (req, res, next) => {
  try {
    const { status, category, priority, page = 1, limit = 10 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    const skip = (Number(page) - 1) * Number(limit);

    const [requests, total] = await Promise.all([
      MaintenanceRequest.find(query)
        .populate('property', 'title slug location')
        .populate('raisedBy', 'firstName lastName phone email')
        .populate('assignedTo', 'firstName lastName phone')
        .populate('owner', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      MaintenanceRequest.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      requests,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMaintenanceRequest,
  getMyRequests,
  getWorkerTasks,
  getOwnerMaintenanceRequests,
  assignWorker,
  startMaintenance,
  completeMaintenance,
  closeMaintenance,
  getAllMaintenanceRequests,
};
