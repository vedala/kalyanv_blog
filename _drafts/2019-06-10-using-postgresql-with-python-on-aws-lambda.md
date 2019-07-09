---
title: Using PostgreSQL With Python on AWS Lambda
---
While working on a tutorial for setting up a basic data pipeline, which is
described [here](), I ran into an issue where psycopg2 library was not available
on AWS Lambda. My lambda function uses this library to access data stored in
an PostgreSQL RDS instance. It is understandable that AMI image does not include
libraries such as psycopg2. In this blog post, I describe the steps that I took
to get my Lambda function working.


