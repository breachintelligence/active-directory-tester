const ActiveDirectory = require('./active-directory');
const bunyan = require('bunyan');
const log = bunyan.createLogger({
    name: 'AD',
    level: 'trace'
});

const authCmd = {
    command: 'auth',
    desc: 'Test Authentication against the given LDAP server using the provided "username" and "password"',
    builder: (yargs) => {
        return yargs
            .option('username', {
                type: 'string',
                demand: 'You must provide the "username" to authenticate',
                nargs: 1,
                describe: 'Username to authenticate'
            })
            .option('password', {
                type: 'string',
                demand: 'You must provide the "password" for the username to authenticate',
                nargs: 1,
                describe: 'Password to authenticate <username> with'
            })
    },
    handler: (argv) => {
        let connectionOptions = getConnectionObject(argv);
        log.info({connection: connectionOptions}, "Starting Authenticate Call");
        const ad = new ActiveDirectory(connectionOptions, log);
        ad.authenticate(argv.username, argv.password, function(err, isAuthenticated){
            if(err){
                log.error({err:err}, 'Error running auth command');
            }else{
                log.info({username: argv.username, isAuthenticated: isAuthenticated}, 'Finished authentication command');
                if(isAuthenticated){
                    log.info('>> ' + argv.username + ' is authenticated');
                }else{
                    log.info('>> ' + argv.username + ' is NOT authenticated');
                }
            }
        })
    }
};

const groupExistsCmd = {
    command: 'groupExists',
    desc: 'Test whether the given group exists',
    builder: (yargs) => {
        return yargs
            .option('group', {
                type: 'string',
                demand: 'group',
                nargs: 1,
                describe: 'Group name to test existence of'
            })
    },
    handler: (argv) => {
        let connectionOptions = getConnectionObject(argv);
        log.info({connection: connectionOptions}, "Starting Authenticate Call");
        const ad = new ActiveDirectory(connectionOptions, log);
        ad.groupExists(argv.group, function(err, exists){
            if(err){
                log.error({err:err}, 'Error running groupExists command');
            }else{
                log.info(argv.group + ' exists: ' + exists);
                if(exists){
                    log.info('>> Group [' + argv.group + '] does exist');
                }else{
                    log.info('>> Group [' + argv.group + '] does NOT exist');
                }
            }
        })
    }
};

const isMemberCmd = {
    command: 'isMember',
    desc: 'Test whether or not the given "username" is a member of the given "group"',
    builder: (yargs) => {
        return yargs
            .option('username', {
                type: 'string',
                demand: 'You must provide the "username" to test group membership of',
                nargs: 1,
                describe: 'Username you want to test group membership of'
            })
            .option('group', {
                type: 'string',
                demand: 'You must provide the "group" that you want to test membership in',
                nargs: 1,
                describe: 'Group name to test membership in'
            })
    },
    handler: (argv) => {
        let connectionOptions = getConnectionObject(argv);
        log.info({connection: connectionOptions}, "Starting isMemberOf Call");
        const ad = new ActiveDirectory(connectionOptions, log);
        ad.isMemberOf(argv.username, argv.group, function(err, isMember){
            if(err){
                log.error({err:err}, 'Error running isMemberOf command');
            }else{
                log.info({username: argv.username, isMember: isMember}, 'Finished isMemberOf command');
                if(isMember){
                    log.info('>> ' + argv.username + ' IS a member of ' + argv.group);
                }else{
                    log.info('>> ' + argv.username + ' is NOT a member of ' + argv.group);
                }
            }
        })
    }
};

const argv = require('yargs')
    .usage('Usage: $0 <command> [options]')
    .command(authCmd)
    .command(groupExistsCmd)
    .command(isMemberCmd)
    .option('url', {
        alias: 'u',
        type: 'string',
        nargs: 1,
        describe: 'Server URL (include ldaps:// or ldap://)',
        demand: 'You must provide the "url" argument'
    })
    .option('serviceUser', {
        alias: 's',
        type: 'string',
        nargs: 1,
        describe: 'Service Account Username',
        demand: 'You must provide the "serviceUser" argument'
    })
    .option('servicePassword', {
        alias: 'p',
        type: 'string',
        nargs: 1,
        describe: 'Service Account Password',
        demand: 'You must provide the "servicePassword" argument'
    })
    .option('baseDN', {
        alias: 'b',
        type: 'string',
        nargs: 1,
        describe: 'The base domain name (base DN)  (e.g., dc=domain,dc-com)',
        demand: 'You must provide the "baseDN" argument'
    })
    .option('allowUnauthorized', {
        type: 'boolean',
        nargs: 0,
        describe: 'If set, the AD connection will ignore SSL errors'
    })
    .help()
    .wrap(null)
    .version("Active Directory Tester v" + require('./package.json').version)
    // help
    .epilog('(C) 2018 Polarity')
    .argv;



function getConnectionObject(argv){
    return {
        url: argv.url,
        username: argv.serviceUser,
        password: argv.servicePassword,
        baseDN: argv.baseDN,
        tlsOptions: {
            rejectUnauthorized: argv.allowUnauthorized ? false : true
        }
    }
}
