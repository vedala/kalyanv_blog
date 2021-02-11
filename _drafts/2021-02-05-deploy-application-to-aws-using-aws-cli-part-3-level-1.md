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
```

## Initialize PostgreSQL Database

Initialize and setup postgreSQL database
    - initialize database
    - start and enable database service
    - set admin user's password

```
sudo /usr/pgsql-12/bin/postgresql-12-setup initdb

# Start and enable database service
sudo systemctl start postgresql-12
sudo systemctl enable postgresql-12

# Set postgresql admin user's password
sudo -i -u postgres -- bash -c "psql -c \"alter user postgres with password '$PG_ADMIN_PWD'\""
```

## Install Application

```
MICROBLOG_PG_USER_PWD=`cat microblog_pg_user_pwd.txt`

cat <<-ENDCMDS > /tmp/app_install.sh
#!/bin/bash
set -euo pipefail

# Download the application source code
git clone https://github.com/vedala/microblog_cli microblog

# Create python virtual environment and install dependencies
cd microblog
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Install gunicorn
pip install gunicorn

echo "PATH=\\\$PATH:/usr/pgsql-12/bin" >> ~/.bash_profile

# Create .env file for environment variables
echo -n "SECRET_KEY=" > .env
python -c 'import uuid; print(uuid.uuid4().hex)' >> .env
echo "DATABASE_URL=postgres://microblog:$MICROBLOG_PG_USER_PWD@localhost:5432/microblog" >> .env

ENDCMDS

ssh -i $ssh_key_file ec2-user@$ip_address < /tmp/app_install.sh
```

The echo command that modified the PATH variable on the remote machine uses
two levels of escaping. First, we do not want to expand $PATH on the local
machine, so we add a "\" before the $ sign. The second escaping is needed,
when echo command runs on the remote instance. We do not want to expand $PATH
even then, since we want to add a line that looks like "PATH=$PATH:...".
For the second escaping we add two additional back slashes before the back
slash we added above.

## Install psycopg2

Our python application needs a driver to access posgreSQL database. The library
we will use is psycopg2. Here is how we install it:

```
cat <<-ENDCMDS > /tmp/install_psycopg2.sh
#!/bin/bash
set -euo pipefail

cd microblog
source venv/bin/activate

# Install C compiler, needed for "pip install" of psycopg2 postgresql driver
sudo yum -y install gcc

# Install libpq library
sudo yum -y install libpq5 libpq5-devel

# Install wheel package
pip install wheel

# Install postgresql driver
pip install psycopg2

# Use password authentication instead of the default ident authentication.
# Restart postgres service.
sudo -u postgres sed 's/ident/md5/' /var/lib/pgsql/12/data/pg_hba.conf | sudo -u postgres tee /tmp/new_pg_hba.conf
sudo -u postgres mv /tmp/new_pg_hba.conf /var/lib/pgsql/12/data/pg_hba.conf
sudo systemctl reload postgresql-12

ENDCMDS

ssh -i $ssh_key_file ec2-user@$ip_address < /tmp/install_psycopg2.sh
```

## Create Database Schema and Run Migrations


```
MICROBLOG_PG_USER_PWD=`cat microblog_pg_user_pwd.txt`

cat <<-ENDCMDS > /tmp/db_and_migrations.sh
#!/bin/bash
set -euo pipefail

sudo -i -u postgres -- bash -c "psql -c \"create database microblog;\""
sudo -i -u postgres -- bash -c "psql -c \"create user microblog with encrypted password '$MICROBLOG_PG_USER_PWD';\""
sudo -i -u postgres -- bash -c "psql -c \"grant all privileges on database microblog to microblog;\""

cd microblog
source venv/bin/activate
flask db upgrade

ENDCMDS

ssh -i $ssh_key_file ec2-user@$ip_address < /tmp/db_and_migrations.sh
```

## Supervisor Setup

```
cat <<-ENDCMDS > /tmp/install_supervisor.sh
#!/bin/bash
set -euo pipefail

sudo easy_install supervisor
sudo mkdir /etc/supervisor
sudo echo_supervisord_conf | sudo tee /etc/supervisor/supervisord.conf
sudo mkdir /etc/supervisor/conf.d
sudo mkdir /var/log/supervisor

