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

### Create lambda function using the deployment package

## 2. Resolving "Invalid ELF header" error

### Background

### Setting up virtual environment on an EC2 instance

### Invoke lambda function, a different error encountered

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
