const parser = require('lambda-multipart-parser');
// Create clients and set shared const values outside of the handler.

// Create a DocumentClient that represents the query to add an item
const dynamodb = require("aws-sdk/clients/dynamodb");
const docClient = new dynamodb.DocumentClient();

// Create a S3  client
const AWS = require("aws-sdk");
const s3Client = new AWS.S3();
const HUBS_IMAGE_BUCKET = "hubs-image";

// Get the DynamoDB table name from environment variables
const tableName = process.env.HUBS_TABLE_NAME;

// TODO: Update all responses to JSONs
/**
 * A HTTP get method to update a hub to a DynamoDB table.
 */
exports.updateHubHandler = async (event) => {
  // All log statements are written to CloudWatch
  console.info("received:", event);

  let response = {};

  if (event.httpMethod !== "PUT") {
    console.error(
      `updateHubHandler only accept PUT method, you tried: ${event.httpMethod}`
    );
    return {
      statusCode: 405,
      body: "HTTP Method Not Allowed",
    };
  }

  try {
	const parsedEvent = await parser.parse(event);
	console.info(parsedEvent);

	// JSON Parse Data
	let hubDetails = JSON.parse(parsedEvent.hubDetails);

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
        body: "Unable to call DynamoDB. Table resource not found.",
      };
    }
  } catch (err) {
    console.error("Exception: ", err);
    response = {
      statusCode: 500,
      body: "Unable to insert image to S3",
    };
  }

  // All log statements are written to CloudWatch
  console.info(
    `response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`
  );
  return response;
};