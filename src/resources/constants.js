module.exports = Object.freeze({
  SUCCESS_HUB_DELETED: JSON.stringify({
    status: "SUCCESS",
    message: "Hub deleted successfully",
  }),
  ERROR_METHOD_NOT_ALLOWED: JSON.stringify({
    status: "ERROR",
    message: "HTTP method not allowed",
  }),
  ERROR_INVALID_HUB_ID: JSON.stringify({
    status: "ERROR",
    message: "Invalid Hub id",
  }),
  ERROR_RESOURCE_NOT_FOUND: JSON.stringify({
    status: "ERROR",
    message: "Unable to call DynamoDB. Resource not found",
  }),
  ERROR_S3_INSERTION_FAILED: JSON.stringify({
    status: "ERROR",
    message: "S3 object insertion failed",
  }),
  ERROR_HUB_PHOTO_MISSING: JSON.stringify({
    status: "ERROR",
    message: "Hub photo missing in payload",
  }),
});
