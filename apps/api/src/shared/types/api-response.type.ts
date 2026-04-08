export interface ApiResponse<T = any> {
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
  details?: any;
  meta: {
    timestamp: string;
    requestId: string;
  };
}
