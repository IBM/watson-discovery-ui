# Develop a fully featured web app built on the Watson Discovery Service

In this Code Pattern, we walk you through a working example of a web application that queries and manipulates data from the Watson Discovery Service. This web app contains multiple components that can provide you with a blueprint to follow when you develop your own applications. 

The main benefit of using the Watson Discovery Service is to take advantage of its powerful analytics engine that provides cognitive enrichments and insights into your data. This app provides examples of how to showcase these enrichments through the use of filters, lists and graphs. The key enrichments that we will focus on are:

* Entities
* Categories
* Concepts
* Keywords
* Sentiment

For this Code Pattern, we will be using data that contains reviews of Airbnb properties located in the Austin, TX area. 

![](doc/source/images/architecture.png)

## Flow
1. The Airbnb review json files are added to the Discovery collection.
2. The user interacts with the backend server via the app UI. The frontend app UI uses React to render search results and can reuse all of the views that are used by the backend for server side rendering. The frontend is using semantic-ui-react components and is responsive.
3. User input is processed and routed to the backend server, which is responsible for server side rendering of the views to be displayed on the browser. The backend server is written using express and uses express-react-views engine to render views written using React.
4. The backend server sends user requests to the Watson Discovery Service. It acts as a proxy server, forwarding queries from the frontend to the Watson Discovery Service API while keeping sensitive API keys concealed from the user.

## UI controls and associated actions

Here is a rough sketch of the main UI screen, followed by a description of each UI component and their assoicated actions:

![](doc/source/images/ui-panel.png)

