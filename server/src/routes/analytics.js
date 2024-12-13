import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// website route
router.post('/websites', authenticateToken, async (req, res) => {
  try {
    const { domain } = req.body;
    const userId = req.user.id;

    const website = await prisma.website.create({
      data: {
        domain,
        userId,
      },
    });

    res.json({ website });
  } catch (error) {
    console.error('Error adding website:', error);
    res.status(400).json({ error: error.message });
  }
});

// dashboard route with analytics
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    // Get all websites for the user with their pageviews
    const websites = await prisma.website.findMany({
      where: { userId: req.user.id },
      include: {
        pageViews: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    const processedWebsites = websites.map(website => ({
      id: website.id,
      domain: website.domain,
      totalPageViews: website.pageViews.length,
      uniqueVisitors: new Set(website.pageViews.map(pv => pv.visitorId)).size,
      pageViews: website.pageViews,
      recentPageViews: website.pageViews.slice(0, 5),
      popularPages: Object.entries(
        website.pageViews.reduce((acc, pv) => {
          acc[pv.path] = (acc[pv.path] || 0) + 1;
          return acc;
        }, {})
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([path, count]) => ({ path, count }))
    }));

    res.json({ websites: processedWebsites });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(400).json({ error: error.message });
  }
});

router.post('/:websiteId/pageview', async (req, res) => {
  try {
    const { websiteId } = req.params;
    const { visitorId, path, referrer, userAgent } = req.body;

    console.log('Received pageview:', { websiteId, path, referrer, userAgent });

    const existingView = await prisma.pageView.findFirst({
      where: {
        websiteId,
        visitorId,
        path,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    if (!existingView) {
      const pageView = await prisma.pageView.create({
        data: {
          websiteId,
          visitorId,
          path,
          referrer,
          userAgent
        }
      });
      res.json({ success: true, pageView });
    } else {
      res.json({ success: true, message: 'View already recorded' });
    }
  } catch (error) {
    console.error('Error tracking pageview:', error);
    res.status(500).json({ error: 'Failed to track pageview' });
  }
});

// website deletion route
router.delete('/websites/:websiteId', authenticateToken, async (req, res) => {
  try {
    const { websiteId } = req.params;

    const website = await prisma.website.findFirst({
      where: {
        id: websiteId,
        userId: req.user.id
      }
    });

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    await prisma.pageView.deleteMany({
      where: { websiteId }
    });

    // delete the website
    await prisma.website.delete({
      where: { id: websiteId }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting website:', error);
    res.status(500).json({ error: 'Failed to delete website' });
  }
});

export default router;