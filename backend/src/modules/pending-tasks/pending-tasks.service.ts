import type { PendingTaskStatus } from '@prisma/client'

import prisma from '../../shared/prisma/client.js'
import { badRequest, notFound } from '../../shared/errors/app-error.js'

function toDto(task: any) {
  return {
    id: task.id,
    ownerId: task.assigneeId,
    title: task.title,
    description: null,
    status: task.status,
    relatedResourceType: task.relatedResourceType,
    relatedResourceId: task.relatedResourceId,
    link: null,
    createdAt: task.createdAt.toISOString(),
    processedAt: task.processedAt ? task.processedAt.toISOString() : null,
  }
}

export const pendingTasksService = {
  async listMyTasks(userId: string, status?: PendingTaskStatus) {
    const tasks = await prisma.pendingTask.findMany({
      where: {
        assigneeId: userId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })

    return tasks.map(toDto)
  },

  async getTaskById(taskId: string) {
    const task = await prisma.pendingTask.findUnique({ where: { id: taskId } })
    if (!task) throw notFound('待办不存在')
    return toDto(task)
  },

  async markProcessed(taskId: string) {
    const existing = await prisma.pendingTask.findUnique({ where: { id: taskId } })
    if (!existing) throw notFound('待办不存在')
    if (existing.status !== 'PENDING') {
      throw badRequest(`当前待办状态不可处理: ${existing.status}`)
    }

    const task = await prisma.pendingTask.update({
      where: { id: taskId },
      data: { status: 'PROCESSED', processedAt: new Date() },
    })

    return toDto(task)
  },

  async createPendingTask(input: {
    assigneeId: string
    taskType: 'APPLICATION_REVIEW' | 'CLOSURE_REVIEW' | 'SIGNUP_REVIEW' | 'ROLE_APPLICATION_REVIEW'
    relatedResourceType: 'ACTIVITY_APPLICATION' | 'CLOSURE_APPLICATION' | 'RECRUITMENT_SIGNUP' | 'ROLE_APPLICATION'
    relatedResourceId: string
    title: string
    createdBy?: string
  }) {
    return prisma.pendingTask.create({
      data: {
        assigneeId: input.assigneeId,
        taskType: input.taskType,
        relatedResourceType: input.relatedResourceType,
        relatedResourceId: input.relatedResourceId,
        title: input.title,
        createdBy: input.createdBy,
      },
    })
  },

  async markTaskProcessedByResource(input: {
    relatedResourceType: 'ACTIVITY_APPLICATION' | 'CLOSURE_APPLICATION' | 'RECRUITMENT_SIGNUP' | 'ROLE_APPLICATION'
    relatedResourceId: string
  }) {
    await prisma.pendingTask.updateMany({
      where: {
        relatedResourceType: input.relatedResourceType,
        relatedResourceId: input.relatedResourceId,
        status: 'PENDING',
      },
      data: { status: 'PROCESSED', processedAt: new Date() },
    })
  },

  async cancelPendingTasksByResource(input: {
    relatedResourceType: 'ACTIVITY_APPLICATION' | 'CLOSURE_APPLICATION' | 'RECRUITMENT_SIGNUP' | 'ROLE_APPLICATION'
    relatedResourceId: string
  }) {
    await prisma.pendingTask.updateMany({
      where: {
        relatedResourceType: input.relatedResourceType,
        relatedResourceId: input.relatedResourceId,
        status: 'PENDING',
      },
      data: { status: 'CANCELLED', processedAt: new Date() },
    })
  },
}
