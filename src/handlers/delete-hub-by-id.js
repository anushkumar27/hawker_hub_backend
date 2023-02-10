// Create clients and set shared const values outside of the handler.

// Get the DynamoDB table name from environment variables
const tableName = process.env.HUBS_TABLE_NAME;

// Create a DocumentClient that represents the query to add an item
const dynamodb = require("aws-sdk/clients/dynamodb");
const docClient = new dynamodb.DocumentClient();

// Create a S3  client
const AWS = require("aws-sdk");
const { ERROR_METHOD_NOT_ALLOWED, ERROR_INVALID_HUB_ID, SUCCESS_HUB_DELETED, ERROR_RESOURCE_NOT_FOUND } = require("../resources/constants");
const s3Client = new AWS.S3();
const HUBS_IMAGE_BUCKET = "hubs-image";

/**
 * A HTTP delete method to delete a hub from a DynamoDB table.
 */
exports.deleteHubByIdHandler = async (event) => {
  if (event.httpMethod !== "DELETE") {
    console.error(
      `deleteHubByIdHandler only accept DELETE method, you tried: ${event.httpMethod}`
    );
    response = {
      statusCode: 405,
      body: ERROR_METHOD_NOT_ALLOWED,
    };

    return response;
  }

  // All log statements are written to CloudWatch
  console.info("received:", event);

  // Get hub_id from pathParameters from APIGateway because of `/{hub_id}` at template.yaml
  const hub_id = event.pathParameters.hub_id;

  // Get the item from the table
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property
  let response = {};

  if(!hub_id){
    response = {
        statusCode: 400,
        body: ERROR_INVALID_HUB_ID,
      };
    return response;
  }

  try {
    const params = {
      TableName: tableName,
      Key: { hub_id: hub_id },
    };
    
    await docClient.delete(params).promise();

    const s3params = {
      Bucket: HUBS_IMAGE_BUCKET,
      Key: hub_id + ".jpg"
    };
    console.log("S3 Params: ", s3params);
    var s3Response = await s3Client.deleteObject(s3params).promise();
    console.log("Response from S3: ", s3Response);
    response = {
      statusCode: 200,
      body: SUCCESS_HUB_DELETED,
    };
  } catch (Exception) {
    console.error("Exception: ", Exception);
    response = {
      statusCode: 404,
      body: ERROR_RESOURCE_NOT_FOUND,
    };
  }

  // All log statements are written to CloudWatch
  console.info(
    `response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`
  );
  return response;
};
