# Serverless CIF on AWS

## Set up environment

Install AWS CLI and Serverless CLI.

```bash
npm install -g serverless
```

## Structure

This service has a separate directory for all the operations. `lib`

And this service has one function, so http method and path are controlled like this;

```yaml
  events:
    - httpApi:
        path: /{proxy+}
        method: ANY
```

In the `handler.js`, separate http method and path and then call each handler of the lib.

## Scaling

### AWS Lambda

By default, AWS Lambda limits the total concurrent executions across all functions within a given region to 100. The default limit is a safety limit that protects you from costs due to potential runaway or recursive functions during initial development and testing. To increase this limit above the default, follow the steps in [To request a limit increase for concurrent executions](http://docs.aws.amazon.com/lambda/latest/dg/concurrent-executions.html#increase-concurrent-executions-limit).


### DynamoDB

When you create a table, you specify how much provisioned throughput capacity you want to reserve for reads and writes. DynamoDB will reserve the necessary resources to meet your throughput needs while ensuring consistent, low-latency performance. You can change the provisioned throughput and increasing or decreasing capacity as needed.

This is can be done via settings in the `serverless.yml`.

```yaml
  ProvisionedThroughput:
    ReadCapacityUnits: 1
    WriteCapacityUnits: 1
```

In case you expect a lot of traffic fluctuation we recommend to checkout this guide on how to auto scale DynamoDB [https://aws.amazon.com/blogs/aws/auto-scale-dynamodb-with-dynamic-dynamodb/](https://aws.amazon.com/blogs/aws/auto-scale-dynamodb-with-dynamic-dynamodb/)

This service uses the dynamo db already created.

Also the role is described in the `serverless.yml`.

```yaml
  role:
    statements:
      - Effect: Allow
        Action:
          - dynamodb:Query
          - dynamodb:Scan
          - dynamodb:GetItem
          - dynamodb:PutItem
          - dynamodb:UpdateItem
          - dynamodb:DeleteItem
          - dynamodb:BatchGetItem
          - dynamodb:BatchWriteItem
        Resource: 
          - "arn:aws:dynamodb:${aws:region}:*:table/${self:provider.environment.FIMSConstraints}"
          - "arn:aws:dynamodb:${aws:region}:*:table/${self:provider.environment.FIMSOperations}"
          - "arn:aws:dynamodb:${aws:region}:*:table/${self:provider.environment.FIMSConstraintsID}"
          - "arn:aws:dynamodb:${aws:region}:*:table/${self:provider.environment.FIMSConstraintsNotifications}"
```

## Usage

### Deployment

```
$ serverless deploy
```

After deploying, you should see output similar to:

```bash
Serverless: Running "serverless" installed locally (in service node_modules)
Serverless: Packaging service...
Serverless: Excluding development dependencies...
Serverless: Uploading CloudFormation file to S3...
Serverless: Uploading artifacts...
Serverless: Uploading service cif-serverless.zip file to S3 (7 MB)...
Serverless: Validating template...
Serverless: Updating Stack...
Serverless: Checking Stack update progress...
.........
Serverless: Stack update finished...
Service Information
service: cif-serverless
stage: dev
region: ap-southeast-1
stack: cif-serverless-dev
resources: 11
api keys:
  None
endpoints:
  ANY - https://fuktpi826d.execute-api.ap-southeast-1.amazonaws.com/{proxy+}
functions:
  cif-serverless: cif-serverless
layers:
  None
```

_Note_: In current form, after deployment, your API is public and can be invoked by anyone. For production deployments, you might want to configure an authorizer. For details on how to do that, refer to [http event docs](https://www.serverless.com/framework/docs/providers/aws/events/apigateway/).

### Invocation

After successful deployment, you can call the created functions via HTTP:

```bash
ANY - https://fuktpi826d.execute-api.ap-southeast-1.amazonaws.com/{proxy+}
```

### Local development

You can invoke your function locally by using the following command:

```bash
serverless invoke local --function handler
```

Alternatively, it is also possible to emulate API Gateway and Lambda locally by using `serverless-offline` plugin. In order to do that, execute the following command:

```bash
serverless plugin install -n serverless-offline
```

It will add the `serverless-offline` plugin to `devDependencies` in `package.json` file as well as will add it to `plugins` in `serverless.yml`.

After installation, you can start local emulation with:

```
serverless offline
```

To learn more about the capabilities of `serverless-offline`, please refer to its [GitHub repository](https://github.com/dherault/serverless-offline).
