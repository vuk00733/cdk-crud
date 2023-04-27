import {
  DynamoDBClient,
  GetItemCommand,
  GetItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const client = new DynamoDBClient({ region: "eu-west-3" });

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const itemId = event.pathParameters?.id;
    if (!itemId) {
      return {
        statusCode: 400,
        body: "ID not provided",
      };
    }

    const input: GetItemCommandInput = {
      TableName: "CevuCdkCrudTable",
      Key: { id: { S: itemId } },
    };

    const command = new GetItemCommand(input);
    const result = await client.send(command);

    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Item not found" }),
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify(result.Item),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error }),
    };
  }
};
