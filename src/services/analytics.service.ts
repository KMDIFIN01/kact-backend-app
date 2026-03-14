import prisma from '@config/database';
import crypto from 'crypto';

interface TrackPageVisitData {
  sessionId: string;
  userId?: string;
  page: string;
  referrer?: string;
  userAgent?: string;
  ip?: string;
}

interface TrackActivityData {
  sessionId: string;
  userId?: string;
  action: string;
  details?: string;
  page: string;
}

interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

export class AnalyticsService {
  /**
   * Hash an IP address for privacy — never store raw IPs.
   */
  private hashIp(ip: string): string {
    return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
  }

  async trackPageVisit(data: TrackPageVisitData) {
    return prisma.pageVisit.create({
      data: {
        sessionId: data.sessionId,
        userId: data.userId || null,
        page: data.page,
        referrer: data.referrer || null,
        userAgent: data.userAgent || null,
        ipHash: data.ip ? this.hashIp(data.ip) : null,
      },
    });
  }

  async trackActivity(data: TrackActivityData) {
    return prisma.userActivity.create({
      data: {
        sessionId: data.sessionId,
        userId: data.userId || null,
        action: data.action,
        details: data.details || null,
        page: data.page,
      },
    });
  }

  private buildDateFilter(dateRange?: DateRange) {
    if (!dateRange?.startDate && !dateRange?.endDate) return undefined;
    const filter: { gte?: Date; lte?: Date } = {};
    if (dateRange.startDate) filter.gte = dateRange.startDate;
    if (dateRange.endDate) filter.lte = dateRange.endDate;
    return filter;
  }

  async getSummary(dateRange?: DateRange) {
    const visitDateFilter = this.buildDateFilter(dateRange);
    const activityDateFilter = this.buildDateFilter(dateRange);

    const [
      totalVisits,
      uniqueSessions,
      loggedInVisits,
      anonymousVisits,
      topPages,
      topActions,
    ] = await Promise.all([
      // Total page visits
      prisma.pageVisit.count({
        where: visitDateFilter ? { visitedAt: visitDateFilter } : undefined,
      }),

      // Unique sessions
      prisma.pageVisit.groupBy({
        by: ['sessionId'],
        where: visitDateFilter ? { visitedAt: visitDateFilter } : undefined,
      }).then(groups => groups.length),

      // Logged-in visits (userId is not null)
      prisma.pageVisit.count({
        where: {
          userId: { not: null },
          ...(visitDateFilter ? { visitedAt: visitDateFilter } : {}),
        },
      }),

      // Anonymous visits (userId is null)
      prisma.pageVisit.count({
        where: {
          userId: null,
          ...(visitDateFilter ? { visitedAt: visitDateFilter } : {}),
        },
      }),

      // Top pages
      prisma.pageVisit.groupBy({
        by: ['page'],
        _count: { page: true },
        where: visitDateFilter ? { visitedAt: visitDateFilter } : undefined,
        orderBy: { _count: { page: 'desc' } },
        take: 20,
      }),

      // Top actions
      prisma.userActivity.groupBy({
        by: ['action'],
        _count: { action: true },
        where: activityDateFilter ? { performedAt: activityDateFilter } : undefined,
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      totalVisits,
      uniqueSessions,
      loggedInVisits,
      anonymousVisits,
      topPages: topPages.map(p => ({ page: p.page, count: p._count.page })),
      topActions: topActions.map(a => ({ action: a.action, count: a._count.action })),
    };
  }

  async getUserReport(dateRange?: DateRange) {
    const visitDateFilter = this.buildDateFilter(dateRange);
    const activityDateFilter = this.buildDateFilter(dateRange);

    // Get all logged-in users who have visited
    const userVisits = await prisma.pageVisit.groupBy({
      by: ['userId'],
      _count: { id: true },
      _max: { visitedAt: true },
      where: {
        userId: { not: null },
        ...(visitDateFilter ? { visitedAt: visitDateFilter } : {}),
      },
      orderBy: { _count: { id: 'desc' } },
    });

    // Get user activity counts
    const userActions = await prisma.userActivity.groupBy({
      by: ['userId'],
      _count: { id: true },
      _max: { performedAt: true },
      where: {
        userId: { not: null },
        ...(activityDateFilter ? { performedAt: activityDateFilter } : {}),
      },
    });

    const actionMap = new Map(
      userActions.map(a => [a.userId!, { count: a._count.id, lastActivity: a._max.performedAt }])
    );

    // Fetch user details
    const userIds = userVisits.map(v => v.userId!).filter(Boolean);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, firstName: true, lastName: true, email: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    return userVisits.map(v => {
      const user = userMap.get(v.userId!);
      const actions = actionMap.get(v.userId!);
      return {
        userId: v.userId,
        name: user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Unknown',
        email: user?.email || 'Unknown',
        totalVisits: v._count.id,
        lastVisit: v._max.visitedAt,
        totalActions: actions?.count || 0,
        lastActivity: actions?.lastActivity || null,
      };
    });
  }

  async getVisitorReport(dateRange?: DateRange) {
    const visitDateFilter = this.buildDateFilter(dateRange);
    const activityDateFilter = this.buildDateFilter(dateRange);

    const [sessionData, totalAnonSessions, topPages, commonActions] = await Promise.all([
      // Pages per anonymous session
      prisma.pageVisit.groupBy({
        by: ['sessionId'],
        _count: { id: true },
        where: {
          userId: null,
          ...(visitDateFilter ? { visitedAt: visitDateFilter } : {}),
        },
      }),

      // Total anonymous sessions count
      prisma.pageVisit.groupBy({
        by: ['sessionId'],
        where: {
          userId: null,
          ...(visitDateFilter ? { visitedAt: visitDateFilter } : {}),
        },
      }).then(groups => groups.length),

      // Top pages by anonymous visitors
      prisma.pageVisit.groupBy({
        by: ['page'],
        _count: { page: true },
        where: {
          userId: null,
          ...(visitDateFilter ? { visitedAt: visitDateFilter } : {}),
        },
        orderBy: { _count: { page: 'desc' } },
        take: 20,
      }),

      // Common actions by anonymous users
      prisma.userActivity.groupBy({
        by: ['action'],
        _count: { action: true },
        where: {
          userId: null,
          ...(activityDateFilter ? { performedAt: activityDateFilter } : {}),
        },
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
    ]);

    const totalPages = sessionData.reduce((sum, s) => sum + s._count.id, 0);
    const avgPagesPerSession = totalAnonSessions > 0 ? Math.round((totalPages / totalAnonSessions) * 10) / 10 : 0;

    return {
      totalSessions: totalAnonSessions,
      avgPagesPerSession,
      topPages: topPages.map(p => ({ page: p.page, count: p._count.page })),
      commonActions: commonActions.map(a => ({ action: a.action, count: a._count.action })),
    };
  }
}
