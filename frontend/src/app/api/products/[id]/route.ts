import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    if (body.name !== undefined) product.name = body.name.trim();
    if (body.category !== undefined) product.category = body.category.trim();
    if (body.unit !== undefined) product.unit = body.unit.trim();
    if (body.price !== undefined) product.price = Number(body.price);
    if (body.originalPrice !== undefined)
      product.originalPrice = body.originalPrice ? Number(body.originalPrice) : undefined;
    if (body.stock !== undefined) product.stock = Number(body.stock);
    if (body.image !== undefined) product.image = body.image;
    if (body.isAvailable !== undefined) product.isAvailable = Boolean(body.isAvailable);

    await product.save();

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      data: product.toJSON(),
    });
  } catch (error: any) {
    console.error('API /products/[id] PUT error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    console.error('API /products/[id] DELETE error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}

