import { Pipeline, Artifact } from '@aws-cdk/aws-codepipeline';
import * as iam from '@aws-cdk/aws-iam';
import { BuildSpec, LinuxBuildImage, Project, Source, FilterGroup, EventAction } from '@aws-cdk/aws-codebuild';
import { GitHubSourceAction, CodeBuildAction, EcsDeployAction } from '@aws-cdk/aws-codepipeline-actions';
import { Construct, Stack, } from '@aws-cdk/core';

/**
 * The stack that defines the application pipeline
 */
export class ec2FargateCICD extends Stack {
  public artifacts: any;
  public pipeline: any;
  public parameters: any;
  public repository: any;
  public infrastructure: any;

    constructor(scope: Construct, id: string, props?: any) {
      super(scope, id, props);
      this.parameters = props.parameters;
      this.repository = props.repository;
      this.infrastructure = props.infrastructure;

      this.declareArtifacts();
      this.createPipeline();
      this.addSourceStage();
      this.addBuildStage();
      this.addDeployStage();
    }

    declareArtifacts() {
      this.artifacts = {
        source: new Artifact(),
        build: new Artifact(),
      };
    }

    createPipeline() {
      this.pipeline = new Pipeline(this, `${this.repository.name}DeployPipeline`, {
        pipelineName: `${this.repository.name}DeployPipeline`,
      });
    }

    addSourceStage() {
        const gitHubAction = new GitHubSourceAction({
        actionName: 'GitHub',
        output: this.artifacts.source,
        oauthToken: this.repository.source.github.oauthToken,
        owner: this.repository.source.github.owner,
        repo: this.repository.source.github.name,
        branch: this.repository.source.github.branch,
        runOrder: 1
      });

      this.pipeline.addStage({
        stageName: 'Source',
        actions: [gitHubAction],
      });
    }

    addBuildStage() {

      const project = this.createProject();

      this.infrastructure.ecrRepo.grantPullPush(project.role!)
      project.addToRolePolicy(new iam.PolicyStatement({
        actions: [
          "ecs:DescribeCluster",
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer"
          ],
        resources: [`${this.infrastructure.cluster.clusterArn}`],
      }));

      const buildAction = new CodeBuildAction({
        actionName: `${this.repository.name}CodeBuild`,
        project: project,
        input: this.artifacts.source,
        outputs: [this.artifacts.build], // optional
        runOrder: 2,
      });

      this.pipeline.addStage({
        stageName: 'Build',
        actions: [buildAction],
      });
    }

    createProject() {
      const gitHubSource = Source.gitHub({
        owner: this.repository.source.github.owner,
        repo: this.repository.source.github.name,
        webhook: true,
        webhookFilters: [
          FilterGroup.inEventOf(EventAction.PUSH).andBranchIs(this.repository.source.github.branch),
        ],
      });
  
      return new Project(this, `${this.repository.name}MyProject`, {
        projectName: `${this.stackName}`,
        source: gitHubSource,
        environment: {
          buildImage: LinuxBuildImage.AMAZON_LINUX_2_2,
          privileged: true
        },
        environmentVariables: {
          'CLUSTER_NAME': {
            value: `${this.infrastructure.cluster.clusterName}`
          },
          'ECR_REPO_URI': {
            value: `${this.infrastructure.ecrRepo.repositoryUri}`
          },
          'FARGATE_LOADBALANCER_DNS_NAME': {
            value: `http://${this.infrastructure.fargate.loadBalancer.loadBalancerDnsName}`
          }
        },
        buildSpec: BuildSpec.fromObject({
          version: "0.2",
          phases: {
            pre_build: {
              commands: [
                'env',
                'export TAG=${CODEBUILD_RESOLVED_SOURCE_VERSION}'
              ]
            },
            build: {
              commands: [
                'ls -a -l',
                `docker build -t $ECR_REPO_URI:$TAG .`,
                '$(aws ecr get-login --no-include-email)',
                'docker push $ECR_REPO_URI:$TAG',
              ]
            },
            post_build: {
              commands: [
                'echo "In Post-Build Stage"',
                'ls -a -l',
                `printf '[{\"name\":\"${this.infrastructure.containerName}\",\"imageUri\":\"%s\"}]' $ECR_REPO_URI:$TAG > imagedefinitions.json`,
                'pwd; ls -al; cat imagedefinitions.json',
                'ls -a -l',
              ]
            }
          },
          artifacts: {
            files: [
              'imagedefinitions.json'
            ],
          }
        })
      });
    }
  
    addDeployStage() {
      const deployAction = new EcsDeployAction({
        actionName: 'DeployAction',
        service: this.infrastructure.fargate.service,
        input: this.artifacts.build,
        runOrder: 3
      });

      this.pipeline.addStage({
        stageName: 'Deploy',
        actions: [deployAction],
      });
    }
}
