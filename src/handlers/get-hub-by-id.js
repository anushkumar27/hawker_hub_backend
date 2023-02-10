// Create clients and set shared const values outside of the handler.

// Get the DynamoDB table name from environment variables
const tableName = process.env.HUBS_TABLE_NAME;

// Create a DocumentClient that represents the query to add an item
const dynamodb = require("aws-sdk/clients/dynamodb");
const { ERROR_METHOD_NOT_ALLOWED, ERROR_INVALID_HUB_ID, ERROR_RESOURCE_NOT_FOUND } = require("../resources/constants");
const docClient = new dynamodb.DocumentClient();

/**
 * A HTTP get method to get a hub by id from a DynamoDB table.
 */
exports.getHubByIdHandler = async (event) => {
  if (event.httpMethod !== "GET") {
    console.error(
      `getHubByIdHandler only accept GET method, you tried: ${event.httpMethod}`
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
    const data = await docClient.get(params).promise();
    
    if (data.Item !== undefined && data.Item !== null) {
      response = {
        statusCode: 200,
        body: JSON.stringify(data.Item)
      };
    }else{
      throw new Error(`Item with key: ${hubId} not found`);
    }
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
