const parser = require('lambda-multipart-parser');
// Create clients and set shared const values outside of the handler.

// Create a DocumentClient that represents the query to add an item
const dynamodb = require("aws-sdk/clients/dynamodb");
const docClient = new dynamodb.DocumentClient();

// Create a S3  client
const AWS = require("aws-sdk");
const { ERROR_METHOD_NOT_ALLOWED, ERROR_RESOURCE_NOT_FOUND, ERROR_S3_INSERTION_FAILED } = require('../resources/constants');
const s3Client = new AWS.S3();
const HUBS_IMAGE_BUCKET = "hubs-image";

// Get the DynamoDB table name from environment variables
const tableName = process.env.HUBS_TABLE_NAME;

/**
 * A HTTP get method to insert a hub to a DynamoDB table.
 */
exports.insertHubHandler = async (event) => {
  // All log statements are written to CloudWatch
  console.info("received:", event);

  let response = {};

  if (event.httpMethod !== "POST") {
    console.error(
      `insertHubHandler only accept POST method, you tried: ${event.httpMethod}`
    );
    return {
      statusCode: 405,
      body: ERROR_METHOD_NOT_ALLOWED,
    };
  }

  try {
	const parsedEvent = await parser.parse(event);
	console.info(parsedEvent);

	// JSON Parse Data
	let hubDetails = JSON.parse(parsedEvent.hubDetails);
  
  if(parsedEvent.files == undefined || parsedEvent.files == null || parsedEvent.files.length == 0){
    return response = {
      statusCode: 400,
      body: ERROR_HUB_PHOTO_MISSING,
    };
  }
  
	let hubPhoto = Buffer.from(parsedEvent.files[0].content); 
	let hubPhotoType = parsedEvent.files[0].contentType;
	let hubPhotoFileName = parsedEvent.files[0].filename;
  
  var fileExt = hubPhotoFileName.split('.').pop();
  hubPhotoFileName = hubDetails.hub_id + "." + fileExt;

  console.info("Hub Photo", hubPhoto, hubPhotoFileName);
	const params = {
		Bucket: HUBS_IMAGE_BUCKET,
		Key: hubPhotoFileName,
		Body: hubPhoto,
		ContentType: hubPhotoType,
		ACL: "public-read"
	};

	await s3Client.upload(params).promise();

    // Insert data to DynamoDB
    try {
      // Update hub photo URL
      hubDetails.hub_photo = `https://${HUBS_IMAGE_BUCKET}.s3.amazonaws.com/${hubPhotoFileName}`;
		console.log("Hub Details DynamoDB: ", hubDetails);
	  const params = {
        TableName: tableName,
        Item: hubDetails,
      };

      await docClient.put(params).promise();
	  
      response = {
        statusCode: 200,
        body: JSON.stringify(hubDetails),
      };
    } catch (err) {
      console.error("Exception: ", err);
      response = {
        statusCode: 404,
        body: ERROR_RESOURCE_NOT_FOUND,
      };
    }
  } catch (err) {
    console.error("Exception: ", err);
    response = {
      statusCode: 500,
      body: ERROR_S3_INSERTION_FAILED,
    };
  }

  // All log statements are written to CloudWatch
  console.info(
    `response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`
  );
  return response;
};