---
title: Deploying an application to AWS using AWS CLI, Part 3 - Level-1 Architecture
---

## Level-1 Architecture

As I mentioned in [Part 1 - Introduction](), this blog series develops a series of deployment architectures to mirror the recommendations made in the Re:invent video. **improve text, add link**

The original video just describes a series a recommendations; I demarcated the recommendations into a few "levels". "Level" is the word that I am using for the purpose of this blog series.

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
SG_ID=`cat sg_id.txt`
aws ec2 run-instances --image-id $IMAGE_ID --instance-type t2.micro --key-name UsEast1KP --security-group-ids $SG_ID
```

## Install Required Software and Application to EC2 Instance

Follow the instructions in [Part 3b]({{ site.baseurl }} {% link _posts/2021-02-06-deploy-application-to-aws-using-aws-cli-part-3b-application.md %}) to install the required software and application to the EC2 instance. After completing the steps in Part 3b, come back here and continue with allocating Elatic IP address.

## Allocate and Associate Elastic IP Address

```
aws ec2 allocate-address

aws ec2 describe-addresses --query "Addresses[0].PublicIp" | sed 's/"//g' > elastic_ip_addr.txt

ELASTIC_IP_ADDR=`cat elastic_ip_addr.txt`
aws ec2 associate-address --instance-id `cat instance_id.txt` --public-ip $ELASTIC_IP_ADDR
```

## Register Domain

Register a domain with a registrar of your choice. I registered my domain with GoDaddy.
You can also register a domain using Route53.


The instructions outlined in the following sections are for the scenario when you register
your domain using an outside registrar. Some of the steps are different in the case where
the domain is registered using Route53.

Save the domain name in a text file `domain_name.txt`.

## Create Hosted Zone

```
CALLER_REF=$(date +%Y-%m-%d-%H:%M:%S)
DOMAIN_NAME=`cat domain_name.txt`
RETURN_JSON=$(aws route53 create-hosted-zone --name $DOMAIN_NAME --caller-reference $CALLER_REF)
echo $RETURN_JSON | jq '.HostedZone.Id' | sed 's/"//g' | sed 's#/hostedzone/##' > hosted_zone_id.txt
echo $RETURN_JSON | jq '.ChangeInfo.Id' | sed 's/"//g' | sed 's#/change/##' > create_hz_change_id.txt
```

We create a hosted zone using the domain as the hosted zone's name. Hosted zone creation
also needs a caller reference parameter which is required to be unique. We use a timestamp
as caller reference.

We also need to save two pieces of information from the json returned by the create
hosted zone request: Hosted Zone Id and Change Id.

Hosted zone creation is treated as a request by Route53. For this reason, we need to save
the Change ID information returned by the `create-hosted-zone` request. We can then use the
change id to query the status:

```
CHANGE_ID=`cat create_hz_change_id.txt`
aws route53 get-change --id $CHANGE_ID --query "ChangeInfo.Status"
```

Requests to Route53 are assigned an initial status of `PENDING`. Upon completion of the
request, the status changes to `INSYNC`. Before moving on to the record set creation step,
we have to make sure the hosted zone creation request has the `INSYNC` status.

## Create Record Sets

```
DOMAIN_NAME=`cat domain_name.txt`
aws route53 change-resource-record-sets --hosted-zone-id `cat hosted_zone_id.txt` \
    --change-batch '{
        "Changes": [
            {
                "Action": "CREATE",
                "ResourceRecordSet": {
                    "Name": "'$DOMAIN_NAME'",
                    "Type": "A",
                    "TTL": 60,
                    "ResourceRecords": [ { "Value": "'$(cat elastic_ip_addr.txt)'"} ]
                    }
            },
            {
                "Action": "CREATE",
                "ResourceRecordSet": {
                    "Name": "www.'$DOMAIN_NAME'",
                    "Type": "A",
                    "AliasTarget": {
                        "HostedZoneId": "'$(cat hosted_zone_id.txt)'",
                        "DNSName": "'$DOMAIN_NAME'",
                        "EvaluateTargetHealth": false
                    }
                }
            },
            {
                "Action": "CREATE",
                "ResourceRecordSet": {
                    "Name": "*.'$DOMAIN_NAME'",
                    "Type": "A",
                    "AliasTarget": {
                        "HostedZoneId": "'$(cat hosted_zone_id.txt)'",
                        "DNSName": "'$DOMAIN_NAME'", "EvaluateTargetHealth": false
                    }
                }
            }
        ]
    }' > /tmp/record_sets_create_info.txt

cat /tmp/record_sets_create_info.txt | jq '.ChangeInfo.Id' | sed 's/"//g' | sed 's#/change/##' > create_rs_change_id.txt
```

Verify that record set creation request has its status set to `INSYNC`:

```
CHANGE_ID=`cat create_rs_change_id.txt`
aws route53 get-change --id $CHANGE_ID --query "ChangeInfo.Status"
```

## Get Delegation Set and Update Nameserver Records with Domain Registrar

```
HOSTED_ZONE_ID=`cat hosted_zone_id.txt`
aws route53 get-hosted-zone --id $HOSTED_ZONE_ID --query "DelegationSet" > delegation_set.txt
```

The delegation set is a list of name servers that looks similar to the list shown below:

```
{
    "NameServers": [
        "ns-xxx.awsdns-xx.net",
        "ns-xxx.awsdns-xx.com",
        "ns-xxxx.awsdns-xx.co.uk",
        "ns-xxxx.awsdns-xx.org"
    ]
}
```

We need to update our domain's name servers on the domain registrar's site.
