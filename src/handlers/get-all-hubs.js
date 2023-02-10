// Create clients and set shared const values outside of the handler.

// Get the DynamoDB table name from environment variables
const tableName = process.env.HUBS_TABLE_NAME;

// Create a DocumentClient that represents the query to add an item
const dynamodb = require("aws-sdk/clients/dynamodb");
const { ERROR_METHOD_NOT_ALLOWED, ERROR_RESOURCE_NOT_FOUND } = require("../resources/constants");
const docClient = new dynamodb.DocumentClient();

/**
 * A HTTP get method to get all hubs from a DynamoDB table.
 */
exports.getAllHubsHandler = async (event) => {
  if (event.httpMethod !== "GET") {
    console.error(
      `getAllHubsHandler only accept GET method, you tried: ${event.httpMethod}`
    );
    response = {
      statusCode: 405,
      body: ERROR_METHOD_NOT_ALLOWED,
    };

    return response;
  }

  // All log statements are written to CloudWatch
  console.info("received:", event);

  let response = {};

  try {
    const params = {
      TableName: tableName,
    };

    // Collate all the hubs as a single scan call only fetches max of 1MB of data
    let tableScanResults = [];
    let hubs;
    do {
      hubs = await docClient.scan(params).promise();
      hubs.Items.forEach((hub) => tableScanResults.push(hub));
      params.ExclusiveStartKey = hubs.LastEvaluatedKey;
    } while (typeof hubs.LastEvaluatedKey != "undefined");

    response = {
      statusCode: 200,
      body: JSON.stringify(tableScanResults),
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
