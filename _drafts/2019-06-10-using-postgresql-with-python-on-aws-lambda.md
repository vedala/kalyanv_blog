---
title: Using PostgreSQL With Python on AWS Lambda
---
While working on a tutorial for setting up a basic data pipeline, described
[here]({{ site.baseurl }}
{% link _posts/2018-09-12-build-a-blog-using-jekyll-and-deploy-to-github-pages-and-set-custom-domain.md %}),
I ran into an issue where psycopg2 library was not available
on AWS Lambda. My lambda function uses this library to access data stored in
an PostgreSQL RDS instance. It is understandable that AMI image does not include
libraries such as psycopg2. In this blog post, I describe the steps that I took
to get my Lambda function working.

## 1. Create deployment package as described in AWS documentation

### Setup python virtual environment on the development machine

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
    - [Github project with steps on building psycopg2 library](https://github.com/jkehler/awslambda-psycopg2) - this Github project is created by the forum participant mentioned in the previous reference. This project lists steps to build postgresql and psycopg2 from source code. Also contains ready-to-use psycopg2 library for python 3.6.
