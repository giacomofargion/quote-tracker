import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'
import { timeSessionRowToTimeSession } from '@/lib/db/utils'
import type { TimeSessionRow, ProjectRow } from '@/lib/types'

async function getOwnedSession(sessionId: string, userId: string) {
  const [session] = await sql`
    SELECT * FROM time_sessions WHERE id = ${sessionId}
  `

  if (!session) {
    return { error: NextResponse.json({ error: 'Session not found' }, { status: 404 }) }
  }

  const sessionRow = session as TimeSessionRow

  const [project] = await sql`
    SELECT id, total_tracked_time FROM projects
    WHERE id = ${sessionRow.project_id} AND user_id = ${userId}
  `

  if (!project) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 403 }) }
  }

  return { session: sessionRow, project: project as Pick<ProjectRow, 'id' | 'total_tracked_time'> }
}

// PATCH /api/sessions/[id] - Update a time session's duration, date, or notes
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

    const owned = await getOwnedSession(id, userId)
    if ('error' in owned) return owned.error

    const { session, project } = owned
    const body = await request.json() as {
      duration?: number
      startTime?: string
      note?: string | null
    }

    const nextDuration = body.duration !== undefined ? Number(body.duration) : session.duration
    if (!Number.isFinite(nextDuration) || nextDuration <= 0) {
      return NextResponse.json(
        { error: 'Duration must be a positive number of seconds' },
        { status: 400 }
      )
    }

    const nextStartTime = body.startTime ? new Date(body.startTime) : new Date(session.start_time)
    if (Number.isNaN(nextStartTime.getTime())) {
      return NextResponse.json({ error: 'Invalid start time' }, { status: 400 })
    }

    const nextEndTime = new Date(nextStartTime.getTime() + nextDuration * 1000)
    const nextNote = body.note !== undefined ? (body.note?.trim() || null) : session.note
    const durationDelta = nextDuration - session.duration

    const [updatedSession] = await sql`
      UPDATE time_sessions
      SET
        start_time = ${nextStartTime},
        end_time = ${nextEndTime},
        duration = ${nextDuration},
        note = ${nextNote}
      WHERE id = ${id}
      RETURNING *
    `

    const [updatedProject] = await sql`
      UPDATE projects
      SET total_tracked_time = GREATEST(0, total_tracked_time + ${durationDelta})
      WHERE id = ${project.id}
      RETURNING total_tracked_time
    `

    return NextResponse.json({
      session: timeSessionRowToTimeSession(updatedSession as TimeSessionRow),
      totalTrackedTime: Number(updatedProject.total_tracked_time),
    })
  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    )
  }
}

// DELETE /api/sessions/[id] - Delete a time session
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

    const owned = await getOwnedSession(id, userId)
    if ('error' in owned) return owned.error

    const { session, project } = owned

    await sql`DELETE FROM time_sessions WHERE id = ${id}`

    await sql`
      UPDATE projects
      SET total_tracked_time = GREATEST(0, total_tracked_time - ${session.duration})
      WHERE id = ${project.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting session:', error)
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    )
  }
}
