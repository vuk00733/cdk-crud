import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";

interface LambdaConfig {
  handler: string;
  method: string;
  path: string;
}

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //creating dynamo db table
    const table = new dynamodb.Table(this, "CevuCdkCrudTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    //lambda configs
    const lambdaConfigs: LambdaConfig[] = [
      { handler: "getOneItem", method: "GET", path: "/getOneItem/{id}" },
      { handler: "createItem", method: "POST", path: "/createItem" },
      { handler: "getAllItems", method: "GET", path: "/getAllItems" },
      { handler: "deleteItem", method: "DELETE", path: "/deleteItem/{id}" },
    ];

    //map to store lambdas
    const lambdaFunctions = new Map<string, lambda.Function>();

    //creating lambda for each endpoint
    lambdaConfigs.forEach((lambdaConfig) => {
      const fn = new lambda.Function(this, `${lambdaConfig.handler}Lambda`, {
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromAsset(`src/${lambdaConfig.handler}`),
        handler: `index.handler`,
        environment: {
          TABLE_NAME: table.tableName,
        },
        timeout: cdk.Duration.seconds(10),
      });
      //grant read write to db table
      table.grantReadWriteData(fn);
      //storing lambdas in map
      lambdaFunctions.set(lambdaConfig.handler, fn);
    });

    //creating rest api
    const apigw = new apigateway.RestApi(this, "CevuCdkCrudApiGW", {
      restApiName: "CevuCdkCrudApiGW",
      endpointTypes: [apigateway.EndpointType.REGIONAL],
      deployOptions: {
        stageName: "dev",
      },
    });

    //creating resources and methods with LambdaIntegration added
    lambdaConfigs.forEach((config) => {
      const retrievedFunction: any = lambdaFunctions.get(config.handler);

      let resourcePath = config.path;
      let pathParamName: string | undefined;

      //check if the path contains curly braces
      const matches = config.path.match(/\{(.+?)\}/);
      if (matches) {
        //extract the path parameter name from the curly braces
        pathParamName = matches[1];
        //remove the curly braces and the path parameter name from the resource path
        resourcePath = config.path.replace(`{${pathParamName}}`, "");
      }

      //create the resource for the endpoint
      const resource = apigw.root.addResource(resourcePath);

      if (pathParamName) {
        // Add the path parameter to the resource if it exists
        resource.addResource(`{${pathParamName}}`);
      }

      // Add the method with the Lambda integration to the resource
      resource.addMethod(
        config.method,
        new apigateway.LambdaIntegration(retrievedFunction)
      );
    });
  }
}
