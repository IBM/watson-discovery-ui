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
