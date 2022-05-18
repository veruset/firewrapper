import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  collection,
  query,
  startAt,
  limit,
  getDocs,
  orderBy,
  serverTimestamp,
  addDoc,
  where
} from "firebase/firestore";

import CONSTANTS from "src/constants";

/**
 * Get a single document from a collection. This is a one-time operation, so `callback`
 * will only be called once when the operation terminates.
 *
 * @param {object} app -  A Firebase app object (returned from `firebase/app`
 *                        `initializeApp(configObject)`)
 * @param {string} collectionId -  The UID of the collection that
 *                                 the document belongs to (eg. 'users')
 * @param {string} itemId - The Firebase UID of the document to get
 * @param {function} callback -  A callback function to run with the status
 *                               of the request and error message or document data
 * @param {boolean} verbose -  An optional boolean specifying if the function should console.log
 *                             the passed in parameters whenever it's run. [Default: false]
 *
 * @returns {string} status - The status of the operation (one of CONSTANTS.SUCCESS
 *                            and CONSTANTS.ERROR).
 * @returns {object} data - If the operation was successful, this is an object containing
 *                          the contents of snapshot.data().
 */

function GetItem(app, collectionId, itemId, callback, verbose = false) {
  // Checks
  if (verbose) {
    console.log("[FIREWRAPPER|GET_ITEM]", collectionId, itemId);
  }
  if (!collectionId || !itemId || !callback) {
    callback(CONSTANTS.ERROR, {
      message: `Invalid parameters. Missing one of collectionId:[${collectionId}], itemId:[${itemId}], or callback:[${callback}]`
    });
  }

  // Operation
  const db = getDatabase(app);
  const docRef = doc(db, collectionId, itemId);
  getDoc(docRef).then(docSnapshot => {
    if (docSnapshot.exists()) {
      callback(CONSTANTS.SUCCESS, docSnapshot.data());
    } else {
      callback(CONSTANTS.ERROR, {
        message: "No Document found (snapshot.exists() is false)"
      });
    }
  });
}

/**
 * Get a single document from a collection. This is a realtime operation, so `callback`
 * will be called once when this function is called and once every time the document
 * updates in Firebase. In order to halt the realtime updates, you can call the unsub
 * function returned as the third parameter.
 *
 * @param {object} app -  A Firebase app object (returned from `firebase/app`
 *                        `initializeApp(configObject)`)
 * @param {string} collectionId -  The UID of the collection that
 *                                 the document belongs to (eg. 'users')
 * @param {string} itemId - The Firebase UID of the document to get
 * @param {function} callback -  A callback function to run with the status
 *                               of the request and error message or document data
 * @param {boolean} verbose -  An optional boolean specifying if the function should console.log
 *                             the passed in parameters whenever it's run. [Default: false]
 *
 * @returns {string} status - The status of the operation (one of CONSTANTS.SUCCESS
 *                            and CONSTANTS.ERROR).
 * @returns {object} data - If the operation was successful, this is an object containing
 *                          the contents of snapshot.data().
 * @returns {function} unsub - A function that can be called to stop listening for realtime
 *                             updates.
 */
export function GetRealtimeItem(
  app,
  collectionId,
  itemId,
  callback,
  verbose = false
) {
  // Checks
  if (verbose) {
    console.log("[FIREWRAPPER|GET_REALTIME_ITEM]", collectionId, itemId);
  }
  if (!collectionId || !itemId || !callback) {
    callback(CONSTANTS.ERROR, {
      message: `Invalid parameters. Missing one of collectionId:[${collectionId}], itemId:[${itemId}], or callback:[${callback}]`
    });
  }

  // Operation
  const db = getDatabase(app);
  const docRef = doc(db, collectionId, itemId);
  const unsub = onSnapshot(docRef, docSnapshot => {
    if (docSnapshot.exists()) {
      callback(CONSTANTS.SUCCESS, docSnapshot.data(), unsub);
    } else {
      callback(CONSTANTS.ERROR, {
        message: "No Document found (snapshot.exists() is false)"
      });
    }
  });
}

/**
 * Add a new document to a collection
 *
 * @param {object} app -  A Firebase app object (returned from `firebase/app`
 *                        `initializeApp(configObject)`)
 * @param {string} collectionId -  The UID of the collection that
 *                                 the document belongs to (eg. 'users')
 * @param {object} data -  The document being added to the collection
 * @param {function} callback -  A callback function to run with the status
 *                               of the request and error message if the operation failed
 * @param {boolean} verbose -  An optional boolean specifying if the function should console.log
 *                             the passed in parameters whenever it's run. [Default: false]
 */
