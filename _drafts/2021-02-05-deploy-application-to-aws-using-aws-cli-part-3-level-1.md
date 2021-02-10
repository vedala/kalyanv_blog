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

Obtain image id for the latest Amazon Linux 2 image:

```
aws ec2 describe-images --filters "Name=name,Values=amzn2-ami-hvm-2.0*-x86_64-gp2" | jq -r '.Images[].Name' | sort | tail -1 > image_name.txt

IMAGE_NAME=`cat image_name.txt`
aws ec2 describe-images --filters "Name=name,Values=$IMAGE_NAME" | jq -r '.Images[].ImageId' > image_id.txt
```

## Launch an Instance, obtain public IP address & instance ID

Launch an EC2 instance:

```
IMAGE_ID=`cat image_id.txt`
aws ec2 run-instances --image-id $IMAGE_ID --instance-type t2.micro --key-name UsEast1KP --security-group-ids sg-0f6a49c1d64c74de7
```

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
