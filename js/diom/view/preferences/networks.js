/*
  Copyright (c) 2010 Apphacker apphacker@gmail.com
*/
/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, setTimeout */

dojo.provide("diom.view.preferences.networks");

dojo.declare("diom.view.preferences.Networks", diom.view.preferences.PreferencesBase, {
  "-chains-": {
    destroy: "before",
    constructor: "manual"
  },
  constructor: function (model, prefs, view) {
    this.id = "Networks";
    this.formId = "networksForm";
    this.closePrefsBtnConnection = null;
    this.closeFormBtnConnection = null;
    this.addFormBtnConnection = null;
    this.saveFormConnection = null;
    this.networksListConnection = null;
    this.networks = null;
    this.prefs = prefs;
    this.model = model;
    this.view = view;
    this.inherited(arguments);
  },
  handleLoad: function () {
    this.model.getNetworks(dojo.hitch(this, "initialize"));
  },
  initialize: function (data) {
    this.networks = data;
    this.closePrefsBtnConnection = dojo.connect(dojo.byId("closeWindowBtn"), "onclick", dojo.hitch(this, "handleClose"));
    this.closeFormBtnConnection = dojo.connect(dojo.byId("closeFormBtn"), "onclick", dojo.hitch(this, "closeForm"));
    this.addFormBtnConnection = dojo.connect(dojo.byId("addFormBtn"), "onclick", dojo.hitch(this, "showAddForm"));
    this.networksListConnection = dojo.connect(dojo.byId("networksList"), "onclick", dojo.hitch(this, "handleListClick"));
    this.saveFormConnection = dojo.connect(dojo.byId("networksForm"), "onsubmit", dojo.hitch(this, "saveNetworks"));
    this.displayNetworks();
    this.open();
  },
  saveNetworks: function (event) {

    var networkData, id;

    dojo.stopEvent(event);
    util.log("Saving Networks.");
    networkData = {};
    //get prefs
    id = parseInt(dojo.byId("id").value, 10);
    if (!this.getItem("name", "Network name", networkData, false, true)) { return; }
    if (!this.getItem("nick", "Nick", networkData, false, true)) { return; }
    if (!this.getItem("altNick", "Alternate nick", networkData, false, true)) { return; }
    if (!this.getItem("userName", "Username", networkData, false, true)) { return; }
    if (!this.getItem("realName", "Real name", networkData, false, true)) { return; }
    if (!this.getItem("finger", "Finger", networkData, false, true)) { return; }
    if (!this.getItem("active", "Active", networkData, true, true)) { return; }
    if (!this.getItem("autoJoin", "Auto join", networkData, true, true)) { return; }
    if (id === 0) {
      dojo.publish(diom.topics.NETWORK_ADD, [networkData]);
      this.closeForm(event);
      this.model.getNetworks(dojo.hitch(this, "handleModelLoad"));
      return;
    } else {
      networkData.id = id;
      this.updateNetworks(networkData);
      dojo.publish(diom.topics.NETWORK_EDIT, [id, networkData]);
    }
    this.closeForm(event);
  },
  updateNetworks: function (network) {

    var i, temp;

    for (i = 0; i < this.networks.length; i++) {
      temp = this.networks[i];
      if (temp.id === network.id) {
        this.networks[i] = network;
        this.displayNetworks(this.networks);
        return;
      }
    }
  },
  destroy: function () {
    dojo.disconnect(this.closePrefsBtnConnection);
    delete this.closePrefsBtnConnection;
    dojo.disconnect(this.closeFormBtnConnection);
    delete this.closeFormBtnConnection;
    dojo.disconnect(this.addFormBtnConnection);
    delete this.addFormBtnConnection;
    dojo.disconnect(this.networksListConnection);
    delete this.networksListConnection;
    dojo.disconnect(this.saveFormConnection);
    delete this.saveFormConnection;
    this.inherited(arguments);
  },
  displayNetworks: function () {

    var node, r, i;

    node = dojo.byId("networksList");
    node.innerHTML = "";
    r = [];
    if (!this.networks) { return; }
    for (i = 0; i < this.networks.length; i++) {
      r.push(this.getNetworkHTML(this.networks[i]));
    }
    node.innerHTML = r.join("");
  },
  clearForm: function () {

    var node, pref;

    for (pref in this.prefs) {
      if (this.prefs.hasOwnProperty(pref)) {
        node = dojo.byId(pref);
        if (node) {
          node.value = this.prefs[pref];
        }
      }
    }
    this.inherited(arguments);
  },
  handleListClick: function (event) {

    var id, parts, cmd;

    id = event.target.id;
    if (id) {
      parts = id.split(".");
      if (parts.length) {
        cmd = parts[0];
        id = parseInt(parts[1], 10);
        if (cmd === "edit") {
          dojo.stopEvent(event);
          this.showEditForm(id);
        } else if (cmd === "delete") {
          dojo.stopEvent(event);
          this.deleteNetwork(id);
          this.closeForm(event);
        }
      }
    }
  },
  showEditForm: function (id) {

    var network, i, keys, key;

    network = null;
    for (i = 0; i < this.networks.length; i++) {
      if (this.networks[i].id === id) {
        network = this.networks[i];
        break;
      }
    }
    if (!network) { return; }
    keys = ["id", "name", "nick", "altNick", "userName", "realName", "finger"];
    for (i = 0; i < keys.length; i++) {
      key = keys[i];
      dojo.byId(key).value = network[key];
    }
    dojo.byId("active").checked = network.active;
    dojo.byId("autoJoin").checked = network.autoJoin;
    this.showForm();
  },
  deleteNetwork: function (id) {

    var newNetworks, i, network;

    dojo.publish(diom.topics.NETWORK_DELETE, [id]);
    newNetworks = [];
    for (i = 0; i < this.networks.length; i++) {
      network = this.networks[i];
      if (network.id !== id) {
        newNetworks.push(network);
      }
    }
    this.networks = newNetworks;
    this.displayNetworks();
  },
  getNetworkHTML: function (network) {
    return [
      '<div><span class="networkName">', network.name, '</span> ',
      '<button id="edit.', network.id, '">Edit</button> ',
      '<button id="delete.', network.id, '">Delete</button> ',
      '</div>'].join("");
  },
  getContent: function () {
    return [
      '<div class="preferences">',
        '<h1>Networks</h1>',
        '<div class="preferencesList" id="networksList"></div>',
        '<div class="preferencesList">',
          '<button id="addFormBtn">Add a Network</button>',
        '</div>',
        '<form class="hidden" id="networksForm">',
          '<input type="hidden" id="id" value="0"/>',
          '<div class="formItem">',
            '<label for="name">Name: </label> <input type="text" id="name" />',
          '</div>',
          '<div class="formItem">',
            '<label for="nick">Nick: </label> <input type="text" id="nick" />',
          '</div>',
          '<div class="formItem">',
            '<label for="altNick">Alternative nick: </label> <input type="text" id="altNick" />',
          '</div>',
          '<div class="formItem">',
            '<label for="userName">Username: </label> <input type="text" id="userName" />',
          '</div>',
          '<div class="formItem">',
            '<label for="realName">Real Name: </label> <input type="text" id="realName" />',
          '</div>',
          '<div class="formItem">',
            '<label for="finger">Finger: </label> <input type="text" id="finger" />',
          '</div>',
          '<div class="formItem">',
            '<label for="active">Active: </label> <input type="checkbox" id="active"  checked="true"/>',
          '</div>',
          '<div class="formItem">',
            '<label for="autoJoin">Auto join: </label> <input type="checkbox" id="autoJoin" checked="true" />',
          '</div>',
          '<div class="preferencesList">',
            '<input type="submit" value="Save" />',
            '<button id="closeFormBtn">Cancel</button>',
          '</div>',
        '</form>',
        '<div class="preferencesList">',
          '<button id="closeWindowBtn">Close Window</button>',
        '</div>',
      '</div>'
   ].join("");
  }
});