export function AddItem(app, collectionId, data, callback, verbose = false) {
  // Checks
  if (verbose) {
    console.log("[FIREWRAPPER|ADD_ITEM]", collectionId, data);
  }
  if (!collectionId || !data || !callback) {
    callback(CONSTANTS.ERROR, {
      message: `Invalid parameters. Missing one of collectionId:[${collectionId}], data:[${data}], or callback:[${callback}]`
    });
  }

  // Operation
  const db = getDatabase(app);
  const docRef = doc(collection(db, collectionId));
  // TODO(frg100): Add DATE_CREATED, and UID fields
  setDoc(collectionId, data)
    .then(() => {
      callback(CONSTANTS.SUCCESS);
    })
    .catch(error => {
      callback(CONSTANTS.ERROR, error);
    });
}

/**
 * Edit a document in a given collection
 *
 * @param {object} app -  A Firebase app object (returned from `firebase/app`
 *                        `initializeApp(configObject)`)
 * @param {string} collectionId -  The UID of the collection the document belongs to
 * @param {string} itemId - The Firebase UID of the document to edit
 * @param {object} data -  The data object being written
 * @param {boolean} overwrite - A boolean indicating whether the document should be updated (false)
 *                              or overwritten (true). [Default: false]
 * @param {function} callback -  An optional callback function to run once
 *                               the backend has updated. [Default: ()=>{}]
 * @param {boolean} verbose -  An optional boolean specifying if the function should console.log
 *                             the passed in parameters whenever it's run. [Default: false]
 */
function SetItem(
  app,
  collectionId,
  itemId,
  data,
  overwrite = false,
  callback = () => {},
  verbose = false
) {
  // Checks
  if (verbose) {
    console.log("[FIREWRAPPER|SET_ITEM]", collectionId, itemId, data);
  }
  if (!collectionId || !itemId || !data) {
    callback(CONSTANTS.ERROR, {
      message: `Invalid parameters. Missing one of collectionId:[${collectionId}], itemId:[${itemId}], or data:[${data}]`
    });
  }

  // Operation
  const db = getDatabase(app);
  const docRef = doc(db, collectionId, itemId);
  // TODO(frg100): Update DATE_MODIFIED field
  setDoc(docRef, data, { merge: !overwrite })
    .then(() => {
      callback(CONSTANTS.SUCCESS);
    })
    .catch(error => {
      callback(CONSTANTS.ERROR, error);
    });
}

/**
 * Delete a document from Firestore
 *
 * @param {object} app -  A Firebase app object (returned from `firebase/app`
 *                        `initializeApp(configObject)`)
 * @param {string} collectionId -  The collection of the document to remove
 * @param {string} itemId - The Firebase UID of the item to remove
 * @param {function} callback -  An optional callback function to run once
 *                               the backend has updated. [Default: ()=>{}]
 * @param {boolean} verbose -  An optional boolean specifying if the function should console.log
 *                             the passed in parameters whenever it's run. [Default: false]
 */
function RemoveItem(
  app,
  collectionId,
  itemId,
  callback = () => {},
  verbose = false
) {
  // Checks
  if (verbose) {
    console.log("[FIREWRAPPER|REMOVE_ITEM]", collectionId, itemId);
  }
  if (!collectionId || !itemId) {
    callback(CONSTANTS.ERROR, {
      message: `Invalid parameters. Missing one of collectionId:[${collectionId}] or itemId:[${itemId}]`
    });
  }

  // Operation
  const db = getDatabase(app);
  const docRef = doc(db, collectionId, itemId);
  deleteDoc(docRef)
    .then(() => {
      callback(CONSTANTS.SUCCESS);
    })
    .catch(error => {
      callback(CONSTANTS.ERROR, error);
    });
}

/**
 * Get all items from a collection
 *
 * @param {object} app -  A Firebase app object (returned from `firebase/app`
 *                        `initializeApp(configObject)`)
 * @param {string} collectionId -  The id of the collection whose items to get
 * @param {function} callback -  A callback function to run with the status
 *                               of the request and error message or document data
 * @param {boolean} verbose -  An optional boolean specifying if the function should console.log
 *                             the passed in parameters whenever it's run. [Default: false]
 */
function GetCollection(app, collectionId, callback, verbose = false) {
  // Checks
  if (verbose) {
    console.log("[FIREWRAPPER|GET_ALL_ITEMS]", collectionId);
  }
  if (!collectionId || !callback) {
    callback(CONSTANTS.ERROR, {
      message: `Invalid parameters. Missing one of collectionId:[${collectionId}] or callback:[${callback}]`
    });
  }

  const collectionRef = collection(db, collectionId);
  getDocs(collectionRef)
    .then(querySnapshot => {
      const items = [];
      querySnapshot.forEach(document => {
        items.push(document.data());
      });
      callback(CONSTANTS.SUCCESS, items);
    })
    .catch(error => {
      callback(CONSTANTS.ERROR, error);
    });
}

export default {
  GetItem,
  GetRealtimeItem,
  AddItem,
  SetItem,
  RemoveItem,
  GetCollection
};
