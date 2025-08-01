# User Stats to Elastic

This utility was developed for DHS.  It's a command line utility that lets DHS push user stats into an Elasticsearch index for their dashboards.  The key reason they wanted this ability was because they wanted to be able to see which users were not active in the system (i.e., never logged in) and thus could not use telemetry data to determine this.

This utility runs on the v5 server and requires Node12+ to work.

```
Usage: ./user-statis-to-elastic <command> [options]

Options:
  --help                 Show help  [boolean]
  --version              Show version number  [boolean]
  --polarityEnvFilePath  Path to your Polarity Server .env file  [string] [default: "/app/.env"]
  --elasticUrl           Elasticsearch REST API Url  [string] [required]
  --elasticIndex         Elasticsearch Index to Create and Modify  [string] [default: "polarity_users"]
  --elasticUsername      Username to authenticate to Elasticsearch as  [string]
  --elasticPassword      Password for provided elasticUsername  [string]
  --elasticApiKey        API Key to authenticate as (no username and password required)  [string]
  --generateIndex        If true, any existing index will be deleted and a new index will be created before populating it  [boolean] [default: false]
  --testOutput           If true, the output from the users table will be logged.  No interaction with Elastic will occur.  [boolean] [default: false]
```