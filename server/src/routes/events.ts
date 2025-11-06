import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient, EventStatus } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get current user's events
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const events = await prisma.event.findMany({
      where: {
        ownerId: req.userId!,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create event
router.post(
  '/',
  authenticate,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('startTime').isISO8601().withMessage('Valid startTime is required'),
    body('endTime').isISO8601().withMessage('Valid endTime is required'),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, startTime, endTime, status } = req.body;

      const start = new Date(startTime);
      const end = new Date(endTime);

      if (end <= start) {
        return res.status(400).json({ error: 'endTime must be after startTime' });
      }

      const event = await prisma.event.create({
        data: {
          title,
          startTime: start,
          endTime: end,
          status: status || EventStatus.BUSY,
          ownerId: req.userId!,
        },
      });

      res.status(201).json(event);
    } catch (error) {
      console.error('Create event error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update event
router.put(
  '/:id',
  authenticate,
  [
    body('title').optional().trim().notEmpty(),
    body('startTime').optional().isISO8601(),
    body('endTime').optional().isISO8601(),
    body('status').optional().isIn(['BUSY', 'SWAPPABLE', 'SWAP_PENDING']),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { title, startTime, endTime, status } = req.body;

      // Check if event exists and belongs to user
      const existingEvent = await prisma.event.findUnique({
        where: { id },
      });

      if (!existingEvent) {
        return res.status(404).json({ error: 'Event not found' });
      }

      if (existingEvent.ownerId !== req.userId) {
        return res.status(403).json({ error: 'Not authorized to update this event' });
      }

      // If status is being changed to SWAPPABLE, ensure it's not SWAP_PENDING
      if (status === EventStatus.SWAPPABLE && existingEvent.status === EventStatus.SWAP_PENDING) {
        // Check if there's a pending swap request
        const pendingRequest = await prisma.swapRequest.findFirst({
          where: {
            OR: [
              { mySlotId: id },
              { theirSlotId: id },
            ],
            status: 'PENDING',
          },
        });

        if (pendingRequest) {
          return res.status(409).json({ error: 'Cannot change status while swap request is pending' });
        }
      }

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (startTime !== undefined) updateData.startTime = new Date(startTime);
      if (endTime !== undefined) updateData.endTime = new Date(endTime);
      if (status !== undefined) updateData.status = status;

      const event = await prisma.event.update({
        where: { id },
        data: updateData,
      });

      res.json(event);
    } catch (error) {
      console.error('Update event error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete event
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if event exists and belongs to user
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (existingEvent.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this event' });
    }

    await prisma.event.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

