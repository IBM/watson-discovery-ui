# Run locally

This document shows how to run the `watson-discovery-ui` application on your local machine.

## Steps

1. [Clone the repo](#1-clone-the-repo)
1. [Create your Watson Discovery service](#2-create-your-watson-discovery-service)
1. [Load Discovery files and configure collection](#3-load-discovery-files-and-configure-collection)
1. [Add Watson Discovery credentials](#4-add-watson-discovery-credentials)
1. [Run the application](#5-run-the-application)

## 1. Clone the repo

```bash
git clone https://github.com/IBM/watson-discovery-ui
```

## 2. Create your Watson Discovery service

To create your Watson Discovery service:

  1. Click **Create resource** on your IBM Cloud dashboard.

  2. Search the catalog for `discovery`.

  3. Click the **Discovery** tile to launch the create panel.

![create-service](https://raw.githubusercontent.com/IBM/pattern-utils/master/watson-discovery/discover-service-create.png)

From the panel, enter a unique name, a region and resource group, and a plan type (select the default **lite** plan). Click **Create** to create and enable your service.

## 3. Load Discovery files and configure collection

Launch the **Watson Discovery** tool. Create a new data collection by selecting the **Update your own data** option. Give the data collection a unique name.

![create-collection](images/create-collection.png)

When prompted to get started by **uploading your data**, select and upload the first 2 json documents located in your local `data/airbnb` directory. Once uploaded, you can then use the **Configure data** option to add the **Keyword Extraction** enrichment, as show here:

![upload_data_into_collection](images/add-keyword-enrichment.gif)

> Note: failure to do this will result in no **keywords** being shown in the app.

Once the enrichments are selected, use the **Apply changes to collection** button to upload the remaining json files found in `data/airbnb`. **Warning** - this make take several minutes to complete.

> There may be a limit to the number of files you can upload, based on your IBM Cloud account permissions.

## 4. Add Watson Discovery credentials

Next, you'll need to add the Watson Discovery credentials to the .env file.

1. From the home directory of your cloned local repo, create a .env file by copying it from the sample version.

```bash
cp env.sample .env
```

2. Locate the service credentials listed on the home page of your Discovery service and copy the `API Key` and `URL` values.

![get-creds](https://raw.githubusercontent.com/IBM/pattern-utils/master/watson-discovery/get-creds.png)

3. From your Discovery service collection page, locate the credentials for your collection by clicking the dropdown button located at the top right. Copy the `Collection ID` and `Environment ID` values.

<p align="center">
  <img width="400" src="images/get-creds.png">
</p>

4. Take the copied values and paste them into the `.env` file:

```bash
# Copy this file to .env and replace the credentials with
# your own before starting the app.

# Watson Discovery
DISCOVERY_URL=<add_discovery_url>
DISCOVERY_ENVIRONMENT_ID=<add_discovery_environment_id>
DISCOVERY_COLLECTION_ID=<add_discovery_collection_id>
DISCOVERY_APIKEY=<add_discovery_iam_apikey>

# Run locally on a non-default port (default is 3000)
# PORT=3000
```

## 5. Run the application

Install [Node.js](https://nodejs.org/en/) runtime or NPM.

Then run:

```bash
npm install
npm start
```

The application will be available in your browser at `http://localhost:3000`.

> Note: server host can be changed as required in app.js and `PORT` can be set in the `.env` file.

[![return](https://raw.githubusercontent.com/IBM/pattern-utils/master/deploy-buttons/return.png)](https://github.com/IBM/watson-discovery-ui#deployment-options)
