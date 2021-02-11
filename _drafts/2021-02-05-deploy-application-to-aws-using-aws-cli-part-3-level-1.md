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
SG_ID=`cat sg_id.txt`
aws ec2 run-instances --image-id $IMAGE_ID --instance-type t2.micro --key-name UsEast1KP --security-group-ids $SG_ID
```

## Install Base Software

The script shown below does the following things:
- check for options
- Accept keys for the new host to avoid interactive question
- Install following software:
    - python3 and related libraries
    - git
    - nginx
    - postgreSQL (repo and libraries)
- Initialize and setup postgreSQL database
    - initialize database
    - start and enable database service
    - set admin user's password

A note about how script is executed on the remote EC2 instance:

- The script creates a sub-script that would be executed on the remote EC2 instance (let's call it remote_script).
- The remote_script is created using `cat` command along with heredoc.
- The remote_script then passed in as stdin to the ssh command. ssh executes the remote_script on the remote EC2 instance.

```
#!/bin/bash
set -euo pipefail

ip_address=""
ssh_key_file=""
while getopts "i:k:" opt; do
    case "$opt" in
    i)
        ip_address=$OPTARG
        ;;
    k)
        ssh_key_file=$OPTARG
        ;;
    esac
done

if [[ $ip_address == "" || $ssh_key_file == "" ]]; then
    echo "$(basename $0): Required options are missing."
    echo "Usage: $(basename $0) -i instance-ip -k ssh-key-file"
    exit 1
fi

# Accept keys for the new host to avoid the interactive
# question when connecting using ssh for the first time.

ssh-keyscan $ip_address >> ~/.ssh/known_hosts

PG_ADMIN_PWD=`cat pg_admin_pwd.txt`

cat <<-ENDCMDS > /tmp/remote_script.sh
#!/bin/bash
set -euo pipefail

sudo yum -y update
sudo yum -y install python3 python3-venv python3-devel
sudo yum -y install git

# Install nginx
sudo amazon-linux-extras install -y nginx1

#
# Install postgresql 12
#

# Add repo
sudo tee /etc/yum.repos.d/pgdg.repo <<-PGREPO
[pgdg12]
name=PostgreSQL 12 for RHEL/CentOS 7
baseurl=https://download.postgresql.org/pub/repos/yum/12/redhat/rhel-7-x86_64
enabled=1
gpgcheck=0
PGREPO

# Generate metadata cache and install postgresql 12
sudo yum makecache
sudo yum -y install postgresql12 postgresql12-libs postgresql12-server

# Initialize database
sudo /usr/pgsql-12/bin/postgresql-12-setup initdb

# Start and enable database service
sudo systemctl start postgresql-12
sudo systemctl enable postgresql-12

# Set postgresql admin user's password
sudo -i -u postgres -- bash -c "psql -c \"alter user postgres with password '$PG_ADMIN_PWD'\""

ENDCMDS

ssh -i $ssh_key_file ec2-user@$ip_address < /tmp/remote_script.sh
```

## Initialize PostgreSQL Database

## Install Application

## Supervisor Setup

## Nginx Setup

## Allocate and Associate Elastic IP Address

## Register Domain

## Create Hosted Zone

## Create Record Sets

## Get Delegation Set and Update Nameserver Records with Domain Registrar
