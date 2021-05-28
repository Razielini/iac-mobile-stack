import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as parameterStore from '@aws-cdk/aws-ssm';
import { CdkPipeline, SimpleSynthAction } from '@aws-cdk/pipelines';
import { Construct, SecretValue, Stack, StackProps, Tags } from '@aws-cdk/core';
import { ec2FargateStage } from './ec2Fargate/Stage'
import config from '../config/index';

export class IacMobileStack extends Stack {
  public parameters: any;
  public pipeline: any;
  public repoStages: any;

    constructor(scope: Construct, id: string, props?: StackProps) {
      super(scope, id, props);

      this.loadParameters(config);
      const { repositories, parameters, tags } = this.parameters
      this.createPipeline(parameters, tags);
      this.addApplicationStages(parameters, repositories);
    }

  createPipeline(parameters: any, tags: any) {
    const sourceArtifact = new codepipeline.Artifact();
    const cloudAssemblyArtifact = new codepipeline.Artifact();

    const sourceAction = this.sourceAction(
      sourceArtifact,
      parameters
    );

    const synthAction = SimpleSynthAction.standardNpmSynth({
      sourceArtifact,
      cloudAssemblyArtifact,
      installCommand: 'npm install -g npm && npm install typescript -g && npm install',
    });

    this.pipeline = new CdkPipeline(this, 'PipeLine', {
      pipelineName: this.stackName,
      cloudAssemblyArtifact,
      sourceAction,
      synthAction,
    });
  }

  addApplicationStages(parameters: any, repositories: any) {
    const repoList = Object.keys(repositories).map((key) => repositories[key]);
    this.repoStages = repoList.map((myrepo) => {
      const repository = { ...myrepo };
      repository.source.github.oauthToken = this.parameters.oauthToken;

      const repoStage = new ec2FargateStage(this, `${repository.name}Repository`, {
        parameters,
        repository,
      });
      this.pipeline.addApplicationStage(repoStage);
      return repoStage;
    });
  }

  sourceAction(
    sourceArtifact: any,
    {
      repositoryOwner,
      repositoryName,
      repositoryBranch 
    }: any) {
    return new codepipeline_actions.GitHubSourceAction({
      actionName: 'GitHub',
      output: sourceArtifact,
      oauthToken: this.parameters.oauthToken,
      owner: repositoryOwner,
      repo: repositoryName,
      branch: repositoryBranch
    });
  }

  loadParameters({ 
    clusterName,
    parameters,
    repositories,
    tags
  }: any) {
    
    const myParameters = Object.entries(parameters).reduce((acc: Array<String>, [key, val]: Array<any>) => {
      acc[key] = parameterStore.StringParameter.valueForStringParameter(this, val.trim());
      return acc;
    }, []);

    this.parameters = {
      clusterName,
      parameters: myParameters,
      repositories,
      tags,
      oauthToken: SecretValue.secretsManager('github-token')
    }

    return this.parameters
  }
}
