import prisma from '../../shared/prisma/client.js'

export const approvalService = {
  async getPendingTasks(assigneeId: string, status?: any, taskType?: any) {
    const where: any = { assigneeId }
    if (status) where.status = status
    if (taskType) where.taskType = taskType
    
    return await prisma.pendingTask.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })
  }
}
