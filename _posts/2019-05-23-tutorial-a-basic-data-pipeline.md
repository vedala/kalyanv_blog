---
title: Tutorial - Setting Up A Basic Data Pipeline
---

A few months ago, I decided to develop a personal project to help me learn
data engineering skills. I wrote this tutorial as documentation of my learning
experience. I hope the tutorial will be useful to others who might be looking
to learn basic data engineering skills.

The approach I took for the project was to implement a basic data pipeline
involving the usual steps of a data engineering / data warehousing project.
These steps are:
- identify data source and acquire data
- clean and prepare data
- load data into data warehouse


## Data Source

To find datasets that I could use for my demo data engineering project,
I started with a simple internet search and found
[this post](https://www.springboard.com/blog/free-public-data-sets-data-science-project/)
among several useful hits.

Of the datasets described in the blog post, I picked Walmart Recruiting Store Sales data.
Some of the reasons for picking this dataset are:
- retail data, easy to understand domain
- this data is hosted on Kaggle, very good description of data is provided by Kaggle

Source data located [here](https://www.kaggle.com/c/walmart-recruiting-store-sales-forecasting).

The data provided is historical sales data for 45 Walmart stores for years
2010 thru 2012.

The primary data is weekly department-wise sales amount for each store.
Another piece of information included is whether a given week is a holiday
week or a regular week. For the purpose of this data, only the following four
holidays are considered: Super Bowl, Labor Day, Thanksgiving and
Christmas.

In addition, "features" data is provides information such as temperature
in the region, fuel price and markdowns etc.

Of the files available from the data source, I used the following files for this
data engineering project:

- train.csv
- features.csv

## Schema Design

Applying dimensional design process on the data yields one dimension
and two fact tables. The tables and their fields are listed below:

- date dimension
  - Id (PK)
  - Date
  - Is Holiday
  - Holiday Name
- sales fact
  - Store (PK)
  - Dept (PK)
  - Date Key (PK)
  - Weekly Sales
- features fact
  - Store (PK)
  - Date Key (PK)
  - Temperature
  - Fuel Price
  - Markdown 1
  - Markdown 2
  - Markdown 3
  - Markdown 4
  - Markdown 5
  - CPI
  - Unemployment


## Data Cleaning and Preparation

I picked [Stitch](https://www.stitchdata.com/) as the ETL tool for
this project (I describe the process of selecting the ETL tool
in the next section).

In this section, I describe the cleaning and prepration I performed while
creating each of the dimension and fact CSV files. Because the ETL tool that
I picked is a sync-only tool, I had to perform cleaning of certain data
items that would otherwise be performed by an ETL tool (I found Stitch to
be great even with this limitation).

- Date dimension CSV file generation
  - extract only Date and isHoliday columns from the source sales data
  - sort on Date field and output only unique rows
  - data for few of the weeks in not available for the years 2010 and 2012. Add rows for 2010 and 2012 dates that are missing from data
  - insert holiday_name field into data for appropriate rows
  - add sequence data as first column, this will serve as primary key of the dimension table created from the CSV file
- Sales fact CSV file generation
  - delete IsHoliday field
  - replace "Date" field with "Date Key" foreign key, lookup date key from date dimension created above
- Features fact CSV file generation
  - features data contains "NA" for missing data values, since these items are numeric, I convert them to 0.0
  - delete IsHoliday field
  - similar to what was done for sales fact generation, replace "Date" field with "Date Key" foreign key

_**Implementation**_

I implemented data cleaning and prepartion using AWS Lambda functions. I
upload the source data files to AWS S3 and the Lambda functions download
the source data files, clean and prepare CSV files containing dimension
& fact data and store the generated files back to S3.


Links to source code of the Lambda functions are:

- [Date dimension Lambda function](https://github.com/vedala/dataeng_wm/blob/master/lambda/prepare_datedim.sh)
- [Sales fact Lambda function](https://github.com/vedala/dataeng_wm/blob/master/lambda/prepare_salesfact.sh)
- [Features fact Lambda function](https://github.com/vedala/dataeng_wm/blob/master/lambda/prepare_featuresfact.sh)



## Data Load

_**ETL Tool**_

Stitch is used as ETL tool ([link](https://www.stitchdata.com/)).


Stitch is a sync-only provider. Stitch tool does not provide any
transform ability.

Why Stitch

  - offers a free plan. The only cloud-based ETL tool I found that offers a free plan. (**Update**: as of December 2020, Stitch data is no longer offers a free plan).
  - once I started using Stitch, I found the service to be excellent.  The free account allows only one destination to be added. This was adequate for my needs.

Setting up data source in Stitch
  - as mentioned above, after the cleaning and preparation step, the cleaned data files are uploaded to S3.
  - Stitch provides the ability to use many different types of sources, CSV files stored on AWS S3 is one of the supported sources.
  - on starting a new integration, I first pick an integration name.
  - this is used as the schema name in the postgres database.
  - next, I select AWS S3 CSV integration from the list of integrations presented. Next, I type in my S3 bucket name and file name.
  - grant access to S3 bucket. Directs me to create an IAM role, provides details such as AWS account id, role name, role policy to use for creating the IAM role.
  - setup CSV files to table name mapping.
  - setup integration frequency. Since this project needs just one-time load of data, I pick the default (30 minute) interval. Stitch starts the first load within minutes of setting up the integration. After data load is complete, I turn off the integration.

Setting up destination in Stitch

  - as mentioned above, Stitch free plan allows only one destination to be setup.
  - on the user interface for setting up the destination, I pick PostgreSQL as the destination type.
  - on picking PostgreSQL, I enter details such as RDS host endpoint, port, username, password and database name.
  - the interface provides a list of IP address and directs me to whitelist these IP addresses on my RDS instance.
  - after entering all details, Stitch checks if it can connect to the database and if successful, creates the destination.


_**Data Warehouse**_

Data loaded into an AWS RDS PostgreSQL instance. The data is organized
as a star schema. The Stitch tool creates the dimension and fact tables
in the PostgreSQL instance.


## Analysis

The following analyses are a sample of possible analyses that can be
performed on the data.

_**Overview**_

  - Analysis buttons kick off ajax calls to AWS Lambda functions.
  - The lambda functions run analysis SQL queries on the postgres database and return the result to the web application.
  - Chartjs is used for rendering charts.

_**Implementation**_

  - [Analysis-1 Lambda function](https://github.com/vedala/dataeng_wm/blob/master/lambda/analysis501.py)
  - [Analysis-2 Lambda function](https://github.com/vedala/dataeng_wm/blob/master/lambda/analysis502.py)


_**Analysis 1 - Data Availability, Number of Weeks per Year**_

An extremely simple analysis. Counts the number of weeks for which
data is available for each year.


_**Analysis 2 - Week-of-Holiday Sales Compared to Annual Weekly Average**_

Compare annual weekly average for the entire year to the weekly sales for the
weeks that includes a holiday.

_**Deployment**_

The project is deployed at the following location:

[Data Pipeline Tutorial - Demo](http://dataeng-walmart.s3-website-us-east-1.amazonaws.com/)
