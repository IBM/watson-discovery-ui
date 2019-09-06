# Run on Red Hat OpenShift

This document shows how to run the `watson-discovery-ui` application in a container running on Red Hat OpenShift.

## Prerequisites

You will need a running OpenShift cluster, or OKD cluster. You can provision [OpenShift on the IBM Cloud](https://cloud.ibm.com/kubernetes/catalog/openshiftcluster).

## Steps

1. [Clone the repo](#1-clone-the-repo)
1. [Create OpenShift project](#2-create-openshift-project)
1. [Create your Watson Discovery service](#3-create-your-watson-discovery-service)
1. [Load Discovery files and configure collection](#4-load-discovery-files-and-configure-collection)
1. [Create the config map](#5-create-the-config-map)
1. [Run the application](#6-run-the-application)

## 1. Clone the repo

```bash
git clone https://github.com/IBM/watson-discovery-ui
```

## 2. Create OpenShift project

* In your OpneShift cluster, open your project or click on **+ Create Project** to create one.
* In the **Overview** tab, click on **Browse Catalog**.

![Browse Catalog](https://raw.githubusercontent.com/IBM/pattern-utils/master/openshift/openshift-browse-catalog.png)

* Choose the **Node.js** app container and click **Next**.

![Choose Node.js](https://raw.githubusercontent.com/IBM/pattern-utils/master/openshift/openshift-choose-nodejs.png)

* Give your app a name and add `https://github.com/IBM/watson-discovery-ui` for the github repo, then click **Create**.

![Add github repo](https://raw.githubusercontent.com/IBM/pattern-utils/master/openshift/openshift-add-github-repo.png)

## 3. Create your Watson Discovery service

To create your Watson Discovery service:

  1. Click **Create resource** on your IBM Cloud dashboard.

  2. Search the catalog for `discovery`.

  3. Click the **Discovery** tile to launch the create panel.

![create-service](https://raw.githubusercontent.com/IBM/pattern-utils/master/watson-discovery/discover-service-create.png)

From the panel, enter a unique name, a region and resource group, and a plan type (select the default **lite** plan). Click **Create** to create and enable your service.

## 4. Load Discovery files and configure collection

Launch the **Watson Discovery** tool. Create a new data collection by selecting the **Update your own data** option. Give the data collection a unique name.

![create-collection](images/create-collection.png)

When prompted to get started by **uploading your data**, select and upload the first 2 json documents located in your local `data/airbnb` directory. Once uploaded, you can then use the **Configure data** option to add the **Keyword Extraction** enrichment, as show here:

![upload_data_into_collection](images/add-keyword-enrichment.gif)

> Note: failure to do this will result in no **keywords** being shown in the app.

Once the enrichments are selected, use the **Apply changes to collection** button to upload the remaining json files found in `data/airbnb`. **Warning** - this make take several minutes to complete.

> There may be a limit to the number of files you can upload, based on your IBM Cloud account permissions.

## 5. Create the config map

You will need to export the key/value pairs from [env.sample](../../env.sample) as a config map.

1. Locate the service credentials listed on the home page of your Discovery service and copy the `API Key` and `URL` values.

![get-creds](https://raw.githubusercontent.com/IBM/pattern-utils/master/watson-discovery/get-creds.png)

2. From your Discovery service collection page, locate the credentials for your collection by clicking the dropdown button located at the top right. Copy the `Collection ID` and `Environment ID` values.

<p align="center">
  <img width="400" src="images/get-creds.png">
</p>

3. Back in the OpenShift or OKD UI, click on the **Resources** tab and choose **Config Maps** and then **Create Config Map**.

    * Add a key for **DISCOVERY_IAM_APIKEY** and paste in the key value as **value**:

      ![add config map](https://raw.githubusercontent.com/IBM/pattern-utils/master/openshift/openshift-generic-config-map.png)

    * Click **Add item** and then add a key for **PORT** with the value **8080**.

    * Repeat this process to add a key/value for both **DISCOVERY_ENVIRONMENT_ID** and **DISCOVERY_COLLECTION_ID**.

    * Go to the **Applications** tab, choose **Deployments** and the **Environment** tab. Under **Environment From** / **Config Map/Secret**, choose the config map you just created [1]. Save the config [2]. The app will re-deploy automatically, or click **Deploy** to re-deploy manually [3]. To see the variables in the Config Map that will be exported in the app environment, click **View Details**.

      ![add config map to app](https://raw.githubusercontent.com/IBM/pattern-utils/master/openshift/openshift-add-config-map-to-app.png)

## 6. Run the application

* From the OpenShift or OKD UI, under **Applications** -> **Routes** you will see your app. Click on the **Hostname** to see your Watson Discovery UI app in action.

[![return](https://raw.githubusercontent.com/IBM/pattern-utils/master/deploy-buttons/return.png)](https://github.com/IBM/watson-discovery-ui#deployment-options)
