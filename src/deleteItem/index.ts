import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient, DeleteItemCommand } from "@aws-sdk/client-dynamodb";

const dynamoDBClient = new DynamoDBClient({ region: "us-east-1" });

export const handler: APIGatewayProxyHandler = async (event) => {
  const itemId = event.pathParameters?.id;

  if (!itemId) {
    return {
      statusCode: 400,
      body: "Event ID not provided",
    };
  }

  try {
    const command = new DeleteItemCommand({
      TableName: "CevuCdkCrudTable",
      Key: { id: { S: itemId } },
    });

    await dynamoDBClient.send(command);
    return {
      statusCode: 200,
      body: JSON.stringify(itemId),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error }),
    };
  }
};
