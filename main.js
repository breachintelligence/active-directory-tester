const bunyan = require('bunyan');
const { getUserStats } = require('./user-stats');
const { insertDocument, deleteIndex, createMapping } = require('./elastic');
const log = bunyan.createLogger({
  name: 'UStat',
  level: 'trace'
});

const refreshCmd = {
  command: '$0',
  desc: 'Insert Polarity user information into an elasticsearch index',
  builder: (yargs) => {
    return yargs
      .option('polarityPath', {
        type: 'string',
        default: '/app/polarity-server',
        nargs: 1,
        describe: 'Path to your Polarity Server install directory'
      })
      .option('polarityConfig', {
        type: 'string',
        default: '/app/polarity-server/config/config.js',
        nargs: 1,
        describe: 'Path to your Polarity Server config file'
      })
      .option('elasticUrl', {
        type: 'string',
        demand: 'You must provide the URL to your Elastic REST API including the port where applicable',
        nargs: 1,
        describe: 'Elasticsearch REST API Url'
      })
      .option('elasticIndex', {
        type: 'string',
        default: 'polarity_users',
        nargs: 1,
        describe: 'Elasticsearch Index to Create and Modify'
      })
      .option('elasticUsername', {
        type: 'string',
        nargs: 1,
        describe: 'Username to authenticate to Elasticsearch as'
      })
      .option('elasticPassword', {
        type: 'string',
        nargs: 1,
        describe: 'Password for provided elasticUsername'
      })
      .option('elasticApiKey', {
        type: 'string',
        nargs: 1,
        describe: 'API Key to authenticate as (no username and password required)'
      })
      .option('generateIndex', {
        type: 'boolean',
        default: false,
        describe: 'If true, any existing index will be deleted and a new index will be created before populating it'
      });
  },
  handler: async (argv) => {
    const {
      polarityPath,
      polarityConfig,
      elasticUrl,
      elasticUsername,
      elasticPassword,
      elasticApiKey,
      elasticIndex,
      generateIndex
    } = argv;
    const elasticOptions = {
      url: elasticUrl
    };

    if (elasticPassword && elasticUsername) {
      elasticOptions.password = elasticPassword;
      elasticOptions.username = elasticUsername;
    } else {
      elasticOptions.apiKey = elasticApiKey;
    }

    try {
      log.info('Fetching User Information');
      const users = await getUserStats(polarityConfig, polarityPath);
      log.info(`Fetched info for ${users.length} users`);
      if (generateIndex) {
        log.info(`Removing existing ${elasticIndex} index`);
        await deleteIndex(elasticIndex, elasticOptions);
        log.info(`Generating user mapping`);
        await createMapping(elasticIndex, elasticOptions);
      }
      for (const user of users) {
        await insertDocument(elasticIndex, user, elasticOptions);
        log.info(`Inserted user ${user.username} <${user.email}> into doc id ${user.userId}`);
      }
    } catch (e) {
      log.error(errorToPojo(e));
    }
    process.exit(1);
  }
};

function errorToPojo(error) {
  return JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)));
}

require('yargs')
  .usage('Usage: $0 <command> [options]')
  .command(refreshCmd)
  .help()
  .wrap(null)
  .version('Users Stats to Elastic v' + require('./package.json').version)
  // help
  .epilog('(C) 2022 Polarity.io, Inc.').argv;
