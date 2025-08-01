/*
 * Copyright (c) 2016-2025. ThreatConnect Inc.
 * All rights reserved
 */
const {Client} = require('pg');

async function getUsersFromDatabase(polarityEnvFilePath, log) {
    require('dotenv').config({path: polarityEnvFilePath});
    let pgClient;
    let query;

    try {
        pgClient = new Client({
            user: process.env.POLARITY_DB_USER,
            host: process.env.POLARITY_DB_HOST,
            database: process.env.POLARITY_DB_DATABASE,
            password: process.env.POLARITY_DB_PASSWORD,
            port: process.env.POLARITY_DB_PORT
        });

        await pgClient.connect();
        query = await pgClient.query('SELECT id, username, email, last_seen_at, enabled, force_password_reset, created_on, is_admin FROM polarity.users');
    } catch (error) {
        log.error(error);
    } finally {
        if (pgClient) {
            await pgClient.end();
        }
        return Array.isArray(query.rows) ? query.rows : [];
    }
}

async function getUserStats(polarityEnvFilePath, log) {
    const users = await getUsersFromDatabase(polarityEnvFilePath, log);

    const mergedUsers = users.reduce((accum, user) => {
        const now = new Date();
        let activityDays = null;

        if (user.last_seen_at) {
            const activityDiff = now.getTime() - user.last_seen_at.getTime();
            activityDays = Math.ceil(activityDiff / (1000 * 3600 * 24));
        }

        accum.push({
            userId: user.id,
            username: user.username,
            email: user.email,
            enabled: user.enabled,
            isAdmin: user.is_admin,
            forcePasswordReset: user.force_password_reset,
            createdOn: user.created_on,
            lastActivity: user.last_seen_at,
            lastActiveDaysAgo: activityDays
        });
        return accum;
    }, []);

    return mergedUsers;
}

process.on('uncaughtException', function (err) {
    console.error(err, 'Uncaught Exception Thrown');
});

module.exports = {
    getUserStats
};
