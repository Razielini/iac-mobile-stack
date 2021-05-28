import * as iam from '@aws-cdk/aws-iam';
import * as ecr from '@aws-cdk/aws-ecr';
import{ Vpc } from '@aws-cdk/aws-ec2';
import { Cluster, AwsLogDriver, FargateTaskDefinition, ContainerImage, Protocol } from '@aws-cdk/aws-ecs';
import * as ecs_patterns from '@aws-cdk/aws-ecs-patterns';
import { Construct, Stack, Tags } from '@aws-cdk/core';

/**
 * The stack that defines the application pipeline
 */
export class ec2FargateInfrastructure extends Stack {
  public infrastructure: any;
  public repository: any;
  public parameters: any;
    constructor(scope: Construct, id: string, props?: any) {
      super(scope, id, props);
      this.repository = props.repository;
      this.parameters = props.parameters;

      // *** CREATE CRUSTER - FARGATE ***
      const vpc = new Vpc(this, 'VPC', {
        maxAzs: 3,
      });

      const cluster = new Cluster(this, 'Cluster', {
        clusterName: `cluster-${this.repository.name}`,
        vpc,
      });

      const logging = new AwsLogDriver({
        streamPrefix: `logs-${this.repository.name}`
      });

      const taskRole = new iam.Role(this, 'TaskRole', {
        roleName: `taskRole-${this.repository.name}`,
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
      });

      // ***ECS Contructs***

      const executionRolePolicy =  new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ['*'],
        actions: [
                  "ecr:GetAuthorizationToken",
                  "ecr:BatchCheckLayerAvailability",
                  "ecr:GetDownloadUrlForLayer",
                  "ecr:BatchGetImage",
                  "logs:CreateLogStream",
                  "logs:PutLogEvents"
              ]
      });

      const taskDef = new FargateTaskDefinition(this, `${this.repository.name}TaskDef`, {
        taskRole,
      });

      taskDef.addToExecutionRolePolicy(executionRolePolicy);

      const container = taskDef.addContainer('Container', {
        containerName: `${this.repository.name}Container`,
        image: ContainerImage.fromAsset('./docker'),
        memoryLimitMiB: 256,
        cpu: 256,
        logging
      });

      container.addPortMappings({
        containerPort: this.repository.port || 3000,
        protocol: Protocol.TCP
      });

      const fargate = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'Fargate', {
        serviceName: `Fargate-${this.repository.name}`,
        cluster: cluster, // Required
        taskDefinition: taskDef,
        cpu: 256, // Default is 256
        desiredCount: 1, // Default is 1
        memoryLimitMiB: 512, // Default is 512
        publicLoadBalancer: true, // Default is false
      });

      const ecrRepoName = (`${this.repository.name}EcrRepo`).toLowerCase();
      const ecrRepo = new ecr.Repository(this, 'EcrRepo', {
        repositoryName: ecrRepoName
      });

      this.infrastructure = {
        fargate,
        cluster,
        ecrRepo,
        containerName: container.containerName
      }
      return this.infrastructure;
    }
}
