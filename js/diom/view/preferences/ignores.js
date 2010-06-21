//getIgnores
/*
  Copyright (c) 2010 Apphacker apphacker@gmail.com
*/
/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, setTimeout */

dojo.provide("diom.view.preferences.ignores");

dojo.declare("diom.view.preferences.Ignores", diom.view.preferences.PreferencesBase, {
  "-chains-": {
    destroy: "before",
    constructor: "manual"
  },
  constructor: function (model, view) {
    this.id = "Ignores";
    this.formId = "ignoresForm";
    this.closePrefsBtnConnection = null;
    this.closeFormBtnConnection = null;
    this.saveFormConnection = null;
    this.ignoresListConnection = null;
    this.addFormBtnConnection = null;
    this.model = model;
    this.view = view;
    this.inherited(arguments);
  },
  handleLoad: function () {
    this.model.getIgnores(dojo.hitch(this, "initialize"));
  },
  initialize: function (data) {
    this.displayIgnores(data);
    this.closePrefsBtnConnection = dojo.connect(dojo.byId("closeWindowBtn"), "onclick", dojo.hitch(this, "handleClose"));
    this.addFormBtnConnection = dojo.connect(dojo.byId("addFormBtn"), "onclick", dojo.hitch(this, "showAddForm"));
    this.saveFormConnection = dojo.connect(dojo.byId("ignoresForm"), "onsubmit", dojo.hitch(this, "saveIgnores"));
    this.closeFormBtnConnection = dojo.connect(dojo.byId("closeFormBtn"), "onclick", dojo.hitch(this, "closeForm"));
    this.ignoresListConnection = dojo.connect(dojo.byId("ignoresList"), "onclick", dojo.hitch(this, "handleListClick"));
    this.open();
  },
  clearForm: function () {
    dojo.byId("regex").value = "";
    this.inherited(arguments);
  },
  updateIgnores: function () {
    this.model.getIgnores(dojo.hitch(this, "displayIgnores"));
  },
  displayIgnores: function (ignores) {

    var node, i, r;

    node = dojo.byId("ignoresList");
    node.innerHTML = "";
    r = [];
    if (ignores && ignores.length) {
      for (i = 0; i < ignores.length; i++) {
        r.push(this.getIgnoreHTML(ignores[i]));
      }
    }
    node.innerHTML = r.join("");
  },
  getIgnoreHTML: function(ignore) {
    return [
      '<div><span class="regex">', ignore.regex, '</span> ',
      '<button id="delete.', ignore.id, '">Delete</button> ',
      '</div>'].join("");
  },
  saveIgnores: function (event) {

    var ignoreData, id;

    dojo.stopEvent(event);
    util.log("Saving Ignores.");
    ignoreData = {};
    id = parseInt(dojo.byId("id").value, 10);
    if (!this.getItem("regex", "Command", ignoreData)) { return; }
    if (!this.getItem("active", "Active", ignoreData, true)) { return; }
    if (id === 0) {
      dojo.publish(diom.topics.IGNORE_ADD, [ignoreData]);
      this.closeForm(event);
      this.updateIgnores();
      return;
    }
    this.closeForm(event);
  },
  destroy: function () {
    dojo.disconnect(this.closePrefsBtnConnection);
    delete this.closePrefsBtnConnection;
    dojo.disconnect(this.closeFormBtnConnection);
    delete this.closeFormBtnConnection;
    dojo.disconnect(this.ignoresListConnection);
    delete this.ignoresListConnection;
    dojo.disconnect(this.saveFormConnection);
    delete this.saveFormConnection;
    dojo.disconnect(this.addFormBtnConnection);
    delete this.addFormBtnConnection;
    this.inherited(arguments);
  },
  handleListClick: function (event) {

    var id, parts, cmd;

    id = event.target.id;
    if (id) {
      parts = id.split(".");
      if (parts.length) {
        cmd = parts[0];
        id = parts [1];
        if (cmd === "delete") {
          this.deleteIgnore(id);
        }
      }
    }
  },
  deleteIgnore: function (id) {
    dojo.publish(diom.topics.IGNORE_DELETE, [id]);
    this.updateIgnores();
  },
  getContent: function () {
    return [
      '<div class="preferences">',
        '<h1>Ignores</h1>',
          '<div class="preferencesList">',
            '<div id="ignoresList"></div>',
            '<button id="addFormBtn">Add an Ignore</button>',
          '</div>',
        '<form class="hidden" id="ignoresForm">',
          '<p>',
          "Create Ignores. Ignores are regular expresions. To ignore only by nick use ^joe! to ignore 'joe' for example.",
          '</p>',
          '<p>',
          "Otherwise if you only put a nick such as 'joe', without the ^ and ! you'll ignore people who might have parts of this ",
          'nick in their host or nick:<br/>',
          'Dave!joe@blah.com would get ignored<br/>',
          '</p>',
          '<input type="hidden" id="id" value="0"/>',
          '<div class="formItem">',
            '<label for="regex">Regex: </label> <input type="text" id="regex" />',
          '</div>',
          '<div class="formItem">',
            '<label for="active">Active: </label> <input type="checkbox" id="active"  checked="true"/>',
          '</div>',
          '<div class="preferencesList">',
            '<input type="submit" value="Save" />',
            '<button id="closeFormBtn">Cancel</button>',
          '</dv>',
        '</form>',
        '<div class="preferencesList">',
          '<button id="closeWindowBtn">Close Window</button>',
        '</dv>',
      '</div>'
   ].join("");
  }
});



