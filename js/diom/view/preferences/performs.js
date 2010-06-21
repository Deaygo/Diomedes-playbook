/*
  Copyright (c) 2010 Apphacker apphacker@gmail.com
*/
/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, setTimeout */

dojo.provide("diom.view.preferences.performs");

dojo.declare("diom.view.preferences.Performs", diom.view.preferences.PreferencesBase, {
  "-chains-": {
    destroy: "before",
    constructor: "manual"
  },
  constructor: function (model, view) {
    this.id = "Performs";
    this.formId = "performForm";
    this.listMethod = "listPerforms";
    this.selectedNetworkId = null;
    this.closePrefsBtnConnection = null;
    this.closeFormBtnConnection = null;
    this.saveFormConnection = null;
    this.addFormBtnConnection = null;
    this.aliasListConnection = null;
    this.networks = null;
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
    this.saveFormConnection = dojo.connect(dojo.byId("performForm"), "onsubmit", dojo.hitch(this, "savePerform"));
    this.addFormBtnConnection = dojo.connect(dojo.byId("addFormBtn"), "onclick", dojo.hitch(this, "showAddForm"));
    this.aliasListConnection = dojo.connect(dojo.byId("performList"), "onclick", dojo.hitch(this, "handleListClick"));
    this.displayNetworks();
    this.open();
  },
  showPerformInfo: function () {
    dojo.removeClass(dojo.byId("performInfo"), "hidden");
  },
  listPerforms: function (performs) {

    var networkName, node, r, i;

    networkName = this.getNetworkName(this.selectedNetworkId);
    if (networkName) {
      dojo.byId("networkName").innerHTML = networkName;
    } else {
      return;
    }
    node = dojo.byId("performList");
    if (!performs || !performs.length) {
      node.innerHTML = "No performs currently added for network.";
    } else {
      r = [];
      for (i = 0; i < performs.length; i++) {
        r.push(this.getPerformHTML(performs[i]));
      }
      node.innerHTML = r.join("");
    }
    this.showPerformInfo();
  },
  getPerformHTML: function (channel) {
    return [
      '<div><span class="channelname">', channel.name, '</span> ',
      '<button id="delete.', channel.id, '.', channel.networkId, '">Delete</button> ',
      '</div>'].join("");
  },
  clearForm: function () {
    dojo.byId("command").value = "";
    this.inherited(arguments);
  },
  destroy: function () {
    dojo.disconnect(this.closePrefsBtnConnection);
    delete this.closePrefsBtnConnection;
    dojo.disconnect(this.closeFormBtnConnection);
    delete this.closeFormBtnConnection;
    dojo.disconnect(this.saveFormConnection);
    delete this.saveFormConnection;
    dojo.disconnect(this.addFormBtnConnection);
    delete this.addFormBtnConnection;
    dojo.disconnect(this.aliasListConnection);
    delete this.aliasListConnection;
    this.inherited(arguments);
  },
  handleListClick: function (event) {

    var id, parts, cmd, networkId;

    id = event.target.id;
    if (id) {
      parts = id.split(".");
      if (parts.length) {
        cmd = parts[0];
        id = parts [1];
        networkId = parts[2];
        if (cmd === "delete") {
          this.deletePerform(id, networkId);
        }
      }
    }
  },
  deletePerform: function (id, networkId) {
    dojo.publish(diom.topics.PERFORM_DELETE, [id, networkId]);
    this.selectNetwork();
  },
  savePerform: function (event) {

    var performData, id;

    dojo.stopEvent(event);
    util.log("Saving perform.");
    performData = {};
    id = parseInt(dojo.byId("id").value, 10);
    performData.networkId = parseInt(dojo.byId("networkId").value, 10);
    if (!this.getItem("name", "Perform name", performData, false, true)) { return; }
    if (!this.getItem("command", "Command", performData, false, true)) { return; }
    if (!this.getItem("active", "Active", performData, true, true)) { return; }
    if (id === 0) {
      dojo.publish(diom.topics.PERFORM_ADD, [performData]);
    }
    this.selectNetwork();
  },
  getContent: function () {
    return [
      '<div class="preferences">',
        '<h1>Performs</h1>',
        '<div class="preferencesList">',
          '<div id="networksList"></div>',
          '<div id="performInfo" class="hidden">',
            '<div class="preferencesList">',
              '<div>Performs for <span id="networkName"></span>:</div>',
              '<div id="performList"></div>',
              '<button id="addFormBtn">Add a Perform</button>',
            '</div>',
            '<form class="hidden" id="performForm">',
              '<p>You can use variables such as $nick (for your nick) and $server.</p>',
              '<input type="hidden" id="id" value="0"/>',
              '<input type="hidden" id="networkId" value="0"/>',
              '<div class="formItem">',
                '<label for="name">Name: </label> <input type="text" id="name" />',
              '</div>',
              '<div class="formItem">',
                '<label for="command">Command: </label> <input type="text" id="command" />',
              '</div>',
              '<div class="formItem">',
                '<label for="active">Active: </label> <input type="checkbox" id="active"  checked="true"/>',
              '</div>',
              '<input type="submit" value="Save" />',
              '<button id="closeFormBtn">Cancel</button>',
            '</form>',
          '</div>',
        '</div>',
        '<div id="PerformInfo" class="hidden">',
          '<div class="preferencesList">',
            '<div>Performs for <span id="networkName"></span>:</div>',
            '<div id="performsList"></div>',
              '<button id="addFormBtn">Add a Perform</button>',
          '</div>',
        '</div>',
        '<div class="preferencesList">',
          '<button id="closeWindowBtn">Close Window</button>',
        '</dv>',
      '</div>'
   ].join("");
  }
});



