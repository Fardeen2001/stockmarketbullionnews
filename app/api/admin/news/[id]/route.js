import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/adminMiddleware';
import { getNewsCollection } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function DELETE(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const collection = await getNewsCollection();
    await collection.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      message: 'Article deleted successfully',
    });
  } catch (error) {
    console.error('Delete article error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const collection = await getNewsCollection();
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: body }
    );

    return NextResponse.json({
      success: true,
      message: 'Article updated successfully',
    });
  } catch (error) {
    console.error('Update article error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
