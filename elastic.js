const request = require('postman-request');

class RequestError extends Error {
  constructor(detail, statusCode, body) {
    super(detail);
    this.detail = detail;
    this.name = 'requestError';
    this.statusCode = statusCode;
    this.body = body;
  }
}

class NetworkError extends Error {
  constructor(detail, err) {
    super(detail);
    this.detail = detail;
    this.err = err;
  }
}

function getAuthHeader(elasticOptions, headers = {}) {
  if (elasticOptions.username && elasticOptions.password) {
    return {
      ...headers,
      Authorization: `Basic ${Buffer.from(`${elasticOptions.username}:${elasticOptions.password}`).toString('base64')}`
    };
  } else if (elasticOptions.apiKey) {
    return {
      ...headers,
      Authorization: `ApiKey ${elasticOptions.apiKey}`
    };
  } else {
    return {
      ...headers
    };
  }
}

async function deleteIndex(index, elasticOptions) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      uri: `${elasticOptions.url}/${index}`,
      method: 'DELETE',
      headers: getAuthHeader(elasticOptions),
      json: true
    };
    request(requestOptions, (err, response, body) => {
      if (err) {
        return reject(new NetworkError(`Unexpected Network Error encountered when deleting index`, err));
      }

      if (response.statusCode === 200 || response.statusCode === 404) {
        // 404 means the index didn't exist
        resolve();
      } else {
        reject(
          new RequestError(
            `Unexpected HTTP statusCode (${response.statusCode}) encountered when deleting index`,
            response.statusCode,
            body
          )
        );
      }
    });
  });
}

async function createMapping(index, elasticOptions) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      uri: `${elasticOptions.url}/${index}`,
      method: 'PUT',
      headers: getAuthHeader(elasticOptions),
      body: {
        mappings: {
          properties: {
            userId: {
              type: 'integer'
            },
            username: {
              type: 'keyword'
            },
            email: {
              type: 'keyword'
            },
            enabled: {
              type: 'boolean'
            },
            isAdmin: {
              type: 'boolean'
            },
            forcePasswordReset: {
              type: 'boolean'
            },
            lastLogin: {
              type: 'date'
            },
            createdOn: {
              type: 'date'
            },
            lastActivity: {
              type: 'date'
            },
            loginDaysAgo: {
              type: 'integer'
            },
            lastActiveDaysAgo: {
              type: 'integer'
            }
          }
        }
      },
      json: true
    };

    request(requestOptions, (err, response, body) => {
      if (err) {
        return reject(new NetworkError(`Unexpected Network Error encountered when adding user mapping`, err));
      }

      if (response.statusCode === 200) {
        resolve();
      } else {
        reject(
          new RequestError(
            `Unexpected HTTP statusCode (${response.statusCode}) encountered when adding user mapping`,
            response.statusCode,
            body
          )
        );
      }
    });
  });
}

async function insertDocument(index, user, elasticOptions) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      uri: `${elasticOptions.url}/${index}/_doc/${user.userId}`,
      method: 'PUT',
      headers: getAuthHeader(elasticOptions),
      body: user,
      json: true
    };

    request(requestOptions, (err, response, body) => {
      if (err) {
        return reject(new NetworkError(`Unexpected Network Error encountered when creating user doc`, err));
      }

      if (response.statusCode === 201 || response.statusCode === 200 || response.statusCode === 400) {
        resolve();
      } else {
        console.error(body);
        reject(
          new RequestError(
            `Unexpected HTTP statusCode (${response.statusCode}) encountered when creating user doc`,
            response.statusCode,
            body
          )
        );
      }
    });
  });
}

module.exports = {
  insertDocument,
  deleteIndex,
  createMapping
};
