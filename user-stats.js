/*
 * Copyright (c) 2016-2022. Breach Intelligence, Inc. (DBA Polarity)
 * All rights reserved
 */

const { Client } = require('pg');
const path = require('path');

async function getUsersFromDatabase(config) {
  let pgClient;
  let query;

  try {
    pgClient = new Client({
      user: config.polarity.postgres.user,
      host: config.polarity.postgres.host,
      database: config.polarity.postgres.database,
      password: config.polarity.postgres.password,
      port: config.polarity.postgres.port
    });

    await pgClient.connect();
    query = await pgClient.query(
      'SELECT id, username, email, last_login, enabled, force_password_reset, created_on, is_admin FROM polarity.users'
    );
  } finally {
    if (pgClient) {
      await pgClient.end();
    }
    return Array.isArray(query.rows) ? query.rows : [];
  }
}

async function getUserStats(polarityConfig, polarityServerPath) {
  require('dotenv').config({ path: path.join(polarityServerPath, '.env') });

  const config = require(polarityConfig);
  const sessionCache = require(path.join(polarityServerPath, '/lib/session-cache'));

  const users = await getUsersFromDatabase(config);
  const userIds = users.map((user) => user.id);

  const lastSeenAtHash = await sessionCache.getLastSeenAtForUsers(userIds.map((id) => `${id}:last_seen`));

  const mergedUsers = users.reduce((accum, user) => {
    const lastActivity = lastSeenAtHash[user.id.toString()]
      ? new Date(lastSeenAtHash[user.id.toString()].lastSeenAt)
      : null;
    const hasActivity = lastActivity !== null ? true : false;
    const hasLogin = user.last_login !== null;
    const now = new Date();
    let activityDays = null;
    let loginDays = null;

    if (hasActivity) {
      const activityDiff = now.getTime() - lastActivity.getTime();
      activityDays = Math.ceil(activityDiff / (1000 * 3600 * 24));
    }

    if (hasLogin) {
      const loginDiff = now.getTime() - user.last_login.getTime();
      loginDays = Math.ceil(loginDiff / (1000 * 3600 * 24));
    }

    accum.push({
      userId: user.id,
      username: user.username,
      email: user.email,
      enabled: user.enabled,
      isAdmin: user.is_admin,
      forcePasswordReset: user.force_password_reset,
      lastLogin: user.last_login ? user.last_login.toISOString() : null,
      createdOn: user.created_on ? user.created_on.toISOString() : null,
      lastActivity: lastActivity ? lastActivity.toISOString() : null,
      loginDaysAgo: loginDays,
      lastActiveDaysAgo: activityDays > loginDays ? activityDays : loginDays
    });
    return accum;
  }, []);

  // const last30Users = mergedUsers.filter(user => {
  //   return (user.client_days !== null && user.client_days <= 31) || (user.login_days !== null && user.login_days <= 31);
  // });
  return mergedUsers;
}

process.on('uncaughtException', function (err) {
  console.error(err, 'Uncaught Exception Thrown');
});

module.exports = {
  getUserStats
};
