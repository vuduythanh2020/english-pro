export interface ApiResponse<T = unknown> {
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  details?: Record<string, unknown>;
  meta: {
    timestamp: string;
    requestId: string;
  };
}
