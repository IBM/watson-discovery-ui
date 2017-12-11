Cognitive Discovery UI

Code pattern to provide working example of:
- Utilizing Watson Discovery service built with external data
- Node.js API server using the Express web framework
- HTML frontend written in React with React and semantic-ui-react components

# Steps
## 1. Clone the repo
```
$ git clone https://github.com/rhagarty/disco-ui
```
## 2. Create Watson Discovery collection
## 3. Load collection with data files

Data represents reviews from AirBnB for rentals in New York City.

Files can be found in [data/airbnb](data/airbnb)

## 4. Configure credentials
```
cp env.sample .env
```
Edit the `.env` file with the necessary settings

## 5. Run the application
```
$ npm install
$ npm start
```
Run the UI, with following browser URL:
```
http://localhost:3000
```

# Sample output
 
![](doc/source/images/sample-output.png)

# TODO List:
- Add 'keyword' extraction to discovery collection and represent the data as a filter (i.e. same UI components found for entities, categories, and concepts).
- Add UI component to allow user to strict `discovery langauge qery` or simple `natural langauge query' (default and already done).
- Add UI component to allow user to limit the number of matches to 100.
- Add UI component to allow user to specify they would like matches displayed with `passages` for result descriptions (instead of just dump of text field).
- Add 'trending' graph to bottom left of web page. Graph will be independent of other UI components, and show sentiment trending of each of the filter options (entities, categories, concepts, and keywords).
- Add 'Deploy to IBM Cloud' option. This includes the automation of loading discovery data.
- Add unit tests.
- Improve look and feel with CSS. This includes:

  - Make column depth fixed size so data doesn't jump around on page. 
  - Center pagination menu in 'matches' window.
  - Eliminate space when pagination menu is not shown.
  - Sentiment chart needs to default to "Term" when initally shown.

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