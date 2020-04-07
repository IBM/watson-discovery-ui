# Run on Red Hat OpenShift

This document shows how to run the `watson-discovery-ui` application in a container running on Red Hat OpenShift.

## Prerequisites

You will need a running OpenShift cluster, or OKD cluster. You can provision [OpenShift on the IBM Cloud](https://cloud.ibm.com/kubernetes/catalog/openshiftcluster).

## Steps

1. [Clone the repo](#1-clone-the-repo)
1. [Create your Watson Discovery service](#2-create-your-watson-discovery-service)
1. [Load Discovery files and configure collection](#3-load-discovery-files-and-configure-collection)
1. [Create an OpenShift project](#4-create-an-openshift-project)
1. [Create the config map](#5-create-the-config-map)
1. [Run the application](#6-run-the-application)

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

## 4. Create an OpenShift project

* Using the OpenShift web console, select the `Application Console` view.

  ![console-options](https://raw.githubusercontent.com/IBM/pattern-utils/master/openshift/openshift-app-console-option.png)

* Use the `+Create Project` button to create a new project, then click on your project to open it.

* In the `Overview` tab, click on `Browse Catalog`.

  ![Browse Catalog](https://raw.githubusercontent.com/IBM/pattern-utils/master/openshift/openshift-browse-catalog.png)

* Choose the `Node.js` app container and click `Next`.

  ![Choose Node.js](https://raw.githubusercontent.com/IBM/pattern-utils/master/openshift/openshift-choose-nodejs.png)

* Give your app a name and add `https://github.com/IBM/watson-discovery-ui` for the github repo, then click `Create`.

  ![Add github repo](https://raw.githubusercontent.com/IBM/pattern-utils/master/openshift/openshift-add-github-repo.png)

## 5. Create the config map

To complete the config map instructions below, you will need to gather some key values from your Discovery service.

* You can find your service credentials on the home page of your Discovery service. This includes your `API Key` and service `URL` values:

  ![get-creds](https://raw.githubusercontent.com/IBM/pattern-utils/master/watson-discovery/get-creds.png)

* From your Discovery service collection page, you can find the credentials for your collection by clicking the dropdown button located at the top right. Included will be the `Collection ID` and `Environment ID` values.

<p align="center">
  <img width="400" src="images/get-creds.png">
</p>

Now that we know where to find these value, let's move on to creating the config map.

Click on the `Resources` tab and choose `Config Maps` and then click the `Create Config Map` button:

  ![add config map](https://raw.githubusercontent.com/IBM/pattern-utils/master/openshift/openshift-generic-config-map.png)

Use the `Create Config Map` panel to add our application parameters.

* Provide a `Name` for the config map.
* Add a key named `DISCOVERY_APIKEY` and paste in the API Key under `Enter a value...`.
* Click `Add Item` and add a key named `DISCOVERY_URL` and paste in the URL under `Enter a value...`..
* Click `Add Item` and add a key named `PORT`, enter 8080 under `Enter a value...`.
* Click `Add Item` and add a key named `DISCOVERY_ENVIRONMENT_ID` and paste in the value under `Enter a value...`..
* Click `Add Item` and add a key named `DISCOVERY_COLLECTION_ID` and paste in the value under `Enter a value...`..
* Hit the `Create` button.
* Click on your new Config Map's name.
* Click the `Add to Application` button.
* Select your application from the pulldown.
* Click `Save`.

Go to the `Applications` tab, choose `Deployments` to view the status of your application.

## 6. Run the application

* From the OpenShift or OKD UI, under `Applications` -> `Routes` you will see your app. Click on the `Hostname`to see your Watson Discovery UI app in action.
* Save this URL.

[![return](https://raw.githubusercontent.com/IBM/pattern-utils/master/deploy-buttons/return.png)](https://github.com/IBM/watson-discovery-ui#deployment-options)
