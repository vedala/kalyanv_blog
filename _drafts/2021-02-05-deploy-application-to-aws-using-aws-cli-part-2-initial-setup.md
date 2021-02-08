---
title: Deploying an application to AWS using AWS CLI, Part 2 - Level-1
---

## Application

## AWS Root Account and IAM User
- Create a new AWS root account
- Configure the root account
    - Setup MFA
    - Setup billing alert
- Create IAM user
    - Create an IAM user with "AdministratorAccess" policy.
    - Give it some name, e.g. Developers
    - Allow both console and programmatic access for the user

## Install AWS CLI
- <A few points>
    - Installing on macOS for a single user
    - Installing version 2
    - Used this guide as reference [AWS CLI Users Guide](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-welcome.html)
