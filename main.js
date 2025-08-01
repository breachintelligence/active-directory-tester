const fs   = require('fs');
const path = require('path');
const bunyan = require('bunyan');
const { getUserStats } = require('./user-stats');
const { insertDocument, deleteIndex, createMapping } = require('./elastic');
const log = bunyan.createLogger({
  name: 'UStat',
  level: 'trace'
});

/**
 * Tests whether a file exists.
 * @param {string} filePath – Absolute or relative path to the file.
 * @returns {Promise<boolean>}
 */
async function fileExists(filePath) {
  try {
    await fs.promises.access(path.resolve(filePath), fs.constants.F_OK);
    return true;          // no error → file exists (and is reachable)
  } catch {
    return false;         // error → file missing or inaccessible
  }
}

const refreshCmd = {
  command: '$0',
  desc: 'Insert Polarity user information into an elasticsearch index',
  builder: (yargs) => {
    return yargs
      .option('polarityEnvFilePath', {
        type: 'string',
        default: '/app/.env',
        nargs: 1,
        describe: 'Path to your Polarity Server .env file'
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
      })
      .option('testOutput', {
        type: 'boolean',
        default: false,
        describe: 'If true, the output from the users table will be logged.  No interaction with Elastic will occur.'
      });
  },
  handler: async (argv) => {
    const {
      polarityEnvFilePath,
      elasticUrl,
      elasticUsername,
      elasticPassword,
      elasticApiKey,
      elasticIndex,
      generateIndex,
      testOutput
    } = argv;
    
    const envFileExists = await fileExists(polarityEnvFilePath);
    if(!envFileExists){
      log.error(`The env file ${polarityEnvFilePath} does not exist or cannot be read`);
      return;
    }      
    
    
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
      const users = await getUserStats(polarityEnvFilePath, log);
      log.info(`Fetched info for ${users.length} users`);
      
      if(testOutput){
        log.info({ users });
        return;
      }
      
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
