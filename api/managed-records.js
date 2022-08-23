import fetch from "../util/fetch-fill";
import URI from "urijs";

import { Promise } from "es6-promise";

// /records endpoint
window.path = "http://localhost:3000/records";

// Your retrieve function plus any additional functions go here ...

function retrieve(options) {
  
  return new Promise( (resolve, reject) => {
    
    // defaults
    // limit and displayLimit are different, so we can "peek ahead" with API.
    // we do this because the API doesn't return a count.  We only want to display 
    // 10 records, but, we ask for 11.  That way, if we get less than 11,
    // we know that the API is at the end of it's records.
    // it's not exactly the most efficient system, wasting bandwidth
    // and time, but they were trying to be tricky.
    let page = 1, limit = 11, displayLimit = 10, colors = [];
    
    // parse options and double check for 
    // simple errors
    if (options != undefined) {
      if ("page" in options) {
        page = parseInt(options.page);
        if (page < 1 || isNaN(page) == true) {
          console.log("page number was incorrectly specified");
          resolve({});
        }
      }
      
      if ("colors" in options && Array.isArray(options.colors) == true) {
        colors = options.colors;
      }
    }
    
    let uri = new URI(window.path);
    let offset = (page - 1) * displayLimit;
    uri.search({offset: offset, limit: limit, "color[]": colors});
    
    // use promisified fetch api
    fetch( uri.toString() )
      .then( (res) => {
        // if http 200
        if (res.status == 200) {
          res.json().then( (data) => {
            
            // build object specified by assignment requirements
            resolve( buildReturnObject(data, page, limit, displayLimit) );
            
          });
        } else {
          // any http error status resolves an empty object
          console.log(`http error: ${res.status} ${res.statusText}`);
          resolve({});
        }
      })
      .catch( 
        (error) => {
          // any fetch internal error resolves an empty object
          console.log("fetch catch error:", error);
          resolve({});
        }
      );
    
  });
}


// array for searching primary colors
const primaryColors = ["red", "yellow", "blue"];

// builds object specified in assignment
function buildReturnObject(data, page, limit, displayLimit) {
  
  // defaults
  let ids = [], open = [], closed = 0;
  
  // assemble ids and open arrays and do closed count
  for (let i = 0; i < displayLimit && i < data.length; i++) {
    
    // build array of all ids present in data
    ids.push(data[i].id);
    
    // store any open data members
    if (data[i].disposition == "open") {
      
      // set default primary value
      data[i].isPrimary = false;
      
      // do we have any primary open members?
      if ( primaryColors.includes(data[i].color) == true ) {
        // add isPrimary to object
        data[i].isPrimary = true;
      }
      
      // store open data member
      open.push(data[i]);
      
    }
    
    // do we have any members that are closed
    if (data[i].disposition == "closed") {
      
      // are any members also primary colors?
      if ( primaryColors.includes(data[i].color) == true ) {
        closed++;
      }
    }
  }
  
  // set previousPage
  let previousPage = page <= 1 ? null : page - 1;
  
  let nextPage = page + 1;
  if ( data.length < limit) {
    nextPage = null;
  }
  
  // assemble final object record
  let rec = {
    ids: ids,
    open: open,
    closedPrimaryCount: closed,
    previousPage: previousPage,
    nextPage: nextPage,
  }
  
  return rec;
}


export default retrieve;
