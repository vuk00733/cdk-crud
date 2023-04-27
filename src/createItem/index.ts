import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const dynamoDBClient = new DynamoDBClient({ region: "us-east-1" });

export const handler: APIGatewayProxyHandler = async (event) => {
  const { name, description } = JSON.parse(event.body || "");

  if (!name || !description) {
    return {
      statusCode: 400,
      body: "Missing required fields",
    };
  }

  try {
    const id = new Date().toISOString();
    const command = new PutItemCommand({
      TableName: "CevuCdkCrudTable",
      Item: {
        id: { S: id },
        name: { S: name },
        description: { S: description },
      },
    });

    await dynamoDBClient.send(command);

    return {
      statusCode: 201,
      body: JSON.stringify({ id, name, description }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error }),
    };
  }
};
