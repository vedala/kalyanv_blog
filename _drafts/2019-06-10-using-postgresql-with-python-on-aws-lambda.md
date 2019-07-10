---
title: Using PostgreSQL With Python on AWS Lambda
---
While working on a personal project for setting up a basic data pipeline, described
[here]({{ site.baseurl }}
{% link _posts/2018-09-12-build-a-blog-using-jekyll-and-deploy-to-github-pages-and-set-custom-domain.md %}),
I ran into an issue where psycopg2 library was not available
on AWS Lambda. My lambda function uses this library to access data stored in
an PostgreSQL RDS instance. It is understandable that AMI image does not include
libraries such as psycopg2. In this blog post, I describe the steps that I took
to get my Lambda function working.

## 1. Create deployment package as described in AWS documentation

In this section, we follow the instructions as outlined in the AWS documentation
[here](https://docs.aws.amazon.com/lambda/latest/dg/lambda-python-how-to-create-deployment-package.html). We use the virtual environment method.

### Setup python virtual environment on development machine

On your development machine (Mac in our case), create a python virtual environment (we are
using python 3.7.3, the latest version available at the time of writing):

```
$ python3.7 -m venv venv
```

Activate the virtual environment

```
$ source venv/bin/activate
```

Install psycopg2 library in the virtual environment. Although there are many libraries
available for accessing postgreSQL from python, psycopg2 is the most widely used.

```
$ pip install psycopg2
```

### Create python lambda function script

Create a directory that will be used to hold the lambda script and dependency library:

```
$ mkdir pypg_lambda
```

In the directory, create the lambda script:

```
$ cd pypg_lambda
$ touch my_lambda.py
```

Add following as contents of the file `my_lambda.py`:

**my_lambda.py**
```
import sys
import logging
import psycopg2
import json
import os

# rds settings
rds_host  = os.environ.get('RDS_HOST')
rds_username = os.environ.get('RDS_USERNAME')
rds_user_pwd = os.environ.get('RDS_USER_PWD')
rds_db_name = os.environ.get('RDS_DB_NAME')

logger = logging.getLogger()
logger.setLevel(logging.INFO)

try:
    conn_string = "host=%s user=%s password=%s dbname=%s" % \
                    (rds_host, rds_username, rds_user_pwd, rds_db_name)
    conn = psycopg2.connect(conn_string)
except:
    logger.error("ERROR: Could not connect to Postgres instance.")
    sys.exit()

logger.info("SUCCESS: Connection to RDS Postgres instance succeeded")

def handler(event, context):

    query = """select name, salary
            from mydatabase.employee
            order by 1"""

    with conn.cursor() as cur:
        rows = []
        cur.execute(query)
        for row in cur:
            rows.append(row)

    return { 'statusCode': 200, 'body': rows }
```

The above file is an example of a very simple lambda function that fetches
records from a table and returns them when the lambda function is invoked.

You need to create a AWS RDS PostgreSQL instance with a database `mydatabase`.
In this database, a table `employee` needs to be created.


```
-- Employee table


```

### Create deployment package

Enter `pypg_lambda` directory (if not already there):

```
$ cd pypg_lambda
```

Copy the psycopg2 installed package to `pypg_lambda` directory:

```
$ cp -r ~/venv/lib/python3.7/site-packages/psycopg2 .
```

In the above command, we created the virtual environment in the home directory
of our development machine. Modify the `cp` command to suit your directory's
location.

Create the deployment package:

```
$ zip -r ../my_lambda.zip .
```

### Create lambda function using the deployment package

Set environment variables related to RDS database instance

```
$
```

Set environment variables related to VPC for use with `aws` cli command.
We can avoid this step by directly typing the details into the `aws` command.
But setting these details as environment variables makes entering the
command less tedious.

```
$
```

Create the lambda function:

```
$ aws lambda create-function --region "us-east-1" \
    --function-name "mylambda"       \
    --zip-file fileb://mylambda.zip  \
    --handler "mylambda.handler"     \
    --role "${role_arn}"             \
    --runtime "python3.7"            \
    --timeout 60                     \
    --vpc-config SubnetIds="${subnet_ids}",SecurityGroupIds="${sec_group_id}" \
    --environment Variables="{RDS_HOST=${RDS_HOST},           \
                              RDS_USERNAME=${RDS_USERNAME},   \
                              RDS_USER_PWD=${RDS_USER_PWD},   \
                              RDS_DB_NAME=${RDS_DB_NAME}}"
```

Invoke the lambda function:

```
$ aws lambda invoke --function-name mylambda  ~/lambda_output.txt
```

Following error is encountered on invocation of the lambda function:

`Unable to import module 'mylambda': No module named 'psycopg2._psycopg'`

The psycopg2 folder under the deployment package folder contains the following
library:

`_psycopg.cpython-37m-darwin.so`

To explore the possibility that lambda function is looking for `_psycopg.so`
file, we rename the file:

```
mv _psycopg.cpython-37m-darwin.so _psycopg.so
```

And redeploy the lambda function:
- Create a new zip archive from the deployment package folder `pypg_lambda`
- Delete lambda function using AWS interface
- Use `aws lambda create-function` to deploy using the updated deployment package

Invoking lambda function again, this time the following error is encountered:

`Runtime.ImportModuleError: Unable to import module 'mylambda': /var/task/psycopg2/_psycopg.so: invalid ELF header`

We describe how we resolved this error in the next section.

## 2. Resolving "invalid ELF header" error

### Background

As suggested [here](https://tg4.solutions/how-to-resolve-invalid-elf-header-error/)
and [here](https://stackoverflow.com/a/34885155/3137099),
the "invalid ELF header" error happens due to a mismatch between
the machine where the library was installed and the machine it is being
executed. We installed the `psycopg2` library on a Mac, whereas the execution
environment is AWS Lambda's environment, which is the Amazon Linux AMI.

To remove the mismatch, we need to install the `psycopg2` library in the same
envionment as the AWS Lambda function run in. The simplest approach is to spin
up an EC2 instance and install `psycopg2` library in a virtual environment there.
Described below are steps we followed to do this.

### Create an EC2 instance and connect to it

Launch an EC2 instance on AWS and connect to the instance (replace with ip
address of your instance):

```
$ ssh -i <aws-key-file> ec2-user@192.0.2.0
```

### Setting up virtual environment on an EC2 instance

Python3 is not available on Amazon Linux, so we need to install it. The following
commands will install python3 and other dependencies needed for creating
a virtual environment and installing `pyscopg2` within the virtual environment:

```
$ sudo yum install python3
$ sudo yum install gcc python-setuptools python-devel python3-devel
$ sudo yum install postgresql-devel
```

The above install python 3.7.3, which is the latest version available at
the time of writing.

As desribed in the previous section, create the virtual environment, activate
it and install `psycopg2` library:

```
$ python3 -m venv venv
$ source venv/bin/activate
$ pip install psycopg2
```

We now have the `psycopg2` package file we need in the virtual environment. We
need to copy the package from the EC2 instance to the development machine. Run
the following command on your development machine to copy the package directory
to the local machine:

```
$ scp -r -i <aws-key-file> \
    ec2-user@192.0.2.0:~/venv/lib/python3.7/site-packages/psycopg2 .
```

### Create the lambda function and invoke it

Create the lambda function using the `aws lambda create-function` command
as shown previously and invoke it.

### A different error encountered

Running the lambda function generates the following error:

`Runtime.ImportModuleError: Unable to import module 'mylambda': libpq.so.5: cannot open shared object file: No such file or directory`

While we are still encountering an error, we are no longer running into
the "invalid ELF header". So we can consider the "invalid ELF header" to be
resolved and let's work on resolving the new error.

## 3. Resolving "libpq.so.x cannot open shared object file" error

### Background
- references, why this needed
- mention jkehler reference has library build on AMI image that can be downloaded and used directly. But that library is from 2 years ago, so it works with python 3.6 but not python 3.7.
- pick postgresql version for source code
- pick psycopg2 version for source code (why = latest, because working on Mac dev machine)
- Amazon started supporting python 3.7 in AWS Lambda since November, 2018. So use newer versions of postgresql and psycopg2.

### Compiling postgresql from source code

### Compiling psycopg2 from source code and statically linking

## References
- AWS document on how to create deployment package in Python
    - [AWS Lambda Deployment Package in Python](https://docs.aws.amazon.com/lambda/latest/dg/lambda-python-how-to-create-deployment-package.html)
- Resolving "invalid ELF header" error
    - [TG4 Solutions blog post - How to resolve an invalid ELF header error quickly](https://tg4.solutions/how-to-resolve-invalid-elf-header-error/)
    - [Stackoverflow question](https://stackoverflow.com/a/34885155/3137099)
    - [Amazon Compute Blog post](https://aws.amazon.com/blogs/compute/nodejs-packages-in-lambda/) - this post is mainly about node.js, but it talks about building libraries using an EC2 instance.
- AWS Lamdba supports python 3.7
    - [AWS Compute Blog post](https://aws.amazon.com/about-aws/whats-new/2018/11/aws-lambda-supports-python-37/)
- Resolving "libpq.so: cannot open shared object file" error
    - [AWS forum post](https://forums.aws.amazon.com/thread.jspa?messageID=680192) - this post contains discussion about this issue and a solution suggested by forum participant.
    - [Github project with steps on building psycopg2 library](https://github.com/jkehler/awslambda-psycopg2) - this Github project is created by the forum participant mentioned in the previous reference. This project provides detailed steps to build postgresql and psycopg2 from source code. If you are using python 3.6, this project contains ready-to-use psycopg2 library built for AWS Lambda.
