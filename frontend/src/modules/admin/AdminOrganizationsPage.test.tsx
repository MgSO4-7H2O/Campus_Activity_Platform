import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getOrganizationTree } from '../../shared/api/organizations'
import { fallbackOrgTree } from '../../shared/mock/data'
import AdminOrganizationsPage from './AdminOrganizationsPage'

vi.mock('../../shared/api/organizations', () => ({
  createOrganization: vi.fn(),
  getOrganizationTree: vi.fn(),
  updateOrganization: vi.fn(),
}))

const mockedGetOrganizationTree = vi.mocked(getOrganizationTree)

describe('AdminOrganizationsPage', () => {
  beforeEach(() => {
    mockedGetOrganizationTree.mockReset()
    mockedGetOrganizationTree.mockResolvedValue(fallbackOrgTree)
  })

  it('renders organization tree from API and opens create modal', async () => {
    const user = userEvent.setup()
    render(<AdminOrganizationsPage />)

    await screen.findByText('校党委宣传部')
    expect(screen.getByText(/人工智能社团/)).toBeInTheDocument()
    expect(screen.getByText(/计算机科学与技术学院/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /新增组织/ }))

    expect(screen.getByRole('dialog', { name: '新增组织' })).toBeInTheDocument()
    expect(screen.getByLabelText('名称')).toBeInTheDocument()
    expect(screen.getByLabelText('类型')).toBeInTheDocument()
    expect(mockedGetOrganizationTree).toHaveBeenCalled()
  })
})
