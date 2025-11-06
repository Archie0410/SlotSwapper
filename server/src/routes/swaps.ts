import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient, EventStatus, SwapRequestStatus } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get swappable slots from other users
router.get('/swappable-slots', authenticate, async (req: AuthRequest, res) => {
  try {
    const slots = await prisma.event.findMany({
      where: {
        status: EventStatus.SWAPPABLE,
        ownerId: {
          not: req.userId!,
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    res.json(slots);
  } catch (error) {
    console.error('Get swappable slots error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create swap request
router.post(
  '/swap-request',
  authenticate,
  [
    body('mySlotId').isUUID().withMessage('Valid mySlotId (UUID) is required'),
    body('theirSlotId').isUUID().withMessage('Valid theirSlotId (UUID) is required'),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { mySlotId, theirSlotId } = req.body;

      // Prevent user from requesting their own slot
      if (mySlotId === theirSlotId) {
        return res.status(400).json({ error: 'Cannot swap slot with itself' });
      }

      // Use transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        // Verify both slots exist and are SWAPPABLE
        const mySlot = await tx.event.findUnique({
          where: { id: mySlotId },
        });

        const theirSlot = await tx.event.findUnique({
          where: { id: theirSlotId },
        });

        if (!mySlot) {
          throw new Error('My slot not found');
        }

        if (!theirSlot) {
          throw new Error('Their slot not found');
        }

        // Verify mySlot belongs to current user
        if (mySlot.ownerId !== req.userId!) {
          throw new Error('Not authorized to use this slot');
        }

        // Prevent user from requesting their own slot
        if (theirSlot.ownerId === req.userId!) {
          throw new Error('Cannot request swap for your own slot');
        }

        // Verify both slots are SWAPPABLE
        if (mySlot.status !== EventStatus.SWAPPABLE) {
          throw new Error('My slot must be SWAPPABLE');
        }

        if (theirSlot.status !== EventStatus.SWAPPABLE) {
          throw new Error('Their slot must be SWAPPABLE');
        }

        // Check if there's already a pending request between these slots
        const existingRequest = await tx.swapRequest.findFirst({
          where: {
            OR: [
              {
                mySlotId: mySlotId,
                theirSlotId: theirSlotId,
              },
              {
                mySlotId: theirSlotId,
                theirSlotId: mySlotId,
              },
            ],
            status: SwapRequestStatus.PENDING,
          },
        });

        if (existingRequest) {
          throw new Error('A pending swap request already exists for these slots');
        }

        // Create swap request
        const swapRequest = await tx.swapRequest.create({
          data: {
            mySlotId,
            theirSlotId,
            fromUserId: req.userId!,
            toUserId: theirSlot.ownerId,
            status: SwapRequestStatus.PENDING,
          },
        });

        // Update both slots to SWAP_PENDING
        await tx.event.update({
          where: { id: mySlotId },
          data: { status: EventStatus.SWAP_PENDING },
        });

        await tx.event.update({
          where: { id: theirSlotId },
          data: { status: EventStatus.SWAP_PENDING },
        });

        return swapRequest;
      });

      // Fetch the full request with relations
      const fullRequest = await prisma.swapRequest.findUnique({
        where: { id: result.id },
        include: {
          mySlot: true,
          theirSlot: true,
          fromUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          toUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      res.status(201).json(fullRequest);
    } catch (error: any) {
      console.error('Create swap request error:', error);
      
      if (error.message.includes('not found') || error.message.includes('Not authorized') || 
          error.message.includes('must be SWAPPABLE') || error.message.includes('Cannot request') ||
          error.message.includes('already exists')) {
        return res.status(400).json({ error: error.message });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Respond to swap request (accept/reject)
router.post(
  '/swap-response/:requestId',
  authenticate,
  [
    body('accept').isBoolean().withMessage('accept must be a boolean'),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { requestId } = req.params;
      const { accept } = req.body;

      // Use transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        // Find the swap request
        const swapRequest = await tx.swapRequest.findUnique({
          where: { id: requestId },
          include: {
            mySlot: true,
            theirSlot: true,
          },
        });

        if (!swapRequest) {
          throw new Error('Swap request not found');
        }

        // Verify only toUserId can respond
        if (swapRequest.toUserId !== req.userId!) {
          throw new Error('Not authorized to respond to this request');
        }

        // Verify request is still PENDING
        if (swapRequest.status !== SwapRequestStatus.PENDING) {
          throw new Error('Swap request is no longer pending');
        }

        if (accept) {
          // ACCEPT: Swap owners and set both slots to BUSY
          await tx.event.update({
            where: { id: swapRequest.mySlotId },
            data: {
              ownerId: swapRequest.toUserId,
              status: EventStatus.BUSY,
            },
          });

          await tx.event.update({
            where: { id: swapRequest.theirSlotId },
            data: {
              ownerId: swapRequest.fromUserId,
              status: EventStatus.BUSY,
            },
          });

          // Update swap request status
          await tx.swapRequest.update({
            where: { id: requestId },
            data: { status: SwapRequestStatus.ACCEPTED },
          });
        } else {
          // REJECT: Restore both slots to SWAPPABLE
          await tx.event.update({
            where: { id: swapRequest.mySlotId },
            data: { status: EventStatus.SWAPPABLE },
          });

          await tx.event.update({
            where: { id: swapRequest.theirSlotId },
            data: { status: EventStatus.SWAPPABLE },
          });

          // Update swap request status
          await tx.swapRequest.update({
            where: { id: requestId },
            data: { status: SwapRequestStatus.REJECTED },
          });
        }

        return swapRequest;
      });

      // Fetch updated request with relations
      const updatedRequest = await prisma.swapRequest.findUnique({
        where: { id: requestId },
        include: {
          mySlot: true,
          theirSlot: true,
          fromUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          toUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      res.json(updatedRequest);
    } catch (error: any) {
      console.error('Swap response error:', error);
      
      if (error.message.includes('not found') || error.message.includes('Not authorized') ||
          error.message.includes('no longer pending')) {
        return res.status(400).json({ error: error.message });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get swap requests (incoming and outgoing)
router.get('/requests', authenticate, async (req: AuthRequest, res) => {
  try {
    const [incoming, outgoing] = await Promise.all([
      prisma.swapRequest.findMany({
        where: {
          toUserId: req.userId!,
        },
        include: {
          mySlot: true,
          theirSlot: true,
          fromUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          toUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.swapRequest.findMany({
        where: {
          fromUserId: req.userId!,
        },
        include: {
          mySlot: true,
          theirSlot: true,
          fromUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          toUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    res.json({
      incoming,
      outgoing,
    });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

