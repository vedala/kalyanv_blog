---
title: Deploying an application to AWS using AWS CLI, Part 2 - AWS Account, IAM User & AWS CLI Installation
---

## AWS Root Account and IAM User
* Create a new AWS root account
* Configure the root account
    * Setup MFA
    * Setup billing alert

## IAM User
* Create IAM user
    * Create an IAM user with "AdministratorAccess" policy
    * Give it some name, e.g. Developers
    * Allow both console and programmatic access for the user
    * Save credentials CSV file to local machine

## Install AWS CLI
* Installation basics
    * Installing on macOS for a single user
    * Installing version 2
    * Used this guide as reference [AWS CLI Users Guide](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-welcome.html)
* Installation Steps
    * Following the instructions under _Installing the AWS CLI_ --> _AWS CLI version 2_ --> _macOS_

    * Copy and save the provided XML template to a file. This XML ile is used to specify the location where we want aws-cli to be installed. I wanted to install the AWS CLI executables in `bin` folder under my home directory. The XML after modifications looks as follows (I only modified the location of the directory):

        ```
        <?xml version="1.0" encoding="UTF-8"?>
        <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
        <plist version="1.0">
        <array>
            <dict>
            <key>choiceAttribute</key>
            <string>customLocation</string>
            <key>attributeSetting</key>
            <string>/Users/your_home_directory/bin</string>
            <key>choiceIdentifier</key>
            <string>default</string>
            </dict>
        </array>
        </plist>
        ```

    * Download install package

        ```
        curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
        ```

    * Run installer command, specify the XML file that you created in the previous steps:

        ```
        installer -pkg AWSCLIV2.pkg \
            -target CurrentUserHomeDirectory \
            -applyChoiceChangesXML choices.xml
        ```

    * Create symlinks within a folder that may contain all your executables or symlinks to executables. I created a folder to hold all my executable links. Since I created a new folder to hold my executable links, I adding this folder to PATH variable in my .bash_profile:

        ```
        mkdir ~/executable_links
        ```

        **Add to ~/.bash_profile**:

        ```
        PATH=$HOME/executable_links:$PATH
        ```

        Create symlinks:

        ```
        cd ~/executable_links
        ln -s $HOME/bin/aws-cli/aws .
        ln -s $HOME/bin/aws-cli/aws-completer .
        ```

    * Configure AWS CLI to use the IAM user credentials that we downloaded in an earlier step:
        * Run command `aws configure`:
            * Enter Access Key ID
            * Enter Secret Access Key
            * Enter region

## Install jq

If not already present, install `jq` utility on your local machine from the [jq website](https://stedolan.github.io/jq/download/).

## Create Application Repository
