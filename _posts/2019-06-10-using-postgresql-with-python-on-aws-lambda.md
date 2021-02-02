---
title: Using PostgreSQL With Python on AWS Lambda
---
While working on a personal project for setting up a basic data pipeline, described
[here]({{ site.baseurl }}
{% link _posts/2019-05-23-tutorial-a-basic-data-pipeline.md %}),
I ran into an issue where psycopg2 library was not available
on AWS Lambda. My lambda function uses this library to access data stored in
an PostgreSQL RDS instance. It is understandable that AMI image does not include
libraries such as psycopg2, it is the lambda function developer's job to include
any dependency libraries that the lambda function needs. AWS provides documentation
[here](https://docs.aws.amazon.com/lambda/latest/dg/lambda-python-how-to-create-deployment-package.html)
on deploying lambda functions with dependency libraries that are not
available in the AMI image.

In this blog post, I start with the method outlined
in the AWS documentation on Lambda deployment package, describe issues
encountered and the steps I took to resolve the issues.

## 1. Create deployment package as described in AWS documentation

In this section, we follow the instructions as outlined in the AWS documentation
mentioned above.  We use the virtual environment method.

### Setup python virtual environment on development machine

On your development machine (Mac in our case), create a python virtual environment
(we are using python 3.7.3, the latest version available at the time of writing).
In this post, we are assuming you will create the virtual environment directory
under your home directory.

```
$ python3.7 -m venv my_venv
```

Activate the virtual environment

```
$ source my_venv/bin/activate
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

In the directory, create a file to hold your lambda script:

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

    query = """select id, name, job_title
            from employee
            order by 1"""

    with conn.cursor() as cur:
        rows = []
        cur.execute(query)
        for row in cur:
            rows.append(row)

    return { 'statusCode': 200, 'body': rows }
```

The above file is an example of a very simple lambda function that fetches
rows from a table and returns them when the lambda function is invoked. This
program has been adapted from code sample in
[this](https://docs.aws.amazon.com/lambda/latest/dg/vpc-rds.html)
tutorial in AWS Lambda documentation.

You need to create a AWS RDS PostgreSQL instance with a database `mydatabase`.
In this database, a table `employee` needs to be created.


```
-- Employee table

CREATE TABLE employee (
  id        INTEGER     NOT NULL,
  name      VARCHAR(40) NOT NULL,
  job_title VARCHAR(40) NOT NULL,
  PRIMARY KEY (id)
);

```

Insert a few rows into the `employee` table:

```
INSERT INTO employee(id, name, job_title) VALUES
    (1, 'Jack', 'Software Engineer'),
    (2, 'Jill', 'Senior Software Engineer'),
    (3, 'Joe', 'Engineering Manager');
```

### Create deployment package

Enter `pypg_lambda` directory (if not already there):

```
$ cd pypg_lambda
```

Copy the psycopg2 package installed within the virtual environment to
`pypg_lambda` directory:

```
$ cp -r ~/my_venv/lib/python3.7/site-packages/psycopg2 .
```

As mentioned previously, we created the virtual environment in the home directory
of our development machine. Modify the `cp` command to suit your directory's
location.

Create the deployment package zip archive:

```
$ zip -r ../my_lambda.zip .
```

### Create lambda function using the deployment package

Set environment variables related to RDS database instance

```
$ export RDS_HOST=<database host url>
$ export RDS_USERNAME=<username>
$ export RDS_USER_PWD=<password>
$ export RDS_DB_NAME=mydatabase
```

Set environment variables related to VPC for use with `aws` cli command.
We can avoid this step by directly typing the details into the `aws` command.
But setting these details as environment variables makes entering the
command less tedious.

```
$ export role_arn=<AWS role arn>
$ export subnet_ids="subnet-xxxxxx,subnet-xxxxxx,..."  # comma separated list
$ export sec_group_id=<security group id>
```

Create the lambda function:

```
$ aws lambda create-function --region "us-east-1" \
    --function-name "mylambda"       \
    --zip-file fileb://mylambda.zip  \
    --handler "my_lambda.handler"     \
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

The psycopg2 folder under the deployment package folder on our machine contains
the following library:

`_psycopg.cpython-37m-darwin.so`

To explore the possibility that lambda function is looking for `_psycopg.so`
file, we rename the file:

```
mv _psycopg.cpython-37m-darwin.so _psycopg.so
```

And redeploy the lambda function:
- Copy the psycopg2 directory from the virtual environment to `pypg_lambda` directory
- Create a new zip archive from the deployment package folder `pypg_lambda`
- Delete lambda function using AWS interface
- Use `aws lambda create-function` to deploy using the updated deployment package

Invoked lambda function again, this time the following error is encountered:

`Runtime.ImportModuleError: Unable to import module 'mylambda': /var/task/psycopg2/_psycopg.so: invalid ELF header`

We describe how we resolved this error in the next section.

## 2. Resolving "invalid ELF header" error

### Background

As suggested [here](https://tg4.solutions/how-to-resolve-invalid-elf-header-error/)
and [here](https://stackoverflow.com/a/34885155/3137099),
the "invalid ELF header" error happens due to a mismatch between
the machine where the lambda function deployment package is created and the machine
where the lambda function is executed. We built the deployment package on a Mac,
whereas the execution environment is AWS Lambda's environment, which is the
Amazon Linux AMI.

To remove the mismatch, we need to create the deployment package in the same
envionment as the AWS Lambda function runs in. The simplest approach is to spin
up an EC2 instance, install `psycopg2` library in a virtual environment there.
Described below are steps we followed to do this:

### Create an EC2 instance and connect to it

Launch an EC2 instance on AWS and connect to the instance (replace with the ip
address of your instance):

```
$ ssh -i <aws-key-file> ec2-user@192.0.2.0
```

### Setting up virtual environment on an EC2 instance

Python3 is not available on Amazon Linux, so we need to install it. The following
commands will install python3 and other dependencies needed for creating
a virtual environment and installing `pyscopg2` within the virtual environment.
We are also installing the C compiler here, which we need in a later step:

```
$ sudo yum install python3
$ sudo yum install gcc python-setuptools python-devel python3-devel
$ sudo yum install postgresql-devel
```

The above installs python 3.7.3, which is the latest version available at
the time of writing.

As described in the previous section, create a virtual environment, activate
it and install `psycopg2` library:

```
$ python3 -m venv my_venv
$ source my_venv/bin/activate
$ pip install psycopg2
```

We now have the `psycopg2` package file we need in the virtual environment. You
need to copy the package from the EC2 instance to your development machine.

Clean up you deployment package working directory `pypg_lambda`:

```
$ cd pypg_lambda
$ rm -r psycopg2
```

Run the following command on your development machine to copy the package
directory to the local machine:

```
$ scp -r -i <aws-key-file> \
    ec2-user@192.0.2.0:~/my_venv/lib/python3.7/site-packages/psycopg2 .
```

Create zip archive:

```
$ zip -r ../my_lambda.zip .
```

### Create the lambda function and invoke it

Create the lambda function using the `aws lambda create-function` command
as shown previously and invoke it.

### A different error encountered

Running the lambda function generates the following error:

`Runtime.ImportModuleError: Unable to import module 'mylambda': libpq.so.5: cannot open shared object file: No such file or directory`

While we are still encountering an error, we are no longer running into
the "invalid ELF header". So we can consider the "invalid ELF header" error to
be resolved and let's work on resolving the new error.

## 3. Resolving "libpq.so.x cannot open shared object file" error

### Background

Searching for solutions to the "cannot open shared object file" error lead us
to [this](https://forums.aws.amazon.com/thread.jspa?messageID=680192) post
on AWS forums. This forum post also provides a link to
[this](https://github.com/jkehler/awslambda-psycopg2) Github project (we will
refer to the Github project by its owner's name, Jeff Kehler, in rest of this
post).

The solution requires us to link the `libpq.so` library statically, which
in turn requires us to build postgreSQL and psycopg2 from source code.

We pick the following versions of postgreSQL and psycopg2 to build
from source code:
- picked 10.0.0 version of postgreSQL, since this is the version used by Amazon RDS instance
- picked 2.8.3 version of psycopg2, since this is the latest version available at the time of writing. I like to start with the latest version and see if it works. Then work backwards to go to older version if more recent versions don't work.

We download source code for postgreSQL and psycopg2 from the following locations:
- [postgreSQL source downloads](https://www.postgresql.org/ftp/source/v10.0/)
- [psycopg2 download page](http://initd.org/psycopg/download/), click on `source package` link to download source code for the latest version

Upload source packages to the EC2 instance:

```
$ scp -i <aws-key-file> postgresql-10.0.tar ec2-user@192.0.2.0:~
$ scp -i <aws-key-file> psycopg2-2.8.3.tar ec2-user@192.0.2.0:~
```

Once again, we will be working in the home directory on the EC2 instance. The
above commands copied the source code tar archives to EC2 instance's home
directory.

SSH into your EC2 instance and follow the steps below (as outlined in the Jeff
Kehler project).

### Compiling postgresql from source code

Extract the files from postgreSQL tar package:

```
$ tar -xf postgresql-10.0.tar 
```

Enter the extracted postgresql source directory:

```
$ cd postgresql-10.0
```

Run the following three commands:

```
$ ./configure --prefix `pwd` --without-readline --without-zlib
```

In the above command, the argument provided to the `prefix` option is the
absolute path of the postgreSQL source directory. You can type the path
(/home/ec2-user/postgresql-10.0) or simply use \`pwd\` since we are already
located in that directory.

```
$ make
```

```
$ make install
```

Next, build psycopg2 from source code. Once again, the instructions are
as outlined in the Jeff Kehler project.

### Compiling psycopg2 from source code and statically linking

Extract the files from psycopg2 tar package:

```
$ tar -xf psycopg2-2.8.3
```

Enter the extracted psycopg2 source directory:

```
$ cd psycopg2-2.8.3
```

Edit `setup.cfg` file and make following changes:
- set `pg_config` to pg_config file under postgresql source directory that was created there when postgresql was built from source code
- set static_libpq to 1

On our EC2 instance, the modified lines of setup.cfg look like:

```
...
pg_config = /home/ec2-user/postgresql-10.0/bin/pg_config
...
static_libpq = 1
```

Build the library:

```
$ python3 setup.py build
```

After completion, a build directory will be created under the psycopg-2.8.3 directory.
Under the build folder there will be folder with name similar to lib.linux-x86_64-3.7.
Under this folder there will be a folder psycopg2, which is the package we need.

Go back to your development machine and clean up the previous psycopg2
directory:

```
$ cd pypg_lambda
$ rm -r psycopg2
```

Copy the psycopg2 directory from the EC2 instance to your development machine.
Enter the following command on your development machine:

```
$ scp -r -i <aws-key-file> \
    ec2-user@192.0.2.0:psycopg2-2.8.3/build/lib.linux-x86_64-3.7/psycopg2 .
```

Note: the Jeff Kehler project contains ready-to-use psycopg2 library
build for AMI image. Since the Github repository is about 2 years old, the
package is built to work with python 3.6. If you are using python 3.6 for
the lambda function, you can download the psycopg2 directory from the project
without having to build postgresql and pyscopg2 from source code. Since we
decided to use the latest python version (3.7 as of this writing), we had to
build the library from source code ourselves.
(**Update, February 2021: Jeff Kehler project now contains pre-built psycopg2 libraries
for python 3.7 and 3.8 now.)

### Create the lambda function and invoke it

As described in the sections above, create the deployment package zip archive,
create the lambda function using the deployment package and invoke the lambda
function.

### Success!

We taste success on our third attempt. The lamdba function invocation runs
successfully and returns with the expected results:

```
{
    "statusCode": 200,
    "body": [
                [1, "Jack", "Software Engineer"],
                [2, "Jill", "Senior Software Engineer"],
                [3, "Joe", "Engineering Manager"]
            ]
}
```

## References
- AWS document on how to create deployment package in Python
    - [AWS Lambda Deployment Package in Python](https://docs.aws.amazon.com/lambda/latest/dg/lambda-python-how-to-create-deployment-package.html)
- Resolving "invalid ELF header" error
    - [TG4 Solutions blog post - How to resolve an invalid ELF header error quickly](https://tg4.solutions/how-to-resolve-invalid-elf-header-error/)
    - [Stackoverflow answer](https://stackoverflow.com/a/34885155/3137099)
    - [Amazon Compute Blog post](https://aws.amazon.com/blogs/compute/nodejs-packages-in-lambda/) - this post is mainly about node.js, but it talks about building libraries using an EC2 instance.
- AWS Lamdba supports python 3.7
    - [AWS Compute Blog post](https://aws.amazon.com/about-aws/whats-new/2018/11/aws-lambda-supports-python-37/)
- Accessing database from a Lambda function
    - [AWS Lambda tutorial](https://docs.aws.amazon.com/lambda/latest/dg/vpc-rds.html)
- Resolving "libpq.so: cannot open shared object file" error
    - [AWS forum post](https://forums.aws.amazon.com/thread.jspa?messageID=680192) - this post contains discussion about this issue and a solution suggested by a forum participant.
    - [Github project with steps on building psycopg2 library](https://github.com/jkehler/awslambda-psycopg2) - this Github project is created by the forum participant mentioned in the previous reference. This project provides detailed steps to build postgresql and psycopg2 from source code. If you are using python 3.6, this project contains ready-to-use psycopg2 library built for AWS Lambda.
- Links to postgresql and psycopg2 source code downloads
    - [postgreSQL source downloads](https://www.postgresql.org/ftp/source/v10.0/)
    - [psycopg2 download page](http://initd.org/psycopg/download/), click on `source package` link to download source code for the latest version
