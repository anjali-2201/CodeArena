/**
 * Standardised API response wrapper.
 * All successful responses use this shape:
 * { success: true, statusCode, message, data, pagination? }
 */
class ApiResponse {
  constructor(statusCode, message, data = null, pagination = null) {
    this.success    = statusCode < 400;
    this.statusCode = statusCode;
    this.message    = message;
    if (data !== null)       this.data       = data;
    if (pagination !== null) this.pagination = pagination;
  }

  send(res) {
    return res.status(this.statusCode).json(this);
  }
}

module.exports = ApiResponse;
