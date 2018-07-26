# Active Directory Tester

## Overview

The Active Directory Tester is a command line tool for testing AD settings.  It provides a simple way to test various AD configurations if you are having trouble configuring AD from within the Polarity application.  The AD Tester tool provides extensive debug logging to assist with configuration.  Once you have determined the correct settings you can apply the settings to your Polarity server.

## Installation

Clone the repo onto your Polarity Server

```
git clone git@github.com:breachintelligence/active-directory-tester.git
```

Run `npm install` from inside the cloned active-directory-tester folder


```
npm install
```

If you cannot install the dependencies on your sever using `npm isntall` then you can download the full release from the github repo here
https://github.com/breachintelligence/active-directory-tester/releases

After downloading the full release, upload the `tgz` file to your Polarity Server and untar it

```
tag -xvzf <file>
```

Note that to run the below commands you may need to make the `active-directory-tester.sh` script executable

```
chmod a+x active-directory-tester.sh
```

## Commands

### Show Help

./active-directory-tester.sh --help

### Test Authentication for a User

```
./active-directory-tester.sh auth --url <url>  --serviceUser <serviceUser>  --servicePassword <servicePassword>  --baseDN <baseND>  --username <username>  --password <password>
```

### Test If a Group Exists

```
./active-directory-tester.sh groupExists --url ldap://54.152.51.48 --serviceUser <serviceUser>  --servicePassword <servicePassword>  --baseDN <baseND>  --group <group>
```

### Test if User is Member of a Group

```
./active-directory-tester.sh isMember --url <url>  --serviceUser <serviceUser>  --servicePassword <servicePassword>  --baseDN <baseND>  --username <username>  --group <group>
```

> Note that <serviceUser> and <username> options should use the full username (e.g., user@org.com, ORG/user).  The AD tester does not make use of the Principal Name Pattern option found within Polarity.
