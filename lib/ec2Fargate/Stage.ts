import { Stage } from '@aws-cdk/core';
import { ec2FargateInfrastructure } from './Infrastructure';
import { ec2FargateCICD } from './CICD';

/**
 * Deployable unit of web service app
 */
export class ec2FargateStage extends Stage {
  public parameters: any;
    constructor(scope: any, id: string, props?: any) {
      super(scope, id, props);
      this.parameters = props.parameters;

      const infrastructure = new ec2FargateInfrastructure(this, 'CreationInfraestructure', {
        ...props,
      });

      new ec2FargateCICD(this, 'CICD', {
        ...props,
        infrastructure
      });
    }
}
