---
title: Deploying an application to AWS using AWS CLI, Part 2 - AWS Account, IAM User & Application Repository
---

## AWS Root Account and IAM User
- Create a new AWS root account
- Configure the root account
    - Setup MFA
    - Setup billing alert

## IAM User
- Create IAM user
    - Create an IAM user with "AdministratorAccess" policy.
    - Give it some name, e.g. Developers
    - Allow both console and programmatic access for the user
    - Save credentials CSV file to local machine

## Install AWS CLI
- <A few points>
    - Installing on macOS for a single user
    - Installing version 2
    - Used this guide as reference [AWS CLI Users Guide](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-welcome.html)
- Installation Steps
    - Create an XL file to specify the location where we want aws-cli to be installed
    - Download install package
```
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
```
    - Run installer command, specify the XML created in the previous steps:
```
installer -pkg AWSCLIV2.pkg \
    -target CurrentUserHomeDirectory \
    -applyChoiceChangesXML choices.xml
```
    - Create symlinks within a folder that may contain all your executables or symlinks to executables
    - Configure AWS CLI to use the IAM user credentials that we created in an earlier step:
        - Run command `aws configure`:
            - Enter Access Key ID
            - Enter Secret Access Key
            - Enter region

## Install jq

## Create Application Repository