# Modify socket file location under sections [unix_http_server] and [supervisorctl]
sudo cp /etc/supervisor/supervisord.conf /tmp
sudo sed -i 's#tmp/supervisor.sock#var/run/supervisor.sock#' /tmp/supervisord.conf

# Modify items under [supervisord] section
sudo sed -i 's#^logfile=/tmp/supervisord.log#logfile=/var/log/supervisord.log#' /tmp/supervisord.conf
sudo sed -i 's#^pidfile=/tmp/supervisord.pid#logfile=/var/run/supervisord.pid#' /tmp/supervisord.conf
sudo sed -i 's#^;childlogdir=/tmp#childlogdir=/var/log/supervisor#' /tmp/supervisord.conf

# Uncomment [include] section and modify files configuration
sudo sed -i 's#^\;\[include\]#[include]#' /tmp/supervisord.conf
sudo sed -i 's/^\;files.*/files=\/etc\/supervisor\/conf.d\/*.conf/' /tmp/supervisord.conf

sudo mv /tmp/supervisord.conf /etc/supervisor

# Create script for systemctl service
sudo tee /lib/systemd/system/supervisord.service <<-END_SERVICE_SCRIPT
[Unit]
Description=Supervisor process control system for UNIX
Documentation=http://supervisord.org
After=network.target

[Service]
ExecStart=/usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf
ExecStop=/usr/bin/supervisorctl \\\$OPTIONS shutdown
ExecReload=/usr/bin/supervisorctl -c /etc/supervisor/supervisord.conf \\\$OPTIONS reload
KillMode=process
Restart=on-failure
RestartSec=50s

[Install]
WantedBy=multi-user.target
END_SERVICE_SCRIPT

# Start and enable supevisord
sudo systemctl start supervisord
sudo systemctl enable supervisord

# Add supervisor configuration to monitor gunicorn
sudo tee /etc/supervisor/conf.d/microblog.conf <<-END_GUNI_MONITOR
[program:microblog]
command=/home/ec2-user/microblog/venv/bin/gunicorn -b localhost:8000 -w 4 microblog:app
directory=/home/ec2-user/microblog
user=ec2-user
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
END_GUNI_MONITOR

# Reload supervisor service
sudo supervisorctl reload

ENDCMDS

ssh -i $ssh_key_file ec2-user@$ip_address < /tmp/install_supervisor.sh
```

## Nginx Setup

```
cat <<-ENDCMDS > /tmp/config_nginx.sh
#!/bin/bash
set -euo pipefail

cd microblog
mkdir certs
openssl req -new -newkey rsa:4096 -days 365 -nodes -x509 -keyout certs/key.pem -out certs/cert.pem -subj "/C=US/O=Microblog, AWS CLI/CN=mbawscli"

sudo tee /etc/nginx/conf.d/microblog.conf <<-END_NGINX_CFG
server {
    listen 80;
    server_name _;
    location / {
        return 301 https://\\\$host\\\$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name _;

    ssl_certificate /home/ec2-user/microblog/certs/cert.pem;
    ssl_certificate_key /home/ec2-user/microblog/certs/key.pem;

    access_log /var/log/microblog_access.log;
    error_log /var/log/microblog_error.log;

    location / {
        proxy_pass http://localhost:8000;
        proxy_redirect off;
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
    }

    location /static {
        alias /home/ubuntu/microblog/app/static;
        expires 30d;
    }
}
END_NGINX_CFG

sudo systemctl start nginx
sudo systemctl enable nginx

ENDCMDS

ssh -i $ssh_key_file ec2-user@$ip_address < /tmp/config_nginx.sh
```

## Allocate and Associate Elastic IP Address

```
aws ec2 allocate-address

aws ec2 describe-addresses --query "Addresses[0].PublicIp" | sed 's/"//g' > elastic_ip_addr.txt

ELASTIC_IP_ADDR=`cat elastic_ip_addr.txt`
aws ec2 associate-address --instance-id `cat instance_id.txt` --public-ip $ELASTIC_IP_ADDR
```

## Register Domain

## Create Hosted Zone

## Create Record Sets

## Get Delegation Set and Update Nameserver Records with Domain Registrar
