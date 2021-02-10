---
title: Deploying an application to AWS using AWS CLI, Part 2 - Level-1
---

## Create Security Group and Allow Incoming Traffic

Create security group:

```
aws ec2 create-security-group --group-name "my-sg-step1" \
    --description "Security group, step 1"
```

Allow incoming traffic on ports 22, 80 and 443 for ssh, http and https.

```
aws ec2 authorize-security-group-ingress --group-name my-sg-step1 \
    --protocol tcp --port 22 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-name my-sg-step1 \
    --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-name my-sg-step1 \
    --protocol tcp --port 443 --cidr 0.0.0.0/0
```


## Create Key Pair

Create key pair and save the certificate file:

```
aws ec2 create-key-pair --key-name UsEast1KP --query 'KeyMaterial' \
    --output text > acct93user1.pem
```

## Obtain Image ID

## Launch an Instance

## Install Base Software

## Initialize PostgreSQL Database

## Install Application

## Supervisor Setup

## Nginx Setup

## Allocate and Associate Elastic IP Address

## Register Domain

## Create Hosted Zone

## Create Record Sets

## Get Delegation Set and Update Nameserver Records with Domain Registrar
