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
- references, why this needed
- pick postgresql version for source code
- pick psycopg2 version for source code (why = latest, because working on Mac dev machine)

### Setting up virtual environment on an EC2 instance

### Invoke lambda function, a different error encountered

## 3. Resolving "libpq.so.x cannot open shared object file" error

### Background

### Compiling postgresql from source code

### Compiling psycopg2 from source code and statically linking

## References
- AWS document on how to create deployment package in Python
    - [AWS Lambda Deployment Package in Python](https://docs.aws.amazon.com/lambda/latest/dg/lambda-python-how-to-create-deployment-package.html)
- Resolving "invalid ELF header" error
    - [TG4 Solution blog post - How to resolve an invalid ELF header error quickly](https://tg4.solutions/how-to-resolve-invalid-elf-header-error/)
    - [Stackoverflow question](https://stackoverflow.com/a/34885155/3137099)
    - [Amazon Compute Blog post](https://aws.amazon.com/blogs/compute/nodejs-packages-in-lambda/) - this post is mainly about node.js, but it talks about building libraries using an EC2 instance.
