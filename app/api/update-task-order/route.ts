import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: Request) {
  try {
    const { tasks } = await request.json();

    // Update the order of each task in the database
    for (const task of tasks) {
      await sql`
        UPDATE tasks
        SET order_index = ${task.order}
        WHERE id = ${task.id}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating task order:', error);
    return NextResponse.json({ error: 'Failed to update task order' }, { status: 500 });
  }
} 