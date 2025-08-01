const AD = require('activedirectory');

class ActiveDirectory {
    constructor(connectionOptions, log) {
        this.log = log;

        try {
            this.client = new AD(connectionOptions);
        } catch (e) {
            this.log.error({error: e}, "Error creating AD client.");
        }
    }
    authenticate(username, password, cb) {
        this.log.info({username: username, password:password}, 'Running AD.authenticate');

        //perform the authentication
        this.client.authenticate(username, password, function (err) {
            if (err) {
                cb(err);
                return;
            }

            cb(null, true);
        });
    }
    groupExists(groupName, cb){
        this.log.info({groupName:groupName}, 'Running AD.groupExists');

        this.client.groupExists({log: this.log}, groupName, function (err, exists) {
            if (err) {
                return cb(err);
            }

            cb(null, exists);
        });
    }
    isMemberOf(username, groupName, cb) {
        this.log.info({groupName:groupName}, 'Running AD.isMemberOf');

        this.client.isUserMemberOf({log: this.log}, username, groupName, function (err, isMember) {
            if (err) {
                return cb(err);
            }

            cb(null, isMember);
        });
    }
}

module.exports = ActiveDirectory;

