import { NextResponse } from 'next/server';
import { handleApiError } from './errorHandler';

// Standardized API response helper
export function successResponse(data, statusCode = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

export function errorResponse(error, statusCode = 500, context = '') {
  const errorData = handleApiError(error, context);
  return NextResponse.json(
    {
      success: false,
      ...errorData,
      timestamp: new Date().toISOString(),
    },
    { status: error.statusCode || statusCode }
  );
}

export function paginatedResponse(data, pagination, statusCode = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      pagination,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}