1. Search field and search parameters: Return results based on search criteria. Search parameters will effect how the user will enter values, how they will be displayed, and limit the number of matches.
2. List Filters: Multiple drop-down lists of filters that are applied to the search resullts. Each drop down list contains entities, categories, concepts and keywords associated with the results. For each drop down filter item, the number of matches will also be displayed. If a user selects a filter item, a new search will be conducted and will update the results panel (#3). Filter items selected will also effect what is shown in the tag cloud (#4).
3. Search results and pagination menu: Shows a page of result items (e.g. 5 per page) and a pagination menu to allow the user to scroll through pages of result items.
4. Tag cloud filter: Similar to the list filters (#2) but in a different format. One set of filter items (either entities, categories, concepts or keywords) can be displayed at one time. User can select/deselect items in the cloud to turn on/off filters. Applied filters in both filter views (#2 and #4) will always be in sync.
5. Trend chart: Chart to show the sentiment trend for a specific entity, category, concept, or keyword over time. The data will reflect the current matching result set.
6. Sentiment chart; Donut chart that shows the total percentages of postive, neutral and negative reviews of selected entities, categories, concepts, or keywords. The data will reflect the current matching result set.

## Included components
* [Watson Discovery](https://www.ibm.com/watson/developercloud/discovery.html): A cognitive search and content analytics engine for applications to identify patterns, trends, and actionable insights.

## Featured technologies
* [Node.js](https://nodejs.org/): An open-source JavaScript run-time environment for executing server-side JavaScript code.
* Express
* React
* SemanticUI React Components
* ChartJS
* Jest test framework

# Watch the Video

!!!! COMING

# Steps

## Run locally

1. [Clone the repo](#1-clone-the-repo)
2. [Create IBM Cloud services](#2-create-ibm-cloud-services)
3. [Load the Discovery files](#3-load-the-discovery-files)
4. [Configure credentials](#4-configure-credentials)
5. [Run the application](#5-run-the-application)

### 1. Clone the repo
```
$ git clone https://github.com/rhagarty/disco-ui
```

### 2. Create IBM Cloud services

Create the following services:

* [**Watson Discovery**](https://console.ng.bluemix.net/catalog/services/discovery)

### 3. Load the Discovery files

Launch the **Watson Discovery** tool. Create a **new data collection**
and give the data collection a unique name.

<p align="center">
  <img width="600" src="doc/source/images/create-collection.png">
</p>

> Save the **environment_id** and **collection_id** for your `.env` file in the next step.

IMPORTANT! Before loading anydata, define a new "Configuration" and add 'Keyword" extraction to enrichments.

Under `Add data to this collection` use `Drag and drop your documents here or browse from computer` to seed the content with the json files extracted from `data/austin-2015-11-07-reviews.csv`.

![Upload data to collection](doc/source/images/upload-data.gif)

### 4. Configure credentials
```
cp env.sample .env
```
Edit the `.env` file with the necessary settings.

#### `env.sample:`

```
# Replace the credentials here with your own.
# Rename this file to .env before starting the app.

# Watson Discovery
DISCOVERY_USERNAME=<add_discovery_username>
DISCOVERY_PASSWORD=<add_discovery_password>
DISCOVERY_ENVIRONMENT_ID=<add_discovery_environment>
DISCOVERY_COLLECTION_ID=<add_discovery_collection>

# Run locally on a non-default port (default is 3000)
# PORT=3000

```

### 5. Run the application
1. Install [Node.js](https://nodejs.org/en/) runtime or NPM.
1. Start the app by running `npm install`, followed by `npm start`.
1. Access the UI by pointing your browser at `localhost:3000`.
> Note: server host can be changed as required in app.js and `PORT` can be set in `.env`.

# Sample UI layout
 
![](doc/source/images/sample-output.png)

# Troubleshooting

# Privacy Notice

If using the `Deploy to IBM Cloud` button some metrics are tracked, the following information is sent to a [Deployment Tracker](https://github.com/IBM/metrics-tracker-service) service on each deployment:

* Node.js package version
* Node.js repository URL
* Application Name (`application_name`)
* Application GUID (`application_id`)
* Application instance index number (`instance_index`)
* Space ID (`space_id`)
* Application Version (`application_version`)
* Application URIs (`application_uris`)
* Labels of bound services
* Number of instances for each bound service and associated plan information

This data is collected from the `package.json` file in the sample application and the ``VCAP_APPLICATION`` and ``VCAP_SERVICES`` environment variables in IBM Cloud and other Cloud Foundry platforms. This data is used by IBM to track metrics around deployments of sample applications to IBM Cloud to measure the usefulness of our examples, so that we can continuously improve the content we offer to you. Only deployments of sample applications that include code to ping the Deployment Tracker service will be tracked.

## Disabling Deployment Tracking

To disable tracking, simply remove `require("metrics-tracker-client").track();` from the ``app.js`` file in the top level directory.

# Links

* [Demo on Youtube](https://????): Watch the video.
* [Watson Node.js SDK](https://github.com/watson-developer-cloud/node-sdk): Download the Watson Node SDK.
* [Blog: Bring your own data to Watson Discovery Service](doc/index.md): Steps to building the data for your application.
* [Watson Discovery, an IBM API adding value to corporate data](https://bbvaopen4u.com/en/actualidad/watson-discovery-ibm-api-adding-value-corporate-data): Dive into IBM Watson Discovery Service, enabling companies to structure and understand large masses of data.
* [Blog: Watson Discovery Service – Understand your data at scale with less effort](https://www.ibm.com/blogs/watson/2016/12/watson-discovery-service-understand-data-scale-less-effort/): Align and connect different data sets to expose critical correlations and causal factors.
* [Blog: Using IBM Watson Discovery to query unstructured data](https://dzone.com/articles/using-ibm-watson-discovery-to-query-unstructured-d): Make sense of and identify patterns in large amounts of unstructured data.

# Learn more

* **Artificial Intelligence Code Patterns**: Enjoyed this Code Pattern? Check out our other [AI Code Patterns](https://developer.ibm.com/code/technologies/artificial-intelligence/).
* **AI and Data Code Pattern Playlist**: Bookmark our [playlist](https://www.youtube.com/playlist?list=PLzUbsvIyrNfknNewObx5N7uGZ5FKH0Fde) with all of our Code Pattern videos
* **With Watson**: Want to take your Watson app to the next level? Looking to utilize Watson Brand assets? [Join the With Watson program](https://www.ibm.com/watson/with-watson/) to leverage exclusive brand, marketing, and tech resources to amplify and accelerate your Watson embedded commercial solution.

# License
[Apache 2.0](LICENSE)