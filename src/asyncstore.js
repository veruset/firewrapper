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
    where,
    getFirestore,
    deleteDoc,
    FieldValue,
    connectFirestoreEmulator
  } from 'firebase/firestore';
  import { merge } from 'lodash';
  
  import CONSTANTS from './constants';
  
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
      console.log('[FIREWRAPPER|GET_ITEM]', collectionId, itemId);
    }
    if (!collectionId || !itemId || !callback) {
      callback(CONSTANTS.ERROR, {
        message: `Invalid parameters. Missing one of collectionId:[${collectionId}], itemId:[${itemId}], or callback:[${callback}]`,
      });
      return;
    }
  
    // Operation
    const db = getFirestore(app);
    const docRef = doc(db, collectionId, itemId);
    getDoc(docRef).then((docSnapshot) => {
      if (docSnapshot.exists()) {
        callback(CONSTANTS.SUCCESS, docSnapshot.data());
      } else {
        callback(CONSTANTS.ERROR, {
          message: 'No Document found (snapshot.exists() is false)',
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
  export function GetRealtimeItem(app, collectionId, itemId, callback, verbose = false) {
    // Checks
    if (verbose) {
      console.log('[FIREWRAPPER|GET_REALTIME_ITEM]', collectionId, itemId);
    }
    if (!collectionId || !itemId || !callback) {
      callback(CONSTANTS.ERROR, {
        message: `Invalid parameters. Missing one of collectionId:[${collectionId}], itemId:[${itemId}], or callback:[${callback}]`,
      });
      return;
    }
  
    // Operation
    const db = getFirestore(app);
    const docRef = doc(db, collectionId, itemId);
    const unsub = onSnapshot(docRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        callback(CONSTANTS.SUCCESS, docSnapshot.data(), unsub);
      } else {
        callback(CONSTANTS.ERROR, {
          message: 'No Document found (snapshot.exists() is false)',
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
      console.log('[FIREWRAPPER|ADD_ITEM]', collectionId, data);
    }
    if (!collectionId || !data || !callback) {
      callback(CONSTANTS.ERROR, {
        message: `Invalid parameters. Missing one of collectionId:[${collectionId}], data:[${data}], or callback:[${callback}]`,
      });
      return;
    }
  
    // Operation
    const db = getFirestore(app);
    const docRef = doc(collection(db, collectionId));
  
    // Add/update metadata
    const currentdate = new Date();
    const _METADATA = {
      _DATE_LAST_MODIFIED: currentdate,
      _DATE_CREATED: currentdate,
      _DOCUMENT_ID: docRef.id,
    };
  
    // Join metadata with data
    const document = { ...data, _METADATA };
  
    setDoc(docRef, document)
      .then(() => {
        callback(CONSTANTS.SUCCESS, docRef);
      })
      .catch((error) => {
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
    verbose = false,
    useDelay = false,
  ) {
    // Checks
    if (verbose) {
      console.log('[FIREWRAPPER|SET_ITEM]', collectionId, itemId, data);
    }
    if (!collectionId || !itemId || !data) {
      callback(CONSTANTS.ERROR, {
        message: `Invalid parameters. Missing one of collectionId:[${collectionId}], itemId:[${itemId}], or data:[${data}]`,
      });
      return;
    }
  
    // Add/update metadata
    const currentdate = new Date();
    const _METADATA = {
      _DATE_LAST_MODIFIED: currentdate,
      _DOCUMENT_ID: itemId,
    };
    if (overwrite || !data._METADATA || !data._METADATA._DATE_CREATED) {
      _METADATA._DATE_CREATED = currentdate;
    }
  
    // Join metadata with data
    const document = { ...data, _METADATA };
  
    const db = getFirestore(app);
    const docRef = doc(db, collectionId, itemId);
    console.log('SAVING TO BACKEND');
    // TODO(frg100): Update DATE_MODIFIED field
    return setDoc(docRef, document, { merge: !overwrite })
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
  function RemoveItem(app, collectionId, itemId, callback = () => {}, verbose = false) {
    // Checks
    if (verbose) {
      console.log('[FIREWRAPPER|REMOVE_ITEM]', collectionId, itemId);
    }
    if (!collectionId || !itemId) {
      callback(CONSTANTS.ERROR, {
        message: `Invalid parameters. Missing one of collectionId:[${collectionId}] or itemId:[${itemId}]`,
      });
      return;
    }
  
    // Operation
    const db = getFirestore(app);
    const docRef = doc(db, collectionId, itemId);
    deleteDoc(docRef)
      .then(() => {
        callback(CONSTANTS.SUCCESS);
      })
      .catch((error) => {
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
      console.log('[FIREWRAPPER|GET_ALL_ITEMS]', collectionId);
    }
    if (!collectionId || !callback) {
      callback(CONSTANTS.ERROR, {
        message: `Invalid parameters. Missing one of collectionId:[${collectionId}] or callback:[${callback}]`,
      });
      return;
    }
  
    const collectionRef = collection(db, collectionId);
    getDocs(collectionRef)
      .then((querySnapshot) => {
        const items = [];
        querySnapshot.forEach((document) => {
          items.push(document.data());
        });
        callback(CONSTANTS.SUCCESS, items);
      })
      .catch((error) => {
        callback(CONSTANTS.ERROR, error);
      });
  }
  
  function clearCacheBeforeUnload(e) {
    const timerIDsKey = 'TIMER_IDS';
    const timerIds = JSON.parse(localStorage.getItem(timerIDsKey));
    if (timerIds.lenth > 0) {
      e.preventDefault();
      e.returnValue = 'We\'re still saving your data...please wait a couple seconds!';
    }
  }
  
  export default {
    GetItem,
    GetRealtimeItem,
    AddItem,
    SetItem,
    RemoveItem,
    GetCollection,
    clearCacheBeforeUnload
  };
  