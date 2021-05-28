require('dotenv').config({ path: __dirname + '/.env' });
import repositories from './repositories';
import tags from './tags';

export default {
  clusterName: process.env.CLUSTER_NAME || 'mobileMicroservices',
  parameters: {
    repositoryName: process.env.REPOSITORY_NAME || '/iac-mobile-stack/dev/respository_name',
    repositoryOwner: process.env.REPOSITORY_OWNER || '/iac-mobile-stack/dev/respository_owner',
    repositoryBranch: process.env.REPOSITORY_BRANCH || '/iac-mobile-stack/dev/respository_branch',
  },
  repositories,
  tags
}
