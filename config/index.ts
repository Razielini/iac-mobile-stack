require('dotenv').config({ path: __dirname + '/.env' });
import repositories from './repositories';
import tags from './tags';

export default {
  clusterName: process.env.CLUSTER_NAME || 'mobileMicroservices',
  parameters: {
    repositoryName: process.env.REPOSITORY_NAME || '/cdk-iot-pipeline/dev/respository_name',
    repositoryOwner: process.env.REPOSITORY_OWNER || '/cdk-iot-pipeline/dev/respository_owner',
    repositoryBranch: process.env.REPOSITORY_BRANCH || '/cdk-iot-pipeline/dev/respository_branch',
  },
  repositories,
  tags
}
