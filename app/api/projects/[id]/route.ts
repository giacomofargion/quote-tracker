import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'
import { projectRowToProject } from '@/lib/db/utils'
import type { ProjectRow } from '@/lib/types'

// GET /api/projects/[id] - Get a single project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id } = await params
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [project] = await sql<ProjectRow[]>`
      SELECT * FROM projects 
      WHERE id = ${id} AND user_id = ${userId}
    `

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Fetch sessions
    const sessions = await sql`
      SELECT * FROM time_sessions 
      WHERE project_id = ${id}
      ORDER BY start_time DESC
    `

    return NextResponse.json(projectRowToProject(project, sessions.map(s => ({
      id: s.id,
      projectId: s.project_id,
      startTime: s.start_time,
      endTime: s.end_time,
      duration: s.duration,
      isManual: s.is_manual,
      note: s.note || undefined,
    }))))
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[id] - Update a project
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id } = await params
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const updates: Partial<{
      name: string
      client: string
      quote_amount: number
      desired_hourly_rate: number
      target_hours: number
      status: 'active' | 'completed'
    }> = {}

    if (body.name !== undefined) updates.name = body.name
    if (body.client !== undefined) updates.client = body.client
    if (body.quoteAmount !== undefined) updates.quote_amount = body.quoteAmount
    if (body.desiredHourlyRate !== undefined) updates.desired_hourly_rate = body.desiredHourlyRate
    if (body.status !== undefined) updates.status = body.status

    // Recalculate target_hours if quote or rate changed
    if (body.quoteAmount !== undefined || body.desiredHourlyRate !== undefined) {
      const currentProject = await sql<ProjectRow[]>`
        SELECT * FROM projects WHERE id = ${id} AND user_id = ${userId}
      `
      if (currentProject.length > 0) {
        const quote = body.quoteAmount ?? currentProject[0].quote_amount
        const rate = body.desiredHourlyRate ?? currentProject[0].desired_hourly_rate
        updates.target_hours = Number(quote) / Number(rate)
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    // Neon `sql` is a query function, not a query-builder (no `sql.join`).
    // For dynamic UPDATEs we use `sql.query()` with `$1`, `$2`, ... placeholders.
    const setClauses: string[] = []
    const queryParams: unknown[] = []
    let paramIndex = 1

    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`)
      queryParams.push(updates.name)
    }
    if (updates.client !== undefined) {
      setClauses.push(`client = $${paramIndex++}`)
      queryParams.push(updates.client)
    }
    if (updates.quote_amount !== undefined) {
      setClauses.push(`quote_amount = $${paramIndex++}`)
      queryParams.push(updates.quote_amount)
    }
    if (updates.desired_hourly_rate !== undefined) {
      setClauses.push(`desired_hourly_rate = $${paramIndex++}`)
      queryParams.push(updates.desired_hourly_rate)
    }
    if (updates.target_hours !== undefined) {
      setClauses.push(`target_hours = $${paramIndex++}`)
      queryParams.push(updates.target_hours)
    }
    if (updates.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`)
      queryParams.push(updates.status)
    }

    // WHERE params
    const idParam = paramIndex++
    const userIdParam = paramIndex++
    queryParams.push(id, userId)

    const query = `
      UPDATE projects
      SET ${setClauses.join(', ')}
      WHERE id = $${idParam} AND user_id = $${userIdParam}
      RETURNING *
    `

    const rows = await sql.query(query, queryParams)
    const project = (rows as ProjectRow[])[0]

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json(projectRowToProject(project))
  } catch (error) {
    console.error('Error updating project:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update project'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id } = await params
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await sql`
      DELETE FROM projects 
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
