/*
  Copyright (c) 2009 Apphacker apphacker@gmail.com
*/
/*jslint white: false */
/*jslint nomen: false */
/*jslint regexp: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util, diom, air, document */

dojo.provide("diom.view.view");

dojo.declare("diom.view.View", null, {

  /**
  * @constructor
  */
  constructor: function (model) {

    var prefs;

    this.model = model;
    this.prevWord = null;
    this.input = new diom.view.FormInput(util.get("textInput"));
    this.popup = util.get("popup");
    this.popupContents = util.get("popupContents");
    this.linkView = new diom.view.LinkView(this.popupContents);
    this.activityWindow = util.get("activityWindow");
    this.channelList = util.get("channelList");
    this.channelMap = new diom.view.ChannelMap();
    this.titleBar = util.get("titleBar");
    this.nickList = util.get("nickList");
    this.font = null;
    prefs = this.model.prefs.getPrefs();
    this.changeFont(prefs.multiOptionPrefs.font, prefs.fontSize);
    this.changeTheme(prefs.multiOptionPrefs.theme);
    this.activityWindows = {};
    this.activeWin = null;
    this.activeNickCount = 0;
    this.nickListCollapsed = false;
    this.appVersion = "";

    dojo.connect(window, "onclick", this, "handleActivityWindowClick");
    dojo.connect(this.titleBar, "onclick", this, "handleTitleBarClick");
    dojo.connect(util.get("prefBtn"), "onclick", this, "handlePrefsBtnClick");
    dojo.connect(util.get("linksBtn"), "onclick", this, "handleLinksBtnClick");
    dojo.connect(util.get("closePopup"), "onclick", this, "closePopup");
    dojo.connect(window, "onclick", this, "handleWindowClick");
    dojo.subscribe(diom.topics.POPUP_CLOSE, this, "handleWindowClick");
    dojo.subscribe(diom.topics.USER_HIGHLIGHT, this, "highlight");
    dojo.subscribe(diom.topics.PREFS_CHANGE_FONT, this, "changeFont");
    dojo.subscribe(diom.topics.PREFS_CHANGE_THEME, this, "changeTheme");
    dojo.subscribe(diom.topics.NOTIFY, this, "notify");
    dojo.subscribe(diom.topics.CHANNEL_TOPIC, this, "handleTopic");
    dojo.subscribe(diom.topics.NICK_CHANGE, this, "handleNickChange");
    dojo.subscribe(diom.topics.INPUT_PAGE_UP, this, "scrollUp");
    dojo.subscribe(diom.topics.INPUT_PAGE_DOWN, this, "scrollDown");
    dojo.subscribe(diom.topics.INPUT_CHANNEL_NEXT, this, "selectNextChannel");
    dojo.subscribe(diom.topics.INPUT_CHANNEL_PREV, this, "selectPrevChannel");
    dojo.subscribe(diom.topics.INPUT_CHANNEL_PART, this, "closeCurrentChannel");
    dojo.subscribe(diom.topics.INPUT_CHANNEL_INDEX, this, "selectChannelFromIndex");
    dojo.subscribe(diom.topics.UPDATE_NO_NEW_UPDATES, this, "showNoUpdatesDialog");
    dojo.subscribe(diom.topics.NICK_LIST_TOGGLE, this, "handleNickListControlClick");
  },

  /**
  * @private
  * @type {diom.view.channelMap}
  */
  channelMap: null,

  /**
  * @public
  */
  showNoUpdatesDialog: function() {
    this.notify("No new updates.");
  },

  /**
  * If there's an activity view, scroll it one
  * page up.
  * @public
  */
  scrollUp: function () {
    if (this.activeWin) {
      this.activeWin.scrollUp();
    }
  },

  /**
  * If there's an activity view, scroll it one
  * page down.
  * @public
  */
  scrollDown: function () {
    if (this.activeWin) {
      this.activeWin.scrollDown();
    }
  },

  /**
  * If there's an activity window, scroll
  * all the way to the bottom.
  * @public
  */
  scrollToBottom: function () {
    if (this.activeWin) {
      this.activeWin.scrollToBottom();
    }
  },

  /**
  * @param {!Object} e
  * @private
  */
  closePopup: function (e) {
    dojo.addClass(this.popup, "hidden");
    this.popupContents.innerHTML = "";
  },

  /**
  * @param {!Object} e
  * @private
  */
  handleLinksBtnClick: function (e) {
    dojo.stopEvent(e);
    this.linkView.display();
    dojo.removeClass(this.popup, "hidden");
  },

  /**
  * @param {!Object} e
  * @private
  */
  handlePrefsBtnClick: function (e) {
    dojo.stopEvent(e);
    dojo.removeClass(this.titleBar, "hidden");
  },

  /**
  * @param {!Object} e
  * @private
  */
  handleWindowClick: function (e) {
    dojo.addClass(this.titleBar, "hidden");
  },

  /**
  * Sets the application's top document bar
  * with a topic.
  * @param {!string} channelName
  * @param {!string} topic
  * @public
  */
  setTopicView: function (channelName, topic) {
    var msg = channelName, nickCount = "";
    if (this.activeNickCount) {
      nickCount = " (" + this.activeNickCount + ") ";
    }
    if (topic) {
      msg += nickCount + ": " + topic;
    }
    document.title = msg;
  },

  /**
  * @param {Array} nicks
  * @param {String} serverName
  * @param {String} channelName
  * @param {String} connectionId
  * @private
  */
  handleNickChange: function (nicks, serverName, channelName, connectionId) {
    var topic, tmp;
    if (this.activeWin.getConnectionId() === connectionId && this.activeWin.channelName === channelName) {
      this.activeNickCount = nicks.length;
      tmp = document.title.split(": ");
      tmp.shift();
      topic = tmp.join(": ");
      this.setTopicView(channelName, topic);
    }
  },

  /**
  * @param {String} serverName
  * @param {String} channelName
  * @param {String} topic
  * @param {String} connectionId
  * @private
  */
  handleTopic: function (serverName, channelName, topic, connectionId) {
    if (this.activeWin.getConnectionId() === connectionId && this.activeWin.channelName === channelName) {
      this.setTopicView(channelName, topic);
    }
  },

  changeTheme: function (themePrefs) {
    var i, theme;
    for (i = 0; i < themePrefs.length; i++) {
      theme = themePrefs[i];
      if ("selected" in theme) {
        this.setTheme(theme.value);
        return;
      }
    }
  },

  setTheme: function (themeName) {
    var cssPath = "/css/themes/", n;
    n = util.get("themeLink");
    n.setAttribute("href", [cssPath, themeName, ".css"].join(""));
  },

  changeFont: function (fontPrefs, size) {
    var i, font;
    for (i = 0; i < fontPrefs.length; i++) {
      font = fontPrefs[i];
      if ("selected" in font) {
        this.setFont(font.value, size);
        return;
      }
    }
  },

  setFont: function (font, size) {
    this.font = font;
    size = parseInt(size, 10);
    if (size < 8) {
      size = 8;
    } else if (size > 32) {
      size = 32;
    }
    size = size.toString();
    util.get("body").setAttribute("style", [
      "font-family: ",
      font,
      ";",
      "font-size: ",
      size,
      "px;"
  ].join(""));
  },

  notify: function (msg) {

    var dialog, params;

    if (msg) {
      params = {
        center: true,
        auto: true,
        title: "Notice",
        content: msg
      };
      dialog = new diom.view.dialog.Dialog(params);
    }
  },

  setAppVersion: function (info) {
    this.appVersion = info;
  },

  sanitize: function (msg) {
    if (msg) {
      msg = msg.split("&").join("&amp;");
      msg = msg.split("<").join("&lt;");
      msg = msg.split(">").join("&gt;");
      msg = msg.split('"').join("&quot;");
    }
    return msg;
  },

  getConfirmation: function (msg) {
    return window.confirm("You're about to " + msg + ". Are you sure? ");
  },

  setContents: function (node, contents, synchronous) {
    if (synchronous) {
      node.innerHTML = contents;
    } else {
      //performance gain
      window.setTimeout(function() { node.innerHTML = contents; }, 0);
    }
  },

  clearActivityView: function () {
    if (this.activeWin) {
      this.activeWin.clear();
    }
  },

  clearNickView: function () {
    this.activeWin.nickWindow.clear();
  },

  displayHelp: function () {

    var dialog;

    dialog = new diom.view.Help();
  },

  /**
  * @param {String} serverName
  * @param {String} channelName
  * @param {String} topic
  * @param {String} connectionId
  * @public
  */
  changeView: function (serverName, channelName, topic, connectionId) {
    this.createActivityViewIfNeeded(channelName, serverName, connectionId);
    this.activeWin = this.getActivityWindow(channelName, serverName, connectionId);
    this.setTopicView(channelName, topic);
    if (this.activityWindow.childNodes.length) {
      this.activityWindow.replaceChild(this.activeWin.getNode(), this.activityWindow.firstChild);
    } else {
      this.activityWindow.appendChild(this.activeWin.getNode());
    }
    if (this.nickList.childNodes.length) {
      this.nickList.replaceChild(this.activeWin.nickWindow.getNode(), this.nickList.firstChild);
    } else {
      this.nickList.appendChild(this.activeWin.nickWindow.getNode());
    }
    this.activeWin.changeView();
    this.input.changeChannel(this.activeWin.nickWindow.getNicks(), serverName, channelName, connectionId);
  },

  /**
  * @param {Object} e
  * @private
  */
  handleActivityWindowClick: function (e) {

    var url, urlReq;

    if (e.target.nodeName === "A") {
      dojo.stopEvent(e);
      url = e.target.getAttribute("href");
      if (url) {
        urlReq = new air.URLRequest(dojo.trim(url));
        air.navigateToURL(urlReq);
      }
    }
    if (e.target.id === "nickListControl") {
      dojo.stopEvent(e);
      this.handleNickListControlClick();
      return;
    }
    if (!e[util.EVENT_HANDLED]) {
      this.input.focus();
      this.handleWindowClick(e);
      this.scrollDown();
    }
  },

  /**
  * @param {HTMLElement} n
  * @private
  */
  closeTabFromNode: function (n) {

    var server, name, connectionId;

    if (n) {
      server = n.getAttribute("server");
      name = n.getAttribute("name");
      connectionId = n.getAttribute("connectionId");
      if (name === server) {
        window.setTimeout(function() {
          dojo.publish(diom.topics.NETWORK_CLOSE, [server, connectionId]);
        }, 0);
      } else {
        window.setTimeout(function() {
          dojo.publish(diom.topics.CHANNEL_CLOSE, [server, name, connectionId]);
        }, 0);
      }
    }
  },

  /**
  * @param {HTMLElement} n
  * @private
  */
  selectChannelFromNode: function (n) {

    var server, type, name, connectionId;

    if (n) {
      server = n.getAttribute("server");
      type = n.getAttribute("type");
      name = n.getAttribute("name");
      connectionId = n.getAttribute("connectionId");
      window.setTimeout(function() {
        dojo.publish(diom.topics.CHANNEL_SELECTED, [server, type, name, connectionId]);
      }, 0);
    }
  },

  /**
  * @param {Array} users
  * @param {String} serverName
  * @param {String} channelName
  * @param {String} connectionId
  * @public
  */
  updateNickView: function (users, serverName, channelName, connectionId) {
    this.createActivityViewIfNeeded(channelName, serverName, connectionId);
    this.getActivityWindow(channelName, serverName, connectionId).nickWindow.update(users, channelName);
  },
  /**
  * @param {!string} channelKey
  * @param {!string} channelName
  * @param {!string} connectionId
  * @param {!string} channelBtnId
  * @private
  * @return {!diom.view.ChannelButton}
  */
  getOrCreateChannelButton: function (channelKey, channelName, connectionId, channelBtnId) {

    var channelBtn;

    if (channelBtnId) {
      channelBtn = this.channelMap.getButtonWithId(channelBtnId);
    } else {
      channelBtn = new diom.view.ChannelButton({
        channelName: channelName,
        channelKey: channelKey,
        connectionId: connectionId
      });
      channelBtnId = channelBtn.getId();
      this.channelMap.addButton(channelBtn);
      dojo.place(channelBtn.domNode, this.channelList, "last");
    }
    return channelBtn;
  },
  /**
  * Eliminating known channels so they are not pruned at the end.
  * Whatever is left in currentIds at the end of channelUpdateView
  * are removed, assumed to no longer exist.
  * @param {!string} channelBtnId
  * @param {!Array.<string>} currentIds
  * @private
  * @return {!Array.<string>}
  */
  checkId: function (channelBtnId, currentIds) {

    var  index, tempR;

    if(channelBtnId) {
      index = currentIds.indexOf(channelBtnId);
      tempR = [].concat(currentIds.slice(0, index), currentIds.slice(index + 1));
      currentIds = tempR;
    }
    return currentIds;
  },
  /**
  * @param {Array} channels
  * @param {Array} channelsWithActivity
  * @param {Array} channelsWithHighlight
  * @param {Array} serverChannelList
  * @public
  */
  updateChannelView: function (channels, channelsWithActivity, channelsWithHighlight, serverChannelList) {

    var channelButtons, currentIds, channelsR, serverName, channelMap, activeChannels, highlightedChannels,
      channelKey, channelName, connectionId, channelBtn, channelBtnId;

    util.log("updateChannelView");
    if (!channels) { return; }
    currentIds = this.channelMap.getAllIds();
    channelsR = [];
    for (connectionId in channels) {
      if (channels.hasOwnProperty(connectionId)) {
        serverName = serverChannelList[connectionId].getName();
        channelBtnId = this.channelMap.getButtonIdWithInfo(serverName, connectionId);
        this.getOrCreateChannelButton(serverName, serverName, connectionId, channelBtnId);
        currentIds = this.checkId(channelBtnId, currentIds);
        channelMap = channels[connectionId];
        if (connectionId in channelsWithActivity) {
          activeChannels = channelsWithActivity[connectionId];
        } else {
          activeChannels = null;
        }
        if (connectionId in channelsWithHighlight) {
          highlightedChannels = channelsWithHighlight[connectionId];
        } else {
          highlightedChannels = null;
        }
        for (channelKey in channelMap) {
          //channelKey is channelName in lowercase, channelName may have weird capitalization.
          if (channelMap.hasOwnProperty(channelKey)) {
            channelName = channelMap[channelKey].getName();
            channelsR.push(channelName);
            channelBtnId = this.channelMap.getButtonIdWithInfo(channelKey, connectionId);
            channelBtn = this.getOrCreateChannelButton(channelKey, channelName, connectionId, channelBtnId);
            currentIds = this.checkId(channelBtnId, currentIds);
            if (activeChannels && (channelKey in activeChannels)) {
              channelBtn.setActivity(activeChannels[channelKey]);
            }
            if (highlightedChannels && (channelKey in highlightedChannels)) {
              channelBtn.highlight();
            }
          }
        }
      }
    }
    console.dump(currentIds);
    dojo.forEach(currentIds, dojo.hitch(this, function (id) {
      this.channelMap.removeButtonWithId(id);
    }));
    this.input.setChannels(channelsR);
  },

  closeCurrentChannel: function () {

    var buttonId;

    buttonId = this.channelMap.getActiveButtonId();
    this.channelMap.selectPrevChannel();
    this.selectPrevChannel();
    this.channelMap.removeButtonWithId(buttonId);
  },

  selectPrevChannel: function () {

    var buttonId;

    buttonId = this.channelMap.getPreviousButtonId();
    if (buttonId) {
      this.channelMap.setActiveButton(buttonId);
    }
  },

  selectChannelFromIndex: function (index) {

    var allButtons, buttonId;

    allButtons = this.channelMap.getAllIds();
    if (index && index >= 0 && index < allButtons.length) {
      buttonId = allButtons[index];
      this.channelMap.setActiveButton(buttonId);
    }
  },

  selectNextChannel: function () {

    var buttonId;

    buttonId = this.channelMap.getNextButtonId();
    if (buttonId) {
      this.channelMap.setActiveButton(buttonId);
    }
  },

  /**
  * @param {String} server
  * @param {String} channelKey
  * @param {String} channelName
  * @param {String} type
  * @param {Number} activity
  * @param {Boolean} higlight
  * @param {String} connectionId
  * @private
  */
  getChannelButton: function (server, channelKey, channelName, type, activity, highlight, connectionId) {
    var channelActivity, currentChannel;
    //channelKey is channelName in lowercase
    channelActivity = "";
    if (activity) {
      channelActivity = [
        ' <span class="channelActivity">&nbsp;',
        activity,
        ' </span> '
    ].join("");
    }
    if (this.activeWin) {
      currentChannel = (channelKey === this.activeWin.channelName &&
        connectionId === this.activeWin.getConnectionId());
    } else {
      currentChannel = false;
    }
    return [
        ' <a href="#" class="channelBtn',
        (activity ? " hasActivity " : ""),
        (highlight ? " highlight " : ""),
        (currentChannel  ? " currentChannel " : ""),
        '" type="',
        this.sanitize(type),
        '" server="',
        this.sanitize(server),
        '" name="',
        this.sanitize(channelKey),
        '" connectionId="',
        connectionId,
        '">',
          ' <span class="closeChannelBtn"></span>',
          '</span> ',
          ' <span class="channelBtnWrapper"> ',
          channelActivity,
          ' <span class="channelBtnName" >',
            this.sanitize(channelName),
          ' </span>',
        '</a> '
    ].join("");
  },

  finishChannelChange: function () {
    this.input.focus();
  },

  /**
  * @param {String} channelName
  * @param {String} serverName
  * @param {String} connectionId
  * @private
  */
  createActivityViewIfNeeded: function (channelName, serverName, connectionId) {
    channelName = channelName.toLowerCase();
    if (!(connectionId in this.activityWindows)) {
      this.activityWindows[connectionId] = {};
    }
    if (!(channelName in this.activityWindows[connectionId])) {
      this.activityWindows[connectionId][channelName] = new diom.view.ActivityWindow(
          serverName,
          channelName,
          this.model.prefs.getPrefs().historyLength,
          this.model.prefs.getPrefs().multiOptionPrefs.time,
          connectionId
    );
    }
  },

  /**
  * @param {String} channelName
  * @param {String} serverName
  * @param {String} connectionId
  * @private
  */
  getActivityWindow: function (channelName, serverName, connectionId) {
    channelName = channelName.toLowerCase();
    if (connectionId in this.activityWindows) {
      if (channelName in this.activityWindows[connectionId]) {
        return this.activityWindows[connectionId][channelName];
      }
    }
    return null;
  },

  /**
  * @param {Array} messages
  * @param {String} userNick
  * @param {String} channelName
  * @param {String} serverName
  * @param {String} connectionId
  * @public
  */
  updateActivityView: function (messages, userNick, channelName, serverName, connectionId) {
    this.createActivityViewIfNeeded(channelName, serverName, connectionId);
    this.getActivityWindow(channelName, serverName, connectionId).update(messages, userNick, channelName);
  },

  highlight: function () {
    var na, nt, nw, icon;
    if (air) {
      na = air.NativeApplication;
      nt = air.NotificationType;
      nw = air.NativeWindow;
      if (na.supportsDockIcon) {
        //bounce dock icon
        icon = na.nativeApplication.icon;
        icon.bounce(nt.CRITICAL);
      } else if (nw.supportsNotification) {
        //flash taskbar
        window.nativeWindow.notifyUser(nt.CRITICAL);
      }
    }
  },

  getInput: function () {
    return this.input.getValue();
  },

  destroy: function () {
    util.log("destroying view");
    this.input.destroy();
  },

  handleAboutBtnClick: function (e) {

    var params, callback, s;

    s = [
      '<div class="aboutDialog">',
        '<h1>', this.appVersion, '</h1><br/>',
        '<p>Twitter: <a href="http://twitter.com/apphacker">@apphacker</a></p>',
        '<p>Email: <a href="mailto:apphacker@gmail.com">apphacker@gmail.com</a></p>',
        '<p>Website: <a href="http://apphackers.com">apphackers.com</a></p>',
        '<p>Blog: <a href="http://blog.apphackers.com">blog.apphackers.com</a></p>',
        '<p>IRC: #diomedes on irc.freenode.org</p><br/>',
        '<p>Thank you for using Diomedes!</p>',
      '</div>'
  ].join("");

    params = {
      center: true,
      auto: true,
      title: "About Diomedes IRC",
      content: s
    };
    return new diom.view.dialog.Dialog(params);
  },

  handleUpdateBtnClick: function (e) {
    dojo.publish(diom.topics.UPDATE_CHECK, []);
  },

  handleHelpBtnClick: function (e) {
    this.displayHelp();
  },

  handlePerformBtnClick: function (e) {
    return new diom.view.preferences.Performs(this.model.networks, this);
  },

  handleChannelsBtnClick: function (e) {
    return new diom.view.preferences.Channels(this.model.networks, this);
  },

  handleServersBtnClick: function (e) {
    return new diom.view.preferences.Servers(this.model.networks, this);
  },

  handleIgnoresBtnClick: function (e) {
    return new diom.view.preferences.Ignores(this.model.ignores, this);
  },

  handleAliasesBtnClick: function (e) {
    return new diom.view.preferences.Aliases(this.model.aliases, this);
  },

  handleNetworksBtnClick: function (e) {
    return new diom.view.preferences.Networks(this.model.networks, this.model.prefs.getPrefs(), this);
  },

  handlePrefBtnClick: function (e) {
    return new diom.view.preferences.Preferences(this.model.prefs.getPrefs());
  },
  handleNickListControlClick: function () {
    if (this.nickListCollapsed) {
      dojo.removeClass(this.nickList, "collapsed");
      dojo.removeClass(this.activityWindow, "expanded");
      dojo.removeClass(dojo.byId("nickListControl"), "collapsed");
    } else {
      dojo.addClass(this.nickList, "collapsed");
      dojo.addClass(this.activityWindow, "expanded");
      dojo.addClass(dojo.byId("nickListControl"), "collapsed");
    }
    this.nickListCollapsed = !this.nickListCollapsed;
    this.scrollToBottom();
  },
  handleTitleBarClick: function (e) {
    var id, funcName;
    dojo.stopEvent(e);
    id = e.target.id;
    if (id) {
      funcName = "handle" + id + "Click";
      if (this[funcName]) {
        this[funcName](e);
      }
    }
    this.handleWindowClick(e);
  }

});
